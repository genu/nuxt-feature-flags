/* eslint-disable @typescript-eslint/ban-ts-comment */
import { defu } from 'defu'
import { defineNuxtModule, createResolver, addImports, addPlugin, addTypeTemplate } from '@nuxt/kit'
import type { FeatureFlagsConfig } from './runtime/types'
import { consolador } from './runtime/logger'
import { loadConfigFile } from './runtime/core/config-loader'

export default defineNuxtModule<FeatureFlagsConfig>({
  meta: {
    name: 'nuxt-feature-flags',
    compatibility: {
      nuxt: '>=3.6.1',
      bridge: false,
    },
    configKey: 'featureFlags',
  },
  async setup(options, nuxt) {
    // @ts-ignore
    const resolver = createResolver(import.meta.url)

    if (options.config) {
      try {
        consolador.info('Loading feature flags from:', options.config)
        const { config: configFlags, configFile } = await loadConfigFile(options.config, nuxt.options.rootDir)
        consolador.info('Loaded feature flags:', configFlags)
        options.flags = defu(options.flags, configFlags || {})

        // For runtime usage
        nuxt.options.runtimeConfig._feature_flags_config_path = configFile
      }
      catch (error) {
        consolador.error('Failed to load feature flags configuration:', error)
      }
    }

    nuxt.options.runtimeConfig.public.featureFlags = defu(
      // @ts-ignore
      nuxt.options.runtimeConfig.public.featureFlags, options)

    nuxt.options.nitro = nuxt.options.nitro || {}
    nuxt.options.nitro.imports = nuxt.options.nitro.imports || {}
    nuxt.options.nitro.imports.presets = nuxt.options.nitro.imports.presets || []
    nuxt.options.nitro.imports.presets.push({
      from: resolver.resolve('./runtime/server/composables'),
      imports: ['useServerFlags'],
    })
    nuxt.options.nitro.imports.presets.push({
      from: resolver.resolve('./runtime/core/config-schema'),
      imports: ['defineFeatureFlagsConfig'],
    })

    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
    })

    addImports({
      name: 'defineFeatureFlagsConfig',
      from: resolver.resolve('./runtime/core/config-schema'),
    })
    addImports({
      name: 'useClientFlags',
      from: resolver.resolve('./runtime/composables'),
    })

    // Generate types from featureFlags config
    addTypeTemplate({
      filename: 'types/nuxt-feature-flags.d.ts',
      getContents: () => {
        const flags = options.flags || {}
        const flagEntries = Object.entries(flags)
          .map(([key, value]) => `  ${key}: ${typeof value}`)
          .join('\n')

        return `// Generated by nuxt-feature-flags
export interface FlagsSchema {
  [key: string]: boolean | string | number;
${flagEntries}
}`
      },
    })
  },
})
