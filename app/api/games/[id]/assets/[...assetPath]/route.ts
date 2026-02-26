import { NextResponse } from 'next/server';
import { getGameAssetStore } from '@/lib/games/repository';

export async function GET(
  _: Request,
  { params }: { params: { id: string; assetPath: string[] } }
) {
  const path = params.assetPath.join('/');
  const asset = await getGameAssetStore().readAsset(params.id, path);
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(asset.content), {
    headers: {
      'content-type': asset.contentType,
      'cache-control': 'public, max-age=300'
    }
  });
}
