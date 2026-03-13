const cache = new Map();
export function storeInspection(id, data) {
    cache.set(id, data);
}
export function readInspection(id) {
    const value = cache.get(id);
    if (!value)
        return undefined;
    if (Date.now() - value.createdAt > 1000 * 60 * 30) {
        cache.delete(id);
        return undefined;
    }
    return value;
}
export function consumeInspection(id) {
    const value = readInspection(id);
    if (value)
        cache.delete(id);
    return value;
}
