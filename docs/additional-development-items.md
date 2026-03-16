# KKE-OH 추가 개발 필요사항

## 1. 문서 목적

이 문서는 `requirements-definition.md`와 `development-definition.md`를 현재 코드에 맞추기 위해 필요한 후속 개발 작업을 정리한 문서다.  
아직 구현하지 않은 항목, 현재 코드에서 확인된 버그, UX 개선 포인트, 신규 확장 기능을 함께 포함한다.

## 2. 우선순위 기준

- `P0`
  - 요구사항과 현재 동작이 직접 충돌하거나 핵심 사용자 흐름을 막는 항목
- `P1`
  - 수익화, 포인트 경제, AI 사용 UX처럼 서비스 전략에 큰 영향을 주는 항목
- `P2`
  - 구조 단순화, 품질 정비, 유지보수성 개선 항목

## 3. 이번 분석에서 확인한 버그와 UX 이슈

### 3.1 기능 버그

- 공개 게임 상세 페이지에 신고 API는 있으나 실제 신고 버튼 UI가 없다.
- `listPublic()`가 `report_count < 2`를 강제해 현재 요구사항과 다르게 홈에서 게임이 숨겨진다.
- 신고 2회 이상 시 자동 숨김 처리되어 현재 요구사항과 충돌한다.
- 플레이 수 증가 RPC에 `p_ip_hash`가 빈 문자열로 전달된다.
- 게임 수정 화면과 API에 `details` 모드가 남아 있어 최신 요구사항과 충돌한다.
- 수동 업로드는 문서상 선택이어야 하는 설명을 현재 필수로 요구한다.
- AI 모델은 환경변수 하나로 고정되어 있고 사용자 선택이 불가능하다.
- AI 수정에는 진행상황 UI가 없다.
- `GameActions`는 반응 쿠키를 다시 읽지 않아 새로고침 후 현재 반응 상태가 버튼에 표시되지 않는다.
- 생성 완료 후 즉시 `/my-games`로 이동해 성공 상태 카드가 사실상 사용자에게 보이지 않는다.

### 3.2 UI/UX 개선 포인트

- AI 생성과 AI 수정의 진행상황 경험이 일관되지 않다.
- AI 사용 비용이 사전에 보이지 않아 사용자 의사결정이 어렵다.
- 포인트 잔액이 주요 액션 화면에 보이지 않으면 AI 사용 장벽이 커진다.
- 피드백과 신고는 성격이 다르므로 액션 영역에서 더 명확히 분리돼야 한다.
- 관리자 `reported` 필터는 단순 `>0` 기준인데, 새 정책은 `2회 이상 alert` 중심으로 정리돼야 한다.
- 기본 썸네일이 KKE-OH 브랜딩과 직접 연결되지 않는다.
- 광고가 추가될 경우 게임 조작 영역, 전체화면 버튼, 리더보드 입력 UI를 침범하지 않도록 별도 배치 전략이 필요하다.

## 4. 작업 목록

### 4.1 P0: 신고 정책 재정렬

- 홈/공개 노출 조건에서 `report_count < 2` 제한 제거
- 신고 2회 이상 시 자동 숨김 로직 제거
- 관리자 목록에서 신고 2회 이상 게임을 alert 또는 강조 상태로 표시
- 관리자 필터를 `reported`와 `alert` 기준으로 재설계
- `/api/games/[id]/report` 응답에서 자동 숨김 전제를 제거

영향 범위:

- `lib/games/providers/supabase.ts`
- `lib/games/providers/filesystem.ts` 또는 제거 대상 코드
- `app/admin/admin-dashboard.tsx`
- `app/api/games/[id]/report/route.ts`
- 관련 문서

### 4.2 P0: 게임 상세 신고 UI 추가

- 공개 게임 상세 페이지에 신고 버튼 추가
- 신고 사유 입력 UI 설계
- `/api/games/[id]/report`와 연결
- 성공/실패 피드백 메시지 제공
- 신고 후 관리자 alert 기준을 고려한 안내 문구 정리

영향 범위:

- `components/game/game-actions.tsx`
- `app/game/[id]/page.tsx`
- i18n 문구

### 4.3 P0: 수동 업로드 정책 수정

- 단일 HTML 업로드에서 설명을 선택 입력으로 변경
- HTML 문자열 직접 입력 fallback 제거
- UI와 API 모두 파일 업로드만 허용하도록 정리
- ZIP 확정 API에서도 설명 필수 여부를 새 정책에 맞게 정리
- 수동 업로드에서 리더보드 사용 여부를 받을 수 있도록 구조 확장

영향 범위:

- `app/submit/submit-form.tsx`
- `app/api/upload/paste/route.ts`
- `app/api/upload/confirm/route.ts`
- `app/api/my-games/[id]/edit/route.ts`

### 4.4 P0: 직접 업로드 게임 리더보드 지원

- 수동 업로드와 수정 화면에 `리더보드 사용 여부` UI 추가
- 저장 시 `leaderboard_enabled` 값을 수동 게임에도 반영
- 사용자 게임이 리더보드를 쉽게 연동하도록 공식 방식 제공
  - 권장: `window.kkeohSubmitScore(score)` 브리지 표준화
- 필요 시 entry HTML 자동 브리지 삽입 전략 검토

영향 범위:

- `app/submit/submit-form.tsx`
- `app/my-games/edit-game-form.tsx`
- `app/api/upload/paste/route.ts`
- `app/api/upload/confirm/route.ts`
- `app/api/my-games/[id]/edit/route.ts`
- `lib/games/upload.ts`
- `lib/games/score-bridge.ts`

### 4.5 P0: 수정 화면 단순화

- `details` 전용 탭 제거
- `HTML`, `ZIP`, `AI` 세 모드만 유지
- 제목/설명/썸네일/리더보드 옵션을 각 모드 공통 입력으로 유지
- `AI로 다시 생성` 문구를 `AI로 수정`으로 정리

영향 범위:

- `app/my-games/edit-game-form.tsx`
- `app/api/my-games/[id]/edit/route.ts`
- 관련 i18n 문구

### 4.6 P0: AI 수정 진행상황 UI 추가

- 현재 생성 화면에 있는 진행상황 컴포넌트를 수정 화면에도 적용
- AI 생성과 AI 수정이 동일한 시각적 패턴을 사용하도록 통일
- 완료/실패 상태 메시지 구조도 함께 통일

영향 범위:

- `app/my-games/edit-game-form.tsx`
- 필요 시 공용 진행상황 컴포넌트 분리
- 관련 CSS

### 4.7 P0: AI 모델 선택 + 포인트 비용 표시

- AI 생성과 AI 수정 화면에 모델 선택 UI 추가
- 모델 목록/비용 조회 API 추가
- 선택 모델 기준 예상 차감 포인트 표시
- 포인트 부족 시 CTA 차단 및 구매 유도 UX 추가

영향 범위:

- `app/submit/submit-form.tsx`
- `app/my-games/edit-game-form.tsx`
- `app/api/upload/generate-v2/route.ts`
- `app/api/my-games/[id]/edit/route.ts`
- 신규 `api/ai/models`
- 신규 `lib/ai/*`

### 4.8 P0: 포인트 시스템 도입

- 사용자 포인트 잔액 테이블과 원장 테이블 추가
- 잔액 조회 API, 원장 조회 API 추가
- 플레이/광고/구매/AI 사용에 따른 적립·차감 서비스 추가
- 잔액 표시 UI와 포인트 페이지 추가

영향 범위:

- Supabase migrations
- 신규 `lib/points/*`
- `app/_components/site-navbar.tsx` 또는 현재 navbar
- 신규 `/points` 페이지
- 신규 포인트 API

### 4.9 P0: AI 생성/수정 포인트 차감 연동

- AI 요청 전에 서버 기준 포인트 검증
- 성공/실패/예외 시 차감/환불 정책 정의
- 모델별 create/edit 비용 분리
- 모든 차감 이벤트 원장 기록

영향 범위:

- `app/api/upload/generate-v2/route.ts`
- `app/api/my-games/[id]/edit/route.ts`
- 신규 `lib/ai/costs.ts`
- 신규 `lib/points/service.ts`

### 4.10 P1: Google 광고 통합

- 사이트 영역용 Google 광고 슬롯 설계
- 홈/탐색/상세/내 게임 페이지의 광고 배치 규칙 정의
- child-directed treatment 및 비개인화 광고 정책 반영
- 광고가 게임 조작 UI를 가리지 않도록 레이아웃 검증

영향 범위:

- `app/layout.tsx`
- `app/page.tsx`
- `app/game/[id]/page.tsx`
- 신규 `components/ads/*`
- 신규 광고 설정 모듈

### 4.11 P1: 게임 플레이 후 리워드형 광고 도입

- 게임 종료 후 리워드 광고 진입 UI 추가
- 사용자 opt-in 이후에만 광고 표시
- Google 웹 rewarded 흐름 지원 여부 확인
- 지원 환경이 아니면 fallback 안내 제공
- reward grant 이벤트 확인 후 포인트 적립

영향 범위:

- `app/game/[id]/page.tsx`
- `components/game/game-leaderboard.tsx` 또는 별도 post-play 컴포넌트
- 신규 `lib/ads/rewarded.ts`
- 신규 `/api/ads/rewarded/*`

### 4.12 P1: 포인트 구매 기능 도입

- 포인트 상품 목록 정의
- 주문 생성/승인/실패 흐름 설계
- 결제 승인 후 적립
- 구매 이력과 원장 연계
- 아동 대상 서비스 정책 검토 항목 정리

영향 범위:

- Supabase migrations
- 신규 `app/points/*`
- 신규 `api/points/purchase*`
- 결제 연동 모듈

### 4.13 P1: 반응 상태 복원 UX 개선

- 초기 렌더 시 쿠키 또는 서버 응답 기준으로 현재 반응 상태 표시
- 좋아요/싫어요 버튼 active 상태 복원
- 실패 메시지와 피드백 성공 메시지 상태를 분리

영향 범위:

- `components/game/game-actions.tsx`
- 필요 시 신규 API 또는 SSR hydration 데이터

### 4.14 P1: 완료 상태 UX 개선

- 생성 완료 후 즉시 페이지 이동하더라도 완료 상태를 인지할 수 있게 개선
- 선택지 예시
  - 이동 전 완료 카드 표시
  - `/my-games` 진입 후 플래시 배너 표시
  - 생성된 게임 바로 열기/내 게임으로 이동 선택 제공

영향 범위:

- `app/submit/submit-form.tsx`
- `app/my-games/page.tsx`
- 라우팅 상태 전달 방식

### 4.15 P1: 기본 썸네일을 KKE-OH 로고 기반으로 변경

- 현재 텍스트/색상 기반 플레이스홀더를 KKE-OH 로고 기반 디자인으로 교체
- 홈 카드, 챔피언 카드, 내 게임, 관리자 화면 모두 동일 정책 적용
- 로고 자산 재사용 방식으로 정리

영향 범위:

- `lib/games/placeholder.ts`
- `public/icon.svg`
- 썸네일 참조 컴포넌트 전반

### 4.16 P1: 인코딩 깨짐 복구

- 한국어 문구가 깨진 파일 전수 정리
- 페이지, 폼, 에러 메시지, 테스트 문자열까지 포함해 정상 UTF-8로 통일
- 회귀 검증 시 한국어 UI 전반 확인

영향 범위:

- `lib/i18n.ts`
- `app/submit/page.tsx`
- `app/game/[id]/page.tsx`
- `app/my-games/edit-game-form.tsx`
- `lib/auth/*`
- 테스트 파일 일부

### 4.17 P1: 플레이 수 집계에 IP 해시 반영

- 요청 IP를 서버에서 읽어 해시 처리
- play 증가 로직에서 해당 해시를 실제로 전달
- 필요 시 Supabase RPC 정의도 함께 정리
- 플레이 포인트 적립 정책과 충돌하지 않도록 중복 방지 검토

영향 범위:

- `app/api/games/[id]/play/route.ts`
- `lib/games/providers/supabase.ts`
- `supabase/migrations/*`
- `lib/security/ip.ts`
- `lib/security/hash.ts`

### 4.18 P1: AI 생성 경로 단일화

- `/api/upload/generate`와 `/api/upload/generate-v2` 중 하나만 남기기
- `lib/openai/game-generator.ts`와 `lib/games/ai-game-generator.ts` 중 표준 구현 하나만 남기기
- UI와 문서가 같은 경로/모듈을 바라보도록 통일

영향 범위:

- `app/api/upload/generate/route.ts`
- `app/api/upload/generate-v2/route.ts`
- `lib/openai/game-generator.ts`
- `lib/games/ai-game-generator.ts`
- 관련 import 전반

### 4.19 P2: Supabase 단일화

- `filesystem` driver 제거
- `GAME_DATA_DRIVER` 기반 분기 제거
- filesystem auth/game/leaderboard/reaction fallback 제거 또는 별도 보관 기준 확정
- 관련 환경변수와 README 정리

영향 범위:

- `lib/config.ts`
- `lib/games/repository.ts`
- `lib/games/providers/filesystem.ts`
- `lib/auth/repository.ts`
- `lib/auth/providers/filesystem.ts`
- `lib/games/leaderboard.ts`
- `lib/games/reactionFallback.ts`
- `README.md`
- `.env.example`

### 4.20 P2: 미사용 관리자/보안 코드 정리

- `/api/admin/auth` 제거
- `/api/admin/blocklist` 제거 또는 실제 기능화 여부 결정
- Turnstile, upload rate limit, blocklist 로직이 미사용이라면 제거
- 유지하려면 실제 업로드 정책으로 연결하고 문서화

영향 범위:

- `app/api/admin/auth/route.ts`
- `app/api/admin/blocklist/route.ts`
- `lib/security/turnstile.ts`
- `lib/db/games.ts`

### 4.21 P2: 테스트 보강

- 신고 정책 변경 테스트
- 수동 업로드 리더보드 옵션 테스트
- AI 생성/수정 모델 선택 및 포인트 차감 테스트
- AI 수정 진행상황 UI 테스트
- 리워드 광고 보상 지급 테스트
- 반응 상태 복원 테스트
- 완료 상태 UX 테스트
- 플레이 수 IP 해시 전달 테스트
- 광고 배치 회귀 테스트
- i18n 회귀 테스트 또는 스냅샷 검토

영향 범위:

- `lib/games/*.test.ts`
- 신규 `lib/points/*.test.ts`
- 신규 API/컴포넌트 테스트

## 5. 권장 구현 순서

1. 신고 정책 변경과 신고 UI 추가
2. AI 수정 진행상황 UI 추가
3. AI 모델 선택 및 비용 표시
4. 포인트 잔액/원장/차감 구조 도입
5. AI 생성/수정 포인트 연동
6. 직접 업로드 게임 리더보드 지원
7. 수정 화면 단순화
8. Google 광고 슬롯 통합
9. 리워드 광고와 포인트 적립 연동
10. 포인트 구매 기능 도입
11. 반응 상태 복원 및 완료 UX 개선
12. 인코딩 복구
13. 플레이 수 IP 해시 반영
14. AI 경로 단일화
15. Supabase 단일화 및 레거시 정리
16. 테스트 보강

## 6. 메모 및 가정

- 가정 1: 수동 업로드의 설명은 HTML/ZIP 모두 선택 입력으로 통일하는 방향으로 정리한다.
- 가정 2: 직접 업로드 게임의 리더보드 공식 연동 방식은 `window.kkeohSubmitScore(score)`로 통일한다.
- 가정 3: 신고 누적은 관리자 검수 신호이며, 자동 숨김 정책은 제거한다.
- 가정 4: 리워드 광고는 정책상 자동 재생이 아니라 opt-in 흐름으로 설계한다.
- 가정 5: KKE-OH는 아동 대상 서비스 성격이 강하므로 광고 요청은 child-directed 처리와 비개인화 정책을 기본값으로 본다.

실제 개발을 시작할 때는 이 문서를 작업 브리프 또는 단계별 체크리스트로 바로 사용할 수 있도록 유지한다.
