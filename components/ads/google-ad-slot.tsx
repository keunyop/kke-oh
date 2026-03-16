'use client';

import { useEffect, useId } from 'react';
type GoogleDisplayAdPlacement = 'home' | 'game' | 'my-games' | 'submit' | 'points';

type Props = {
  placement: GoogleDisplayAdPlacement;
  label: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function GoogleAdSlot({ placement, label }: Props) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID ?? '';
  const slotMap: Record<GoogleDisplayAdPlacement, string> = {
    home: process.env.NEXT_PUBLIC_GOOGLE_ADS_HOME_SLOT ?? '',
    game: process.env.NEXT_PUBLIC_GOOGLE_ADS_GAME_SLOT ?? '',
    'my-games': process.env.NEXT_PUBLIC_GOOGLE_ADS_MY_GAMES_SLOT ?? '',
    submit: process.env.NEXT_PUBLIC_GOOGLE_ADS_SUBMIT_SLOT ?? '',
    points: process.env.NEXT_PUBLIC_GOOGLE_ADS_POINTS_SLOT ?? ''
  };
  const slot = slotMap[placement];
  const instanceId = useId();

  useEffect(() => {
    if (!clientId || !slot) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ignore ad loader errors so the page keeps working without ads.
    }
  }, [clientId, slot]);

  if (!clientId || !slot) {
    return null;
  }

  return (
    <section className="panel-card ad-slot-card" aria-label={label}>
      <div className="ad-slot-copy">
        <span className="pill-label">Ad</span>
        <p>{label}</p>
      </div>
      <ins
        key={`${placement}-${instanceId}`}
        className="adsbygoogle ad-slot-surface"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </section>
  );
}

