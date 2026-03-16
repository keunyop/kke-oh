import { getOptionalEnv } from '@/lib/config';

export type GoogleDisplayAdPlacement = 'home' | 'game' | 'my-games' | 'submit' | 'points';

const DISPLAY_SLOT_ENV: Record<GoogleDisplayAdPlacement, string[]> = {
  home: ['NEXT_PUBLIC_GOOGLE_ADS_HOME_SLOT', 'GOOGLE_ADS_HOME_SLOT'],
  game: ['NEXT_PUBLIC_GOOGLE_ADS_GAME_SLOT', 'GOOGLE_ADS_GAME_SLOT'],
  'my-games': ['NEXT_PUBLIC_GOOGLE_ADS_MY_GAMES_SLOT', 'GOOGLE_ADS_MY_GAMES_SLOT'],
  submit: ['NEXT_PUBLIC_GOOGLE_ADS_SUBMIT_SLOT', 'GOOGLE_ADS_SUBMIT_SLOT'],
  points: ['NEXT_PUBLIC_GOOGLE_ADS_POINTS_SLOT', 'GOOGLE_ADS_POINTS_SLOT']
};

function readFirstEnv(names: string[]) {
  for (const name of names) {
    const value = getOptionalEnv(name);
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function getGoogleAdsClientId() {
  return readFirstEnv(['NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_ID']);
}

export function getGoogleDisplaySlot(placement: GoogleDisplayAdPlacement) {
  return readFirstEnv(DISPLAY_SLOT_ENV[placement]);
}

export function getGoogleRewardedAdUnitPath() {
  return readFirstEnv(['NEXT_PUBLIC_GOOGLE_REWARDED_AD_UNIT_PATH', 'GOOGLE_REWARDED_AD_UNIT_PATH']);
}

export function areGoogleDisplayAdsEnabled() {
  return Boolean(getGoogleAdsClientId());
}

export function isGoogleRewardedAdsEnabled() {
  return Boolean(getGoogleRewardedAdUnitPath());
}
