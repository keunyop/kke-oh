import { getGameAssetStore } from '@/lib/games/repository';

export function getGameAssetUrl(gameId: string, assetPath: string): string {
  return getGameAssetStore().getAssetUrlPath(gameId, assetPath);
}
