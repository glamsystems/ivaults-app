import { Image } from 'react-native';

class SparkleImageCacheService {
  private static instance: SparkleImageCacheService;
  private cache: Map<string, boolean> = new Map();
  private preloadPromises: Map<string, Promise<void>> = new Map();

  private constructor() {}

  static getInstance(): SparkleImageCacheService {
    if (!SparkleImageCacheService.instance) {
      SparkleImageCacheService.instance = new SparkleImageCacheService();
    }
    return SparkleImageCacheService.instance;
  }

  getUrl(mintPubkey: string): string {
    return `https://api.glam.systems/v0/sparkle?key=${mintPubkey}&format=png`;
  }

  isCached(mintPubkey: string): boolean {
    return this.cache.has(mintPubkey) && this.cache.get(mintPubkey) === true;
  }

  async preloadImage(mintPubkey: string): Promise<void> {
    if (!mintPubkey) return;

    // Return existing promise if already preloading
    if (this.preloadPromises.has(mintPubkey)) {
      return this.preloadPromises.get(mintPubkey)!;
    }

    // Return immediately if already cached
    if (this.isCached(mintPubkey)) {
      return Promise.resolve();
    }

    const url = this.getUrl(mintPubkey);
    
    const preloadPromise = new Promise<void>((resolve) => {
      Image.prefetch(url)
        .then(() => {
          this.cache.set(mintPubkey, true);
          console.log(`[SparkleCache] Cached image for ${mintPubkey}`);
          resolve();
        })
        .catch((error) => {
          console.log(`[SparkleCache] Failed to cache image for ${mintPubkey}:`, error);
          this.cache.set(mintPubkey, false);
          resolve(); // Resolve anyway to not block
        })
        .finally(() => {
          this.preloadPromises.delete(mintPubkey);
        });
    });

    this.preloadPromises.set(mintPubkey, preloadPromise);
    return preloadPromise;
  }

  async preloadImages(mintPubkeys: string[]): Promise<void> {
    const validKeys = mintPubkeys.filter(key => key && typeof key === 'string');
    
    if (validKeys.length === 0) return;

    console.log(`[SparkleCache] Preloading ${validKeys.length} sparkle images...`);
    
    // Preload in batches to avoid overwhelming the network
    const batchSize = 5;
    for (let i = 0; i < validKeys.length; i += batchSize) {
      const batch = validKeys.slice(i, i + batchSize);
      await Promise.all(batch.map(key => this.preloadImage(key)));
    }

    console.log(`[SparkleCache] Preloading complete. Cached: ${Array.from(this.cache.values()).filter(v => v).length}/${validKeys.length}`);
  }

  clearCache(): void {
    this.cache.clear();
    this.preloadPromises.clear();
    console.log('[SparkleCache] Cache cleared');
  }
}

export const SparkleImageCache = SparkleImageCacheService.getInstance();