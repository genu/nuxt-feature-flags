export interface Flag<T = boolean> {
  value: T
  explanation?: {
    reason: 'STATIC' | 'TARGETING_MATCH' | 'DEFAULT'
    rule?: string
  }
}

export type FlagDefinition = Record<string, boolean>

export type FeatureFlagsConfig = FlagDefinition

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    featureFlags: FeatureFlagsConfig
  }
}
