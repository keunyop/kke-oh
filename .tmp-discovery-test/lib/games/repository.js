import { getGameDataDriver, getGameStorageDir } from '@/lib/config';
import { FilesystemGameAssetStore, FilesystemGameRepository } from '@/lib/games/providers/filesystem';
import { SupabaseGameAssetStore, SupabaseGameRepository } from '@/lib/games/providers/supabase';
let repository = null;
let assetStore = null;
function initialize() {
    if (repository && assetStore)
        return;
    const driver = getGameDataDriver();
    if (driver === 'supabase') {
        repository = new SupabaseGameRepository();
        assetStore = new SupabaseGameAssetStore();
        return;
    }
    if (driver !== 'filesystem') {
        throw new Error(`Unsupported GAME_DATA_DRIVER: ${driver}`);
    }
    const storageDir = getGameStorageDir();
    repository = new FilesystemGameRepository(storageDir);
    assetStore = new FilesystemGameAssetStore(storageDir);
}
export function getGameRepository() {
    initialize();
    return repository;
}
export function getGameAssetStore() {
    initialize();
    return assetStore;
}
