import { getGameRepository } from '@/lib/games/repository';
import { getGameAssetUrl } from '@/lib/games/urls';

export default async function HomePage() {
  const games = (await getGameRepository().listPublic())
    .map((g) => ({ ...g, score: (g.plays_7d ?? 0) + 0.2 * (g.plays_30d ?? 0) }))
    .sort((a, b) => b.score - a.score);

  return (
    <section>
      <h1>Local games</h1>
      <p className="small">MVP mode: serving only developer-managed local game files.</p>
      <div className="grid">
        {games.map((game) => (
          <a className="card" key={game.id} href={`/game/${game.id}`}>
            <h3>{game.title}</h3>
            {game.thumbnail_path ? (
              <img src={getGameAssetUrl(game.id, game.thumbnail_path)} alt={game.title} style={{ width: '100%', borderRadius: 8 }} />
            ) : null}
            <p>{game.description}</p>
            <p className="small">Score: {game.score.toFixed(1)}</p>
          </a>
        ))}
      </div>
      {!games.length ? <p>No local games found. Add one under data/games/&lt;game-id&gt;.</p> : null}
    </section>
  );
}
