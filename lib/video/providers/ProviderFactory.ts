import { VideoProvider } from "./BaseProvider";
import { KlingProvider } from "./KlingProvider";
import { FalProvider } from "./FalProvider";
import type { VideoModel } from "@/types/video";
import { videoLogger } from '@/lib/logger';

/**
 * Singleton Provider Factory
 * Ensures only one instance of each provider exists to:
 * - Reuse JWT token cache (KlingProvider)
 * - Reduce memory allocation
 * - Improve performance
 */
class ProviderFactory {
  private static klingProvider: KlingProvider | null = null;
  private static falProvider: FalProvider | null = null;

  /**
   * Get the appropriate provider based on model selection
   * Uses singleton pattern to reuse provider instances
   */
  static getProvider(model: VideoModel): VideoProvider {
    switch (model) {
      case "payperwork-v1":
        if (!this.klingProvider) {
          this.klingProvider = new KlingProvider();
          videoLogger.debug('🏭 Created new KlingProvider instance (singleton)');
        }
        return this.klingProvider;

      case "payperwork-v2":
        if (!this.falProvider) {
          this.falProvider = new FalProvider();
          videoLogger.debug('🏭 Created new FalProvider instance (singleton)');
        }
        return this.falProvider;

      default:
        throw new Error(`Unknown video model: ${model}`);
    }
  }

  /**
   * Reset all provider instances (useful for testing or manual cache clearing)
   */
  static reset(): void {
    this.klingProvider = null;
    this.falProvider = null;
    videoLogger.info('Reset all provider instances');
  }
}

export default ProviderFactory;
