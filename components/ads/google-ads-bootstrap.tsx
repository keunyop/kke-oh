import Script from 'next/script';
import { getGoogleAdsClientId, getGoogleRewardedAdUnitPath } from '@/lib/ads/config';

export function GoogleAdsBootstrap() {
  const clientId = getGoogleAdsClientId();
  const rewardedAdUnitPath = getGoogleRewardedAdUnitPath();

  if (!clientId && !rewardedAdUnitPath) {
    return null;
  }

  return (
    <>
      {clientId ? (
        <>
          <Script
            id="google-adsense-loader"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`}
            crossOrigin="anonymous"
          />
          <Script id="google-adsense-config" strategy="afterInteractive">
            {`window.adsbygoogle = window.adsbygoogle || []; window.adsbygoogle.requestNonPersonalizedAds = 1;`}
          </Script>
        </>
      ) : null}
      {rewardedAdUnitPath ? (
        <Script id="google-gpt-loader" async strategy="afterInteractive" src="https://securepubads.g.doubleclick.net/tag/js/gpt.js" />
      ) : null}
    </>
  );
}
