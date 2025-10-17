/**
 * Feature Flags for gradual rollout
 *
 * Usage:
 * - Set environment variable: NEXT_PUBLIC_USE_NEW_WORKFLOW=true
 * - Or toggle in code for testing
 */

export const featureFlags = {
  /**
   * Enable new refactored workflow pages with composition architecture
   * Default: false (use old version)
   * Set NEXT_PUBLIC_USE_NEW_WORKFLOW=true to enable
   */
  useNewWorkflow: process.env.NEXT_PUBLIC_USE_NEW_WORKFLOW === 'true',

  /**
   * Enable new branding workflow
   * Default: false (use old version)
   */
  useNewBranding: process.env.NEXT_PUBLIC_USE_NEW_BRANDING === 'true',
} as const;

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature];
}
