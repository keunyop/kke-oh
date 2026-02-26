import { getGameRepository } from '@/lib/games/repository';
import { getGameAssetUrl } from '@/lib/games/urls';
import { getGamePageCsp } from '@/lib/security/contentScan';

async function reportGame(id: string) {
  'use server';
  await getGameRepository().report(id, 'User report');
}

export default async function GamePage({ params }: { params: { id: string } }) {
  const game = await getGameRepository().getById(params.id);

  if (!game || game.status !== 'PUBLIC' || game.is_hidden || game.allowlist_violation) {
    return <p>This game is unavailable.</p>;
  }

  const src = getGameAssetUrl(game.id, game.entry_path);

  return (
    <section>
      <h1>{game.title}</h1>
      <p>{game.description}</p>
      <meta httpEquiv="Content-Security-Policy" content={getGamePageCsp()} />
      <iframe
        src={src}
        sandbox="allow-scripts allow-same-origin allow-pointer-lock"
        referrerPolicy="no-referrer"
        allow="fullscreen"
      />
      <form action={reportGame.bind(null, game.id)}>
        <button type="submit" className="secondary">Report this game</button>
      </form>
      <script dangerouslySetInnerHTML={{ __html: `fetch('/api/games/${game.id}/play',{method:'POST'});` }} />
    </section>
  );
}
