# KKE-OH 현재 구현 기준 개발정의서

## 1. 문서 목적

이 문서는 `kke-oh`의 현재 개발 구조, 데이터 모델, 주요 흐름, API, 기술 제약을 정리한 문서다.  
실제 코드베이스를 기준으로 작성했으며, 향후 기능 개발 전 영향도 검토의 기준 문서로 사용한다.

- 기준일: 2026-03-16
- 기술 스택: Next.js 14 App Router, React 18, TypeScript, Zod, Supabase, Cloudflare R2, JSZip, Sharp

## 2. 시스템 개요

### 2.1 제품 성격

- 아동 친화적인 HTML 게임 업로드/생성/플레이 플랫폼
- 서버 렌더링 기반 웹앱
- 단일 프로젝트 내에 웹 UI, API, 인증, 저장소 추상화가 함께 존재

### 2.2 핵심 아키텍처 특징

- App Router 기반 페이지 + Route Handler API 구조
- 저장소 드라이버 추상화
  - `filesystem`
  - `supabase`
- 게임 메타데이터와 자산 저장 분리
- 초안/공개/삭제 상태 관리
- iframe 기반 게임 실행
- 점수 브리지 기반 리더보드 수집

## 3. 디렉터리 구조

### 3.1 주요 경로

- `app/`
  - 페이지와 API 라우트
- `components/`
  - 재사용 UI 및 게임 화면 컴포넌트
- `lib/auth/`
  - 인증 저장소, 세션, 비밀번호 해시
- `lib/games/`
  - 게임 도메인 로직
- `lib/security/`
  - 관리자 권한, CSP, IP, Turnstile, 업로드 캐시
- `lib/db/`
  - Supabase 클라이언트와 일부 DB 유틸
- `lib/r2/`
  - R2 업로드/조회
- `supabase/migrations/`
  - DB 스키마 이력
- `data/games/`
  - filesystem 모드 게임 저장소 예시

## 4. 실행/설정 구조

### 4.1 환경변수

핵심 환경변수는 다음과 같다.

- `GAME_DATA_DRIVER`
- `GAME_STORAGE_DIR`
- `AUTH_STORAGE_DIR`
- `GAME_METRICS_DIR`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `OPENAI_API_KEY`
- `OPENAI_GAME_MODEL`

### 4.2 드라이버 선택 규칙

`lib/config.ts` 기준:

- `GAME_DATA_DRIVER`가 있으면 해당 값 사용
- 없으면 `SUPABASE_URL`과 `R2_ENDPOINT` 존재 시 `supabase`
- 그렇지 않으면 `filesystem`

## 5. 데이터 모델

## 5.1 게임 도메인 모델

`GameRecord`

- `id`
- `slug`
- `title`
- `description`
- `uploader_user_id`
- `uploader_name`
- `status`: `DRAFT | PUBLIC | REMOVED`
- `is_hidden`
- `hidden_reason`
- `storage_prefix`
- `report_count`
- `allowlist_violation`
- `leaderboard_enabled`
- `like_count`
- `dislike_count`
- `plays_7d`
- `plays_30d`
- `entry_path`
- `thumbnail_path`
- `created_at`
- `updated_at`

### 5.2 filesystem 저장 형식

게임 1건당 디렉터리 1개를 사용한다.

```text
data/games/<game-id>/
  game.json
  index.html
  ...assets
```

인증 저장소는 단일 JSON 파일을 사용한다.

```text
data/auth/store.json
```

반응 fallback 저장소는 별도 metrics 디렉터리를 사용한다.

```text
data/game-metrics/reactions.json
```

리더보드 fallback은 게임별 JSON 파일을 사용한다.

```text
data/leaderboards/<game-id>.json
```

### 5.3 Supabase 스키마

마이그레이션 기준 주요 테이블:

- `games`
- `game_reports`
- `upload_events`
- `blocklist`
- `game_feedback`
- `app_users`
- `app_sessions`
- `game_leaderboard_entries`

주요 스키마 변경 이력:

- 초기 버전: 공개/삭제 상태, 신고, 업로드 이벤트, blocklist
- 반응 추가: `like_count`, `dislike_count`, `game_feedback`
- 인증 추가: `app_users`, `app_sessions`, 업로더 정보
- slug 추가: `games.slug`
- 초안/리더보드 추가: `DRAFT` 상태, `leaderboard_enabled`, `game_leaderboard_entries`

## 6. 저장소 추상화

### 6.1 게임 저장소

`lib/games/repository.ts`

- `GameRepository`
- `GameAssetStore`

구현체:

- `FilesystemGameRepository`
- `FilesystemGameAssetStore`
- `SupabaseGameRepository`
- `SupabaseGameAssetStore`

### 6.2 인증 저장소

`lib/auth/repository.ts`

- `AuthRepository`

구현체:

- `FilesystemAuthRepository`
- `SupabaseAuthRepository`

### 6.3 fallback 전략

- game/auth driver는 환경변수로 결정
- Supabase 인증 테이블이 없으면 인증은 filesystem fallback
- Supabase에 반응 컬럼이 없으면 `reactionFallback.ts` 사용
- Supabase에 리더보드 테이블이 없으면 파일 기반 리더보드 fallback 사용

## 7. 페이지 구조

### 7.1 사용자 페이지

- `/`
  - 공개 게임 목록
  - 검색
  - 챔피언 마키
- `/login`
  - 로그인 / 회원가입
- `/submit`
  - AI 생성
  - HTML 업로드
  - ZIP 업로드
- `/game/[id]`
  - 게임 플레이
  - 리더보드
  - 반응/피드백
- `/my-games`
  - 내 게임 목록
- `/my-games/[id]/edit`
  - 게임 수정

### 7.2 관리자 페이지

- `/admin`
  - 전체 게임 관리 대시보드

## 8. API 구조

### 8.1 인증/설정

| 경로 | 메서드 | 역할 | 인증 |
| --- | --- | --- | --- |
| `/api/auth/login` | `POST` | 로그인 및 세션 쿠키 발급 | 없음 |
| `/api/auth/signup` | `POST` | 회원가입 및 세션 쿠키 발급 | 없음 |
| `/api/auth/logout` | `POST` | 로그아웃 및 세션 쿠키 제거 | 로그인 |
| `/api/locale` | `POST` | 언어 쿠키 저장 | 없음 |

### 8.2 업로드/생성

| 경로 | 메서드 | 역할 | 인증 |
| --- | --- | --- | --- |
| `/api/upload/title-check` | `GET` | slug 사용 가능 여부 확인 | 없음 |
| `/api/upload/zip-inspect` | `POST` | ZIP 검사 및 임시 세션 저장 | 로그인 |
| `/api/upload/paste` | `POST` | HTML 업로드 저장 | 로그인 |
| `/api/upload/confirm` | `POST` | ZIP 검사 결과 확정 저장 | 로그인 |
| `/api/upload/generate` | `POST` | 구형 AI 생성 API | 로그인 |
| `/api/upload/generate-v2` | `POST` | 현재 UI가 사용하는 AI 생성 API | 로그인 |

### 8.3 게임 플레이

| 경로 | 메서드 | 역할 | 인증 |
| --- | --- | --- | --- |
| `/api/games/[id]/assets/[...assetPath]` | `GET` | 게임 자산 제공 | 공개/소유자/관리자 |
| `/api/games/[id]/play` | `POST` | 플레이 수 증가 | 없음 |
| `/api/games/[id]/reaction` | `POST` | 좋아요/싫어요 저장 | 없음 |
| `/api/games/[id]/feedback` | `POST` | 피드백 저장 | 없음 |
| `/api/games/[id]/report` | `POST` | 신고 저장 | 없음 |
| `/api/games/[id]/leaderboard` | `POST` | 리더보드 점수 저장 | 조건부 |

### 8.4 내 게임

| 경로 | 메서드 | 역할 | 인증 |
| --- | --- | --- | --- |
| `/api/my-games/[id]` | `POST` | 게시/초안전환/삭제 | 작성자 |
| `/api/my-games/[id]/edit` | `POST` | 게임 수정 | 작성자 |

### 8.5 관리자

| 경로 | 메서드 | 역할 | 인증 |
| --- | --- | --- | --- |
| `/api/admin/games` | `GET` | 관리자용 게임 목록 | 관리자 |
| `/api/admin/games/[id]/hide` | `POST` | 게임 숨김 | 관리자 |
| `/api/admin/games/[id]/unhide` | `POST` | 게임 복구 | 관리자 |
| `/api/admin/games/[id]/delete` | `POST` | 게임 삭제 처리 | 관리자 |
| `/api/admin/auth` | `POST` | 비활성 API, 410 응답 | 비권장 |
| `/api/admin/blocklist` | `POST` | 비활성 API, 410 응답 | 관리자 |

## 9. 핵심 업무 흐름

### 9.1 로그인 흐름

1. 사용자가 로그인/회원가입 폼 제출
2. Zod로 payload 검증
3. AuthRepository 또는 fallback 저장소 조회
4. 비밀번호 PBKDF2 검증
5. 세션 토큰 생성
6. 세션 해시 저장
7. `kkeoh_session` 쿠키 발급

### 9.2 수동 HTML 업로드 흐름

1. 로그인 확인
2. 제목/slug/설명/HTML 유효성 검증
3. 썸네일 업로드 시 이미지 최적화
4. 단일 HTML 검사 객체 생성
5. 외부 링크 allowlist 위반 여부 검사
6. 썸네일이 없으면 플레이스홀더 생성
7. slug 확정
8. 초안 상태로 저장
9. 관련 경로 revalidate

### 9.3 ZIP 업로드 흐름

1. 로그인 확인
2. ZIP 파일 검사
3. 서버 메모리 캐시에 inspection 저장
4. 사용자가 확인 요청 시 inspection 소비
5. 썸네일 정규화/플레이스홀더 생성
6. slug 확정
7. 초안 저장
8. 관련 경로 revalidate

### 9.4 AI 생성 흐름

1. 로그인 확인
2. 프롬프트/선택 필드 검증
3. OpenAI Responses API 호출
4. JSON schema 응답 파싱
5. HTML에 리더보드 브리지 삽입
6. 썸네일 SVG 정규화
7. inspection 생성 및 저장
8. 초안 저장
9. 리더보드 활성화

### 9.5 게임 수정 흐름

모드별 처리:

- `details`
  - 제목/설명/썸네일만 갱신
- `html`
  - 새 HTML로 inspection 생성 후 교체
- `zip`
  - 새 ZIP 검사 후 전체 자산 갱신
- `ai`
  - 현재 게임 제목/설명/기존 HTML 일부를 문맥으로 넣어 재생성

## 10. 주요 도메인 로직

### 10.1 slug 처리

`lib/games/upload.ts`

- slug는 NFKC 정규화 후 소문자화
- 영문/숫자 외 문자는 하이픈으로 치환
- 최대 길이 64자
- 형식 검증 정규식: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- 중복 시 suffix(`-2`, `-3`...)를 붙여 유니크 생성 가능

### 10.2 ZIP 검사

- 허용 확장자 목록 기반 필터
- 상대 경로 탈출 방지
- `game.json`은 무시
- HTML 목록, 썸네일 후보, allowlist 위반 여부를 함께 추출

### 10.3 외부 링크 검사

`detectAllowlistViolation`

- HTML 내 `http/https` URL의 호스트를 추출
- 허용 목록:
  - `cdn.jsdelivr.net`
  - `unpkg.com`
  - `cdnjs.cloudflare.com`
  - `fonts.googleapis.com`
  - `fonts.gstatic.com`

### 10.4 썸네일 처리

- Sharp 사용
- 회전 보정
- 1200x825 이내 리사이즈
- WEBP 품질 82
- 최적화된 경로는 `__kkeoh_thumbnail*.webp`

### 10.5 공개 목록 정렬

`lib/games/discovery.ts`

인기 점수 계산 요소:

- 최근 7일 플레이 가중치
- 최근 30일 플레이 가중치
- 좋아요/싫어요 점수
- 승인율 보너스
- 최신 업로드 보너스

### 10.6 리더보드 수집

`components/game/game-leaderboard.tsx` + `lib/games/score-bridge.ts`

점수 수집 방식 두 가지:

- 명시적 브리지 호출
  - `window.kkeohSubmitScore(score)`
  - `postMessage`로 부모에 전달
- 화면 텍스트 분석
  - iframe body text에서 score 후보 추출
  - 종료 문구 감지 시 제출

중복 방지:

- 프론트: 최근 동일 점수 재전송 방지
- 서버: 동일 이름/점수 15초 이내 중복 저장 방지

### 10.7 관리자 권한

현재 관리자 판정은 코드 상 고정 계정 기반:

- `kylee1112@hotmail.com`
- `jaden`

## 11. 보안/안전 설계

### 11.1 쿠키

- 세션, 반응, 플레이 집계에 `httpOnly` 쿠키 사용
- 운영 환경에서 `secure: true`
- `sameSite: lax`

### 11.2 자산 접근 제어

- 삭제 게임은 제공 금지
- 공개 게임은 누구나 제공 가능
- 초안/숨김 게임은 작성자 또는 관리자만 제공
- HTML 자산 응답에는 CSP 헤더 추가

### 11.3 iframe 실행 정책

게임 iframe sandbox:

- `allow-scripts`
- `allow-same-origin`
- `allow-pointer-lock`

### 11.4 현재 미연결 보안 구성요소

코드에는 있으나 현재 라우트에 연결되지 않은 요소:

- Turnstile 검증
- IP 업로드 횟수 제한
- blocklist 조회

## 12. 테스트 현황

테스트 파일 기준 확인 가능한 검증 범위:

- `lib/games/upload.test.ts`
  - slug 정규화/유효성/중복 확인
- `lib/games/score-bridge.test.ts`
  - 점수 추출, 종료 문구 감지, 브리지 주입
- `lib/games/leaderboard.test.ts`
  - 플레이어명/점수 정규화
- `lib/games/discovery-ranking.test.ts`
  - 인기 정렬 우선순위
- `lib/games/ai-game-generator.test.ts`
  - 시스템 프롬프트 핵심 요구 포함 여부
- `lib/security/admin-rules.test.ts`
  - 관리자 계정 판정

현재 테스트는 단위 함수 중심이며, 다음 영역의 통합 테스트는 보이지 않는다.

- 업로드 API 전체 흐름
- 내 게임 수정 API
- 관리자 API 권한/행동
- Supabase/R2 연동

## 13. 현재 기술 부채 및 영향도 포인트

### 13.1 기능 중복/레거시 흔적

- `lib/openai/game-generator.ts`와 `lib/games/ai-game-generator.ts`가 유사한 역할로 공존
- `/api/upload/generate`와 `/api/upload/generate-v2`가 동시에 존재
- 관리자 비밀번호 방식 API는 제거되었지만 엔드포인트는 남아 있음

### 13.2 운영 리스크

- 관리자 계정이 코드 하드코딩이라 운영 변경 시 배포가 필요
- 한국어 문자열 일부가 깨져 있어 UI/문서 품질 이슈 가능
- 업로드 제한/차단 로직이 DB에는 있으나 실제 업로드 차단으로 이어지지 않음
- Supabase play RPC는 `p_ip_hash`를 받지만 현재 빈 문자열 전달

### 13.3 변경 영향도가 큰 영역

아래 영역은 서로 연결도가 높아 수정 시 영향 범위를 넓게 봐야 한다.

- `lib/games/upload.ts`
  - 업로드, 수정, slug, 썸네일, inspection 전반 공용
- `lib/games/repository.ts` 및 provider 구현체
  - 화면/관리/API 전체 공통 의존
- `components/game/game-leaderboard.tsx`
  - 브리지, 자동 스코어 수집, 게스트 이름 처리 결합
- `app/api/my-games/[id]/edit/route.ts`
  - 수정 모드 4종이 한 라우트에 집중

## 14. 개발 시 권장 확인 순서

향후 기능 추가 또는 수정 시 권장 확인 순서는 다음과 같다.

1. 요구 기능이 공개 게임/초안/관리자 중 어느 상태에 걸치는지 확인
2. `filesystem`과 `supabase` 두 모드 모두 영향 받는지 확인
3. 게임 메타데이터 변경인지, 자산 파일 변경인지 구분
4. 리더보드/slug/thumbnail/allowlist 규칙에 영향이 있는지 확인
5. 관련 API revalidate 경로가 충분한지 확인
6. 단위 테스트 외 통합 검증 필요 여부를 별도로 판단

## 15. 결론

현재 KKE-OH는 단순 업로드 사이트 수준을 넘어 다음 구조를 이미 갖춘 상태다.

- 이중 저장소 드라이버
- 초안 중심의 제작/게시 워크플로우
- AI 생성과 수동 업로드의 병행 지원
- 리더보드 자동 수집
- 관리자 검수 화면

다만 운영 안전장치 일부는 준비만 되어 있고 아직 메인 플로우에 연결되지 않았으므로, 다음 개발 단계에서는 이 부분을 실제 정책으로 연결하는 작업의 영향도가 크다.
