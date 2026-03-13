import { GameActions, GameFullscreenButton } from '@/components/game/game-actions';
import { getGameAssetUrl } from '@/lib/games/urls';
import { getGameRepository } from '@/lib/games/repository';
import { getDictionary } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n/server';
export const dynamic = 'force-dynamic';
export default async function GamePage({ params }) {
    const locale = getRequestLocale();
    const t = getDictionary(locale);
    const creatorLabel = locale === 'ko' ? '만든 사람' : 'Creator';
    const game = await getGameRepository().getById(params.id);
    if (!game || game.status !== 'PUBLIC' || game.is_hidden) {
        return (<section className="empty-state-card">
        <h1>{t.game.unavailableTitle}</h1>
        <p>{t.game.unavailableDescription}</p>
        <a href="/" className="button-primary">
          {t.common.home}
        </a>
      </section>);
    }
    const src = getGameAssetUrl(game.id, game.entry_path);
    const frameId = `game-frame-${game.id}`;
    const iframeId = `game-iframe-${game.id}`;
    return (<section className="game-page">
      <div id={frameId} className="game-frame-wrap">
        <iframe id={iframeId} src={src} sandbox="allow-scripts allow-same-origin allow-pointer-lock" referrerPolicy="no-referrer" allow="fullscreen" allowFullScreen title={game.title} tabIndex={0}/>
        <GameFullscreenButton frameId={frameId} iframeId={iframeId} locale={locale}/>
      </div>

      <section className="panel-card game-description-card">
        <div className="game-description-head">
          <div className="game-description-copy">
            <h1>{game.title}</h1>
            <p className="small-copy">
              {creatorLabel} {game.uploader_name}
            </p>
          </div>
          <GameActions gameId={game.id} title={game.title} initialLikeCount={game.like_count} initialDislikeCount={game.dislike_count} locale={locale}/>
        </div>
        <p>{game.description}</p>
      </section>

      <script dangerouslySetInnerHTML={{ __html: `fetch('/api/games/${game.id}/play',{method:'POST'});` }}/>
    </section>);
}
