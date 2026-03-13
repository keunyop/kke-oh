export const LOCALE_COOKIE_NAME = 'kkeoh_locale';
export const SUPPORTED_LOCALES = ['ko', 'en'];
export const dictionaries = {
    ko: {
        common: {
            brand: 'KKE-OH!',
            searchPlaceholder: '게임 찾기',
            uploadGame: '게임 만들기',
            login: '로그인',
            logout: '로그아웃',
            creator: '',
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
            emptyDescription: '검색어를 바꾸거나 새 게임을 만들어 보세요.',
            firstUpload: '첫 게임 만들기'
        },
        login: {
            tabLogin: '로그인',
            tabSignup: '회원가입',
            titleLogin: '다시 만나서 반가워요!',
            titleSignup: '바로 시작해 볼까요?',
            descriptionLogin: 'ID와 비밀번호만 입력하면 바로 들어갈 수 있어요.',
            descriptionSignup: 'ID와 비밀번호만 만들면 바로 시작할 수 있어요.',
            signupHint: '회원가입은 ID와 비밀번호만 있으면 돼요.',
            idPlaceholder: '예: gamekid',
            passwordPlaceholder: '비밀번호를 입력해 주세요',
            submitLogin: '로그인하기',
            submitSignup: '회원가입하고 시작하기',
            pending: '잠시만요...',
            heroTitle: '아이들이 쉽게 쓸 수 있는 게임 놀이터',
            heroDescription: '언어를 고르고 로그인한 뒤 게임을 만들고 함께 플레이해 보세요.',
            heroRule1: '한국어와 영어를 바꿔가며 사용할 수 있어요.',
            heroRule2: 'ID와 비밀번호만 있으면 바로 시작할 수 있어요.',
            heroRule3: '로그인하면 게임 만들기가 열려요.'
        },
        game: {
            unavailableTitle: '이 게임은 지금 볼 수 없어요.',
            unavailableDescription: '삭제되었거나, 안전 확인 중이거나, 링크가 바뀌었을 수 있어요.',
            feedbackTitle: '피드백',
            feedbackDescription: '이 게임에서 더 좋아지면 좋을 점을 알려주세요.',
            feedbackPlaceholder: '하고 싶은 말을 적어 주세요',
            feedbackButton: '💬',
            feedbackSent: '피드백을 보냈어요.',
            feedbackFailed: '피드백을 보내지 못했어요.',
            reactionFailed: '반응을 저장하지 못했어요.',
            fullscreenFailed: '이 브라우저에서는 전체 화면이 막혀 있어요.'
        },
        upload: {
            pageTitle: '게임 만들기',
            pageDescription: '직접 만든 파일을 올리거나, 프롬프트로 새 게임을 만들 수 있어요.',
            loginAs: '로그인 중',
            easyFlow: 'HTML 파일, ZIP 업로드, 또는 AI 게임 만들기 중에서 원하는 방식을 고르세요.'
        }
    },
    en: {
        common: {
            brand: 'KKE-OH!',
            searchPlaceholder: 'Search games',
            uploadGame: 'Create Game',
            login: 'Login',
            logout: 'Logout',
            creator: '',
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
            heroDescription: 'Pick a language, log in, create games, and start playing together.',
            heroRule1: 'You can switch between Korean and English.',
            heroRule2: 'You only need an ID and password.',
            heroRule3: 'Creating games opens after login.'
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
            pageTitle: 'Create Game',
            pageDescription: 'Upload your own files or ask AI to build a new browser game for you.',
            loginAs: 'Logged in as',
            easyFlow: 'Choose HTML upload, ZIP upload, or AI game creation.'
        }
    }
};
export function isLocale(value) {
    return SUPPORTED_LOCALES.includes(value);
}
export function getDictionary(locale) {
    return dictionaries[locale];
}
