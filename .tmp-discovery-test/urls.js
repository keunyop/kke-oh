function normalizeAssetPath(value) {
    const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized)
        return null;
    const parts = normalized.split('/').filter(Boolean);
    if (!parts.length || parts.some((part) => part === '.' || part === '..')) {
        return null;
    }
    return parts.join('/');
}
export function getGameAssetUrl(gameId, assetPath) {
    const normalizedPath = normalizeAssetPath(assetPath);
    if (!normalizedPath)
        return '#';
    const encodedPath = normalizedPath
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/');
    return `/api/games/${encodeURIComponent(gameId)}/assets/${encodedPath}`;
}
