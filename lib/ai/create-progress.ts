import type { Locale } from '@/lib/i18n';

export const AI_CREATE_PROGRESS_STEP_DELAYS = [8000, 26000, 52000, 78000] as const;

export function getAiCreateProgressCopy(locale: Locale) {
  if (locale === 'ko') {
    return [
      '게임 아이디어를 읽고 규칙을 정리하고 있어요.',
      '게임 화면과 조작을 만들고 있어요.',
      '점수와 게임 흐름을 다듬고 있어요.',
      '썸네일과 설명을 정리하고 있어요.',
      '마지막 확인을 마치고 저장하고 있어요.'
    ];
  }

  return [
    'Reading your idea and planning the rules.',
    'Building the game screen and controls.',
    'Tuning scoring and game flow.',
    'Polishing the thumbnail and description.',
    'Running final checks and saving it.'
  ];
}
