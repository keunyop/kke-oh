import { getAuthStorageDir, getGameDataDriver } from '@/lib/config';
import { FilesystemAuthRepository } from '@/lib/auth/providers/filesystem';
import { SupabaseAuthRepository } from '@/lib/auth/providers/supabase';
import { normalizeLoginId, sanitizeLoginId } from '@/lib/auth/utils';
let repository = null;
let filesystemRepository = null;
function initialize() {
    if (repository)
        return;
    const driver = getGameDataDriver();
    if (driver === 'supabase') {
        repository = new SupabaseAuthRepository();
        return;
    }
    if (driver !== 'filesystem') {
        throw new Error(`Unsupported GAME_DATA_DRIVER: ${driver}`);
    }
    repository = new FilesystemAuthRepository(getAuthStorageDir());
}
export function getAuthRepository() {
    initialize();
    return repository;
}
export function getFilesystemAuthRepository() {
    if (!filesystemRepository) {
        filesystemRepository = new FilesystemAuthRepository(getAuthStorageDir());
    }
    return filesystemRepository;
}
export function validateCredentials(loginId, password) {
    const safeLoginId = sanitizeLoginId(loginId);
    if (safeLoginId.length < 2 || safeLoginId.length > 24) {
        throw new Error('ID는 2글자 이상 24글자 이하로 적어주세요.');
    }
    if (password.length < 2 || password.length > 80) {
        throw new Error('비밀번호는 2글자 이상 80글자 이하로 적어주세요.');
    }
    return {
        loginId: safeLoginId,
        normalizedLoginId: normalizeLoginId(safeLoginId)
    };
}
