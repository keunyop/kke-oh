# KKE-OH 추가 개발 필요사항

## 1. 문서 목적

이 문서는 2026-03-17 기준 `development-definition.md`에 새로 반영된 내용 중, 실제 구현에서 추가 개발이 필요한 항목을 작업 묶음 단위로 정리한 것이다.

## 2. 추가 개발 항목

### 2.1 헤더 및 홈 탐색 UX 재정비

- 대상 화면: 홈, 공통 헤더
- 주요 변경:
  - 헤더 포인트 버튼 제거
  - 좁은 화면에서 검색창 우선 축소, `Create Game` 버튼 줄바꿈 방지
  - 홈 검색을 submit 방식에서 live filtering 방식으로 변경
  - 검색 기준을 게임명 + 작성자명으로 축소
  - 챔피언 리더보드를 상단으로 이동
  - 리더보드 블랙보드 스타일 적용 (전체 사이트와 look and feel 이상하지 않아야 함)
  - 리더보드 높이 축소
  - 자동 이동 + 마우스/터치 drag 지원
  - 게임 카드 제목/작성자 1줄 말줄임 + tooltip (tooltip은 게임명에만 적용되면 됨)
- 영향 범위:
  - `app/_components/site-navbar.tsx`
  - `app/page.tsx`
  - `components/site/game-card.tsx`
  - 홈/공통 CSS
- 추가 검토 포인트:
  - 자동 이동 중 drag 개입 시 충돌 없는지
  - 모바일에서 성능 저하 없는지
  - 검색 상태와 SSR 데이터 구조를 어떻게 나눌지

### 2.2 게임 상세 액션 tooltip 정비

- 대상 화면: 게임 상세
- 주요 변경:
  - 좋아요, 싫어요, 피드백, 신고 버튼에 hover/focus tooltip 제공
  - locale에 맞는 버튼명 노출
- 영향 범위:
  - `components/game/game-actions.tsx`
  - `app/game/[id]/page.tsx`
  - 공통 tooltip UI 또는 CSS
- 추가 검토 포인트:
  - 모바일에서는 hover가 없으므로 접근성 대체가 필요한지
  - `aria-label`, `title`, 커스텀 tooltip 중 어느 방식을 표준으로 삼을지

### 2.3 로그인 및 인증 오류 현지화 정비

- 대상 화면: 로그인/회원가입
- 주요 변경:
  - 좌측 설명 카드 제거, 인증 카드 중앙 배치
  - `Login` 뱃지 제거
  - `You only need an ID and password.` 제거
  - 중복 ID 오류를 선택 언어에 맞게 반환
  - 오류 문구를 붉은색으로 표시
  - 깨진 한국어 문구 복구
- 영향 범위:
  - `app/login/page.tsx`
  - `app/login/login-form.tsx`
  - `app/api/auth/signup/route.ts`
  - `lib/auth/index.ts`
  - `lib/auth/repository.ts`
  - `lib/auth/providers/*`
  - `lib/i18n.ts`
- 추가 검토 포인트:
  - 서버가 locale-aware message를 직접 반환할지, 오류 code만 반환하고 클라이언트에서 번역할지 결정 필요

### 2.4 생성 화면 AI UX 재설계

- 대상 화면: 게임 만들기
- 주요 변경:
  - `How it works` 문구를 현재 화면 구조에 맞게 초등학생 눈높이로 재작성
  - AI 모델 설명을 모델별로 쉬운 말로 제공
  - `Current points`, `Expected cost` 카드 디자인 개선
  - AI 선택 입력 영역을 `고급 설정` 접힘 영역으로 이동
  - ZIP 업로드에서 외부 썸네일 입력 제거
- 영향 범위:
  - `app/submit/page.tsx`
  - `app/submit/submit-form.tsx`
  - `app/api/ai/models/route.ts` 또는 모델 응답 생성부
  - `lib/i18n.ts`
  - 업로드 관련 CSS
- 추가 검토 포인트:
  - 고급 설정에 포함할 필드 범위
  - ZIP 업로드에서 썸네일 후보를 사용자 선택까지 확장할지, 자동 정책만 둘지

### 2.5 수정 화면 생성 화면과 UX 통일

- 대상 화면: 게임 수정
- 주요 변경:
  - 게임명/설명 입력을 모드 버튼 위로 이동
  - `Edit with AI` 버튼을 첫 번째로 배치
  - AI 모델 설명/비용 카드/고급 설정 접힘을 생성 화면과 동일하게 적용
  - 하단 버튼을 `Save changes`와 `Cancel`만 남기기
- 영향 범위:
  - `app/my-games/edit-game-form.tsx`
  - `app/my-games/[id]/edit/page.tsx`
  - 공통 AI/폼 CSS
- 추가 검토 포인트:
  - 현재 `Open game`, `Back to My Games` 링크 제거 후 cancel 동작을 어디로 보낼지 정의 필요

### 2.6 포인트, 관리자, 내 게임 운영 화면 단순화

- 대상 화면: 포인트, 관리자, 내 게임
- 주요 변경:
  - 포인트 구매 카드 3열 정렬
  - 관리자 상단 설명 카드 단순화
  - `Admin` 뱃지 제거
  - 관리자 목록 썸네일 표시
  - 내 게임에서 `Move to Draft` 제거
  - 게시 숨김용 버튼 추가
  - 내 게임 삭제 버튼 danger 스타일 적용
- 영향 범위:
  - `app/points/points-dashboard.tsx`
  - `app/admin/page.tsx`
  - `app/admin/admin-dashboard.tsx`
  - `app/my-games/my-games-panel.tsx`
  - `app/api/my-games/[id]/route.ts`
  - 관리자/내 게임/포인트 CSS
- 추가 검토 포인트:
  - 작성자 숨김이 기존 `DRAFT` 흐름을 완전히 대체하는지, 초안은 최초 미게시 상태로만 남길지 확정 필요

### 2.7 테스트 및 회귀 보강

- 주요 변경:
  - 홈 리더보드 drag 상호작용 테스트
  - responsive header 회귀 테스트
  - 게임 카드 말줄임/tooltip 테스트
  - locale별 인증 오류 테스트
  - ZIP 업로드 썸네일 필드 제거 회귀 테스트
  - 수정 화면 버튼 순서/버튼 수 테스트
  - 내 게임 publish/hide 흐름 테스트
  - 관리자 썸네일 노출 테스트
- 영향 범위:
  - 단위 테스트
  - 통합 테스트
  - 수동 UI 체크리스트
- 추가 검토 포인트:
  - drag 상호작용은 자동화 테스트만으로 충분한지, 수동 브라우저 검증도 병행할지

## 3. 권장 구현 순서

1. 로그인/인증 오류 현지화와 깨진 문구 복구
2. 헤더 및 홈 탐색 UX 재정비
3. 생성 화면 AI UX 재설계
4. 수정 화면 UX 통일
5. 내 게임/관리자/포인트 운영 화면 단순화
6. 게임 상세 tooltip 정비
7. 테스트 보강 및 회귀 점검

## 4. 구현 전 결정 필요사항

- 인증 오류 현지화는 서버 번역 방식과 클라이언트 번역 방식 중 무엇을 표준으로 할지 : 언어별 다국어 파일이 서버에 있어야지.
- 작성자용 `Hide from Publish`가 기존 `DRAFT` 상태를 대체하는지, 아니면 `PUBLIC + is_hidden`만 사용하는지: 최초 게임 생성시의 draft상태와 hidden은 다른 상태임
- ZIP 업로드 썸네일은 자동 선택만 둘지, ZIP 내부 후보 선택 UI까지 확장할지: 우선은 ZIP으로 파일올렸을 경우엔 index.html과 thumbnail 파일을 찾는걸로
- 홈 리더보드 drag 구현은 CSS scroll-snap 기반으로 갈지, transform 기반 custom marquee로 갈지: 이건 뭐가좋은지 나는 모르겠으니 알아저 잘 판단하세요.
