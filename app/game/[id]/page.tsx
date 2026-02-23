import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/db/supabase';
import { getPublicR2BaseUrl } from '@/lib/r2/client';
import { getGamePageCsp } from '@/lib/security/contentScan';

async function reportGame(id: string) {
  'use server';
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/games/${id}/report`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason: 'User report' })
  });
}

export default async function GamePage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient();
  const { data: game } = await supabase
    .from('games')
    .select('id,title,description,status,is_hidden,storage_prefix,entry_path,allowlist_violation')
    .eq('id', params.id)
    .single();

  if (!game || game.status !== 'PUBLIC' || game.is_hidden || game.allowlist_violation) {
    return <p>This game is unavailable.</p>;
  }

  const src = `${getPublicR2BaseUrl()}/${game.storage_prefix.replace(/^\/+/, '')}/${game.entry_path.replace(/^\/+/, '')}`;
  headers();

  return (
    <section>
      <h1>{game.title}</h1>
      <p>{game.description}</p>
      <meta httpEquiv="Content-Security-Policy" content={getGamePageCsp(getPublicR2BaseUrl())} />
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
