export const LOCALE_COOKIE_NAME = 'kkeoh_locale';
export const SUPPORTED_LOCALES = ['ko', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const dictionaries = {
  ko: {
    common: {
      brand: 'KKE-OH!',
      searchPlaceholder: '게임 찾기',
      uploadGame: '게임 올리기',
      login: '로그인',
      logout: '로그아웃',
      creator: '원작자',
      play: '플레이',
      plays: '플레이',
      likes: '좋아요',
      dislikes: '싫어요',
      newBadge: 'NEW',
      home: '홈으로 가기',
      send: '보내기',
      close: '닫기'
    },
    home: {
      emptyTitle: '아직 게임이 없어요.',
      emptyDescription: '다른 검색어를 써보거나 새 게임을 올려보세요.',
      firstUpload: '첫 게임 올리기'
    },
    login: {
      tabLogin: '로그인',
      tabSignup: '회원가입',
      titleLogin: '다시 만나서 반가워요!',
      titleSignup: '바로 시작해볼까요?',
      descriptionLogin: 'ID와 비밀번호만 입력하면 바로 들어갈 수 있어요.',
      descriptionSignup: 'ID와 비밀번호만 만들면 바로 시작할 수 있어요.',
      signupHint: '회원가입은 ID와 비밀번호만 있으면 돼요.',
      idPlaceholder: '예: gamekid',
      passwordPlaceholder: '비밀번호를 적어주세요',
      submitLogin: '로그인하기',
      submitSignup: '회원가입하고 시작하기',
      pending: '잠깐만요...',
      heroTitle: '아이도 쉽게 시작하는 게임 놀이터',
      heroDescription: '언어를 고르고, 로그인한 뒤, 게임을 올리고 바로 함께 놀 수 있어요.',
      heroRule1: '한국어와 영어를 바꿔서 볼 수 있어요.',
      heroRule2: 'ID와 비밀번호만으로 바로 시작할 수 있어요.',
      heroRule3: '로그인하면 게임 올리기가 열려요.'
    },
    game: {
      unavailableTitle: '이 게임은 지금 볼 수 없어요.',
      unavailableDescription: '삭제되었거나, 안전 확인 중이거나, 링크가 바뀌었을 수 있어요.',
      feedbackTitle: '피드백',
      feedbackDescription: '이 게임에서 바뀌면 좋을 점을 알려주세요.',
      feedbackPlaceholder: '하고 싶은 말을 적어주세요',
      feedbackButton: '💬',
      feedbackSent: '피드백을 보냈어요.',
      feedbackFailed: '피드백을 보내지 못했어요.',
      reactionFailed: '좋아요 정보를 저장하지 못했어요.',
      fullscreenFailed: '이 브라우저에서는 전체화면이 막혀 있어요.'
    },
    upload: {
      pageTitle: '내 게임 올리기',
      pageDescription: '어렵지 않아요. 게임 이름, 설명, HTML만 넣으면 바로 올릴 수 있어요.',
      loginAs: '로그인 중',
      easyFlow: 'HTML을 바로 붙여넣거나 ZIP 파일로 올릴 수 있어요. 썸네일은 선택이에요.'
    }
  },
  en: {
    common: {
      brand: 'KKE-OH!',
      searchPlaceholder: 'Search games',
      uploadGame: 'Upload Game',
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
      emptyDescription: 'Try another search or upload a new game.',
      firstUpload: 'Upload First Game'
    },
    login: {
      tabLogin: 'Login',
      tabSignup: 'Sign Up',
      titleLogin: 'Welcome back!',
      titleSignup: 'Ready to start?',
      descriptionLogin: 'Just enter your ID and password.',
      descriptionSignup: 'Create an ID and password to start right away.',
      signupHint: 'You only need an ID and password.',
      idPlaceholder: 'Example: gamekid',
      passwordPlaceholder: 'Enter a password',
      submitLogin: 'Log In',
      submitSignup: 'Sign Up and Start',
      pending: 'One moment...',
      heroTitle: 'A game playground kids can use easily',
      heroDescription: 'Pick a language, log in, upload a game, and start playing together.',
      heroRule1: 'You can switch between Korean and English.',
      heroRule2: 'You only need an ID and password.',
      heroRule3: 'Uploading opens after login.'
    },
    game: {
      unavailableTitle: 'This game is unavailable right now.',
      unavailableDescription: 'It may have been removed, checked for safety, or the link may be outdated.',
      feedbackTitle: 'Feedback',
      feedbackDescription: 'Tell us what could be better in this game.',
      feedbackPlaceholder: 'Write your message',
      feedbackButton: '💬',
      feedbackSent: 'Feedback sent.',
      feedbackFailed: 'Could not send feedback.',
      reactionFailed: 'Could not save your reaction.',
      fullscreenFailed: 'Fullscreen is blocked in this browser.'
    },
    upload: {
      pageTitle: 'Upload My Game',
      pageDescription: 'It is easy. Add a title, description, and HTML, then publish.',
      loginAs: 'Logged in as',
      easyFlow: 'You can paste HTML directly or upload a ZIP file. A thumbnail is optional.'
    }
  }
} as const;

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
