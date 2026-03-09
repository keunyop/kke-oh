import { getGameRepository } from '@/lib/games/repository';
import { getGameAssetUrl } from '@/lib/games/urls';
import { GameActions } from '@/components/game/game-actions';

export const dynamic = 'force-dynamic';

export default async function GamePage({ params }: { params: { id: string } }) {
  const game = await getGameRepository().getById(params.id);

  if (!game || game.status !== 'PUBLIC' || game.is_hidden) {
    return (
      <section className="empty-state-card">
        <h1>This game is unavailable.</h1>
        <p>It may have been removed, hidden for safety review, or the link may be out of date.</p>
        <a href="/" className="button-primary">
          Back to Home
        </a>
      </section>
    );
  }

  const src = getGameAssetUrl(game.id, game.entry_path);
  const frameId = `game-frame-${game.id}`;
  const iframeId = `game-iframe-${game.id}`;

  return (
    <section className="game-page">
      <div id={frameId} className="game-frame-wrap">
        <iframe
          id={iframeId}
          src={src}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock"
          referrerPolicy="no-referrer"
          allow="fullscreen"
          title={game.title}
          tabIndex={0}
        />
      </div>
      <GameActions
        gameId={game.id}
        title={game.title}
        frameId={frameId}
        iframeId={iframeId}
        initialLikeCount={game.like_count}
        initialDislikeCount={game.dislike_count}
      />
      <section className="panel-card game-description-card">
        <h1>{game.title}</h1>
        <p>{game.description}</p>
      </section>
      <script dangerouslySetInnerHTML={{ __html: `fetch('/api/games/${game.id}/play',{method:'POST'});` }} />
    </section>
  );
}
