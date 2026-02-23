import { createServiceClient } from '@/lib/db/supabase';

export default async function HomePage() {
  const supabase = createServiceClient();
  const olderThan = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('games')
    .select('id,title,description,thumbnail_url,plays_7d,plays_30d,created_at')
    .eq('status', 'PUBLIC')
    .eq('is_hidden', false)
    .lt('report_count', 2)
    .eq('allowlist_violation', false)
    .gte('plays_7d', 5)
    .lte('created_at', olderThan);

  const games = (data ?? [])
    .map((g) => ({ ...g, score: (g.plays_7d ?? 0) + 0.2 * (g.plays_30d ?? 0) }))
    .sort((a, b) => b.score - a.score);

  return (
    <section>
      <h1>Popular kid-safe games</h1>
      <p className="small">Only approved public games with enough play signals are shown.</p>
      <div className="grid">
        {games.map((game) => (
          <a className="card" key={game.id} href={`/game/${game.id}`}>
            <h3>{game.title}</h3>
            {game.thumbnail_url ? <img src={game.thumbnail_url} alt={game.title} style={{ width: '100%', borderRadius: 8 }} /> : null}
            <p>{game.description}</p>
            <p className="small">Score: {game.score.toFixed(1)}</p>
          </a>
        ))}
      </div>
      {!games.length ? <p>No games yet that pass homepage gates.</p> : null}
    </section>
  );
}
