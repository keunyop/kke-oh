import { getGameRepository } from '@/lib/games/repository';
import { getGameAssetUrl } from '@/lib/games/urls';
import { getGamePageCsp } from '@/lib/security/contentScan';

export const dynamic = 'force-dynamic';

async function reportGame(id: string) {
  'use server';
  await getGameRepository().report(id, 'User report');
}

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

  return (
    <section className="game-page">
      <meta httpEquiv="Content-Security-Policy" content={getGamePageCsp()} />
      <div className="game-page-head">
        <div>
          <span className="pill-label">Now playing</span>
          <h1>{game.title}</h1>
          <p>{game.description}</p>
        </div>
        <div className="game-page-actions">
          <a href="/" className="button-secondary">
            More Games
          </a>
          <form action={reportGame.bind(null, game.id)}>
            <button type="submit" className="button-ghost">
              Report Game
            </button>
          </form>
        </div>
      </div>
      <div className="game-frame-wrap">
        <iframe
          src={src}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock"
          referrerPolicy="no-referrer"
          allow="fullscreen"
          title={game.title}
        />
      </div>
      <script dangerouslySetInnerHTML={{ __html: `fetch('/api/games/${game.id}/play',{method:'POST'});` }} />
    </section>
  );
}
