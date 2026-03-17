export const LOCALE_COOKIE_NAME = 'kkeoh_locale';
export const SUPPORTED_LOCALES = ['ko', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const dictionaries = {
  ko: {
    common: {
      brand: 'KKE-OH!',
      searchPlaceholder: '게임 찾기',
      uploadGame: '게임 만들기',
      login: '로그인',
      logout: '로그아웃',
      creator: '만든 사람',
      play: '플레이',
      plays: '플레이',
      likes: '좋아요',
      dislikes: '싫어요',
      newBadge: 'NEW',
      home: '홈으로',
      send: '보내기',
      close: '닫기'
    },
    home: {
      emptyTitle: '아직 공개된 게임이 없어요.',
      emptyDescription: '다른 검색어를 시도하거나 새 게임을 만들어보세요.',
      firstUpload: '첫 게임 만들기'
    },
    login: {
      tabLogin: '로그인',
      tabSignup: '회원가입',
      titleLogin: '다시 만나서 반가워요!',
      titleSignup: '새 계정을 만들어요',
      descriptionLogin: '로그인해서 게임을 만들고 이어서 플레이해요.',
      descriptionSignup: 'ID와 비밀번호를 만들면 바로 시작할 수 있어요.',
      signupHint: '회원가입에는 ID와 비밀번호만 필요해요.',
      idPlaceholder: '예시: gamekid',
      passwordPlaceholder: '비밀번호를 입력해주세요',
      submitLogin: '로그인하기',
      submitSignup: '회원가입하기',
      pending: '잠시만요...'
    },
    game: {
      unavailableTitle: '이 게임은 지금 볼 수 없어요.',
      unavailableDescription: '삭제되었거나, 점검 중이거나, 링크가 오래되었을 수 있어요.',
      feedbackTitle: '피드백',
      feedbackDescription: '이 게임을 더 좋게 만들 아이디어를 알려주세요.',
      feedbackPlaceholder: '메시지를 적어주세요',
      feedbackButton: '피드백',
      feedbackSent: '피드백을 보냈어요.',
      feedbackFailed: '피드백을 보내지 못했어요.',
      reactionFailed: '반응을 저장하지 못했어요.',
      fullscreenFailed: '이 브라우저에서는 전체화면이 제한될 수 있어요.'
    },
    upload: {
      pageTitle: '게임 만들기',
      pageDescription: '직접 만든 파일을 올리거나 AI로 새 브라우저 게임을 만들 수 있어요.',
      loginAs: '로그인 중',
      easyFlow: 'HTML 업로드, ZIP 업로드, 또는 AI 게임 만들기 중에서 고르세요.'
    }
  },
  en: {
    common: {
      brand: 'KKE-OH!',
      searchPlaceholder: 'Search games',
      uploadGame: 'Create Game',
      login: 'Login',
      logout: 'Logout',
      creator: 'Creator',
      play: 'Play',
      plays: 'Plays',
      likes: 'Likes',
      dislikes: 'Dislikes',
      newBadge: 'NEW',
      home: 'Back Home',
      send: 'Send',
      close: 'Close'
    },
    home: {
      emptyTitle: 'No games yet.',
      emptyDescription: 'Try another search or create a new game.',
      firstUpload: 'Create First Game'
    },
    login: {
      tabLogin: 'Login',
      tabSignup: 'Sign Up',
      titleLogin: 'Welcome back!',
      titleSignup: 'Create your account',
      descriptionLogin: 'Log in to make games and keep playing.',
      descriptionSignup: 'Choose an ID and password to get started right away.',
      signupHint: 'You only need an ID and password.',
      idPlaceholder: 'Example: gamekid',
      passwordPlaceholder: 'Enter a password',
      submitLogin: 'Log In',
      submitSignup: 'Sign Up',
      pending: 'One moment...'
    },
    game: {
      unavailableTitle: 'This game is unavailable right now.',
      unavailableDescription: 'It may have been removed, checked for safety, or the link may be outdated.',
      feedbackTitle: 'Feedback',
      feedbackDescription: 'Tell us what could be better in this game.',
      feedbackPlaceholder: 'Write your message',
      feedbackButton: 'Feedback',
      feedbackSent: 'Feedback sent.',
      feedbackFailed: 'Could not send feedback.',
      reactionFailed: 'Could not save your reaction.',
      fullscreenFailed: 'Fullscreen is blocked in this browser.'
    },
    upload: {
      pageTitle: 'Create Game',
      pageDescription: 'Upload your own files or ask AI to build a new browser game for you.',
      loginAs: 'Logged in as',
      easyFlow: 'Choose HTML upload, ZIP upload, or AI game creation.'
    }
  }
} as const;

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

