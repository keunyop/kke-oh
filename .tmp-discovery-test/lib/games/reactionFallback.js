import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getGameMetricsDir } from '@/lib/config';
const STORE_FILE_NAME = 'reactions.json';
async function readStore(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    }
    catch {
        return {};
    }
}
async function writeStore(filePath, data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}
function getStorePath() {
    return path.join(getGameMetricsDir(), STORE_FILE_NAME);
}
export async function readReactionMetrics(gameId) {
    const store = await readStore(getStorePath());
    return (store[gameId] ?? {
        likeCount: 0,
        dislikeCount: 0,
        updatedAt: new Date(0).toISOString()
    });
}
export async function applyReactionFallback(gameId, nextReaction, previousReaction) {
    const filePath = getStorePath();
    const store = await readStore(filePath);
    const current = store[gameId] ?? {
        likeCount: 0,
        dislikeCount: 0,
        updatedAt: new Date().toISOString()
    };
    let likeCount = current.likeCount;
    let dislikeCount = current.dislikeCount;
    if (previousReaction === 'LIKE' && previousReaction !== nextReaction) {
        likeCount = Math.max(0, likeCount - 1);
    }
    if (previousReaction === 'DISLIKE' && previousReaction !== nextReaction) {
        dislikeCount = Math.max(0, dislikeCount - 1);
    }
    if (previousReaction !== nextReaction) {
        if (nextReaction === 'LIKE') {
            likeCount += 1;
        }
        else {
            dislikeCount += 1;
        }
    }
    store[gameId] = {
        likeCount,
        dislikeCount,
        updatedAt: new Date().toISOString()
    };
    await writeStore(filePath, store);
    return {
        likeCount,
        dislikeCount,
        reaction: nextReaction
    };
}
