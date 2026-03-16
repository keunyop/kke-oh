'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/lib/i18n';

type Props = {
  gameId: string;
  locale: Locale;
  disabled?: boolean;
};

declare global {
  interface Window {
    googletag?: {
      cmd: Array<() => void>;
      pubads: () => {
        setRequestNonPersonalizedAds?: (value: number) => void;
        setTagForChildDirectedTreatment?: (value: number) => void;
      };
      defineOutOfPageSlot?: (adUnitPath: string, format: unknown) => {
        addService: (service: unknown) => void;
      } | null;
      enableServices?: () => void;
      display?: (slot: unknown) => void;
      enums?: {
        OutOfPageFormat?: {
          REWARDED?: unknown;
        };
      };
    };
  }
}

function getCopy(locale: Locale) {
  return locale === 'ko'
    ? {
        title: '플레이를 마쳤다면 리워드 광고를 볼 수 있어요',
        description: '광고를 끝까지 보면 포인트를 받을 수 있어요. 자동 재생은 하지 않아요.',
        action: '리워드 광고 보기',
        pending: '광고를 준비하고 있어요...',
        reward: '포인트가 지급되었어요.',
        unsupported: '이 기기에서는 리워드 광고를 지원하지 않아요.',
        failed: '리워드 광고 보상을 처리하지 못했어요.',
        login: '포인트를 받으려면 로그인해주세요.'
      }
    : {
        title: 'Finished playing? You can watch a rewarded ad',
        description: 'Watch to the end to earn points. It only starts after you choose it.',
        action: 'Watch rewarded ad',
        pending: 'Preparing the ad...',
        reward: 'Points were added to your balance.',
        unsupported: 'Rewarded ads are not supported on this device.',
        failed: 'Could not process the rewarded reward.',
        login: 'Please log in to earn points.'
      };
}

export function RewardedAdPanel({ gameId, locale, disabled = false }: Props) {
  const copy = getCopy(locale);
  const rewardedAdUnitPath = process.env.NEXT_PUBLIC_GOOGLE_REWARDED_AD_UNIT_PATH ?? '';
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const isSupported = useMemo(() => Boolean(rewardedAdUnitPath), [rewardedAdUnitPath]);

  async function handleReward() {
    if (pending || !rewardedAdUnitPath || disabled) {
      return;
    }

    setPending(true);
    setStatus(copy.pending);

    try {
      const sessionResponse = await fetch('/api/ads/rewarded/session', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ gameId })
      });
      const sessionData = (await sessionResponse.json()) as { eventId?: string; grantToken?: string; error?: string; supported?: boolean };

      if (!sessionResponse.ok || !sessionData.eventId || !sessionData.grantToken) {
        throw new Error(sessionData.error ?? copy.unsupported);
      }

      const rewardApproved = await new Promise<boolean>((resolve) => {
        if (typeof window === 'undefined' || !window.googletag?.cmd || !window.googletag.enums?.OutOfPageFormat?.REWARDED) {
          resolve(false);
          return;
        }

        window.googletag.cmd.push(() => {
          try {
            const pubads = window.googletag?.pubads?.();
            pubads?.setRequestNonPersonalizedAds?.(1);
            pubads?.setTagForChildDirectedTreatment?.(1);
            const slot = window.googletag?.defineOutOfPageSlot?.(
              rewardedAdUnitPath,
              window.googletag?.enums?.OutOfPageFormat?.REWARDED
            );

            if (!slot) {
              resolve(false);
              return;
            }

            slot.addService(pubads as unknown);
            window.googletag?.enableServices?.();
            window.googletag?.display?.(slot);
            resolve(true);
          } catch {
            resolve(false);
          }
        });
      });

      if (!rewardApproved) {
        throw new Error(copy.unsupported);
      }

      const grantResponse = await fetch('/api/ads/rewarded/grant', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ eventId: sessionData.eventId, grantToken: sessionData.grantToken })
      });
      const grantData = (await grantResponse.json()) as { balance?: number; error?: string };

      if (!grantResponse.ok) {
        throw new Error(grantData.error ?? copy.failed);
      }

      setStatus(copy.reward);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.failed);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel-card rewarded-ad-panel">
      <div>
        <h2>{copy.title}</h2>
        <p>{disabled ? copy.login : copy.description}</p>
      </div>
      <div className="button-row rewarded-ad-actions">
        <button type="button" className="button-primary" onClick={() => void handleReward()} disabled={pending || disabled || !isSupported}>
          {pending ? copy.pending : copy.action}
        </button>
      </div>
      {status ? <p className="small-copy game-status-inline">{status}</p> : null}
      {!isSupported ? <p className="small-copy">{copy.unsupported}</p> : null}
    </section>
  );
}

