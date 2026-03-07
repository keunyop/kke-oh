type CachedFile = {
  path: string;
  content: Buffer;
  contentType: string;
};

type UploadInspection = {
  files: CachedFile[];
  htmlFiles: string[];
  allowlistViolation: boolean;
  entryPath: string;
  thumbnailCandidates: string[];
  createdAt: number;
};

const cache = new Map<string, UploadInspection>();

export function storeInspection(id: string, data: UploadInspection): void {
  cache.set(id, data);
}

export function readInspection(id: string): UploadInspection | undefined {
  const value = cache.get(id);
  if (!value) return undefined;
  if (Date.now() - value.createdAt > 1000 * 60 * 30) {
    cache.delete(id);
    return undefined;
  }
  return value;
}

export function consumeInspection(id: string): UploadInspection | undefined {
  const value = readInspection(id);
  if (value) cache.delete(id);
  return value;
}
