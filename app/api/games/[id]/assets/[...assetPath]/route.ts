import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getGameAssetStore, getGameRepository } from '@/lib/games/repository';
import { getGamePageCsp } from '@/lib/security/contentScan';
import { isAdminUser } from '@/lib/security/admin-rules';

export async function GET(
  _: Request,
  { params }: { params: { id: string; assetPath: string[] } }
) {
  const repository = getGameRepository();
  const game = await repository.getById(params.id);
  const user = await getCurrentUser();
  const canAccess = Boolean(
    game &&
      game.status !== 'REMOVED' &&
      ((game.status === 'PUBLIC' && !game.is_hidden) || (user && (game.uploader_user_id === user.id || isAdminUser(user))))
  );

  if (!game || !canAccess) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const path = params.assetPath.join('/');
  const asset = await getGameAssetStore().readAsset(params.id, path);
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(asset.content), {
    headers: {
      'content-type': asset.contentType,
      'cache-control': canAccess && game.status === 'PUBLIC' && !game.is_hidden ? 'public, max-age=300' : 'private, no-store',
      ...(asset.contentType.includes('text/html')
        ? {
            'content-security-policy': getGamePageCsp()
          }
        : {})
    }
  });
}
