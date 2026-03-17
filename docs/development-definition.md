# KKE-OH 개발정의서

## 1. 문서 목적

이 문서는 `requirements-definition.md`에 맞춘 목표 개발 구조를 정리한 문서다.  
현재 코드의 설명이 아니라, 앞으로 정리되어야 할 기준 아키텍처와 구현 원칙을 정의한다.

- 기준일: 2026-03-17
- 기술 스택: Next.js 14 App Router, React 18, TypeScript, Zod, Supabase, Cloudflare R2, JSZip, Sharp
- 광고 검토 기준: Google 공식 웹 광고 문서의 child-directed treatment, personalized ads 제한, GPT rewarded ads 제약을 반영한다

## 2. 목표 시스템 개요

### 2.1 제품 성격

- 아동 친화적인 HTML 게임 업로드/생성/플레이 플랫폼
- 초안 중심의 제작-테스트-게시 워크플로우를 가진 웹앱
- 업로드 게임과 AI 생성 게임을 동일한 공개/운영 체계 안에서 관리하는 플랫폼
- Google 광고, 리워드 광고, 포인트 경제, AI 사용량 제어를 포함한 운영형 서비스

### 2.2 핵심 아키텍처 원칙

- App Router 기반 페이지 + Route Handler API 구조를 유지한다.
- 저장소는 `Supabase + R2` 단일 운영 구조로 정리한다.
- 공개 노출 정책과 관리자 검수 정책을 분리한다.
- 신고 누적은 자동 숨김이 아니라 관리자 alert 신호로 사용한다.
- 리더보드는 AI 게임 전용이 아니라 모든 게임이 사용할 수 있는 공용 기능으로 정리한다.
- 포인트는 서버 원장 기반으로 관리하고, AI 사용 전 차감 검증을 수행한다.
- 광고는 child-directed 처리와 비개인화 원칙을 전제로 통합한다.
- 업로드, 수정, 관리자 정책과 맞지 않는 레거시 코드는 제거한다.
- 작성자용 숨김과 관리자용 숨김은 같은 `is_hidden` 상태를 재사용하더라도 원인과 UX를 구분해 다뤄야 한다.

### 2.3 UI/UX 구현 원칙

- 헤더는 주요 CTA 우선순위를 기준으로 반응형 동작을 설계하고, 검색창이 먼저 축소되며 CTA는 줄바꿈되지 않게 유지한다.
- 홈 리더보드는 사이트 전체 톤과 어울리는 보조 시그니처 영역으로 취급하되, 블랙보드 질감과 chalk 스타일 포인트를 제한적으로 사용한다.
- 게임 카드의 긴 텍스트는 공통 말줄임 규칙과 tooltip 규칙으로 처리한다.
- 로그인, 관리자, 포인트, 내 게임 화면은 정보 밀도를 높이되 설명 과잉을 줄여 단정한 운영형 화면으로 맞춘다.
- 생성 화면과 수정 화면의 AI UX는 문체, 정보 구조, 비용 안내 체계를 동일하게 맞춘다.

## 3. 핵심 도메인

### 3.1 기존 도메인

- 게임 업로드/생성/수정
- 공개 목록/상세/리더보드
- 반응/피드백/신고
- 관리자 검수

### 3.2 확장 도메인

- AI 모델 카탈로그
- 포인트 잔액 및 거래 원장
- 포인트 구매 상품 및 주문
- 리워드 광고 세션 및 보상 지급
- Google 광고 슬롯 운영
- AI 생성/수정 사용량 및 비용 정책
- 홈 탐색 상호작용과 드래그 가능한 챔피언 스트립
- 다국어 인증 오류와 화면별 tooltip 규칙

## 4. 디렉터리 및 모듈 기준

### 4.1 유지 대상 주요 경로

- `app/`
  - 페이지와 API 라우트
- `components/`
  - 재사용 UI 및 게임 화면 컴포넌트
- `lib/auth/`
  - 인증 저장소, 세션, 비밀번호 해시
- `lib/games/`
  - 게임 도메인 로직
- `lib/security/`
  - 관리자 권한, CSP, IP 처리
- `lib/db/`
  - Supabase 클라이언트
- `lib/r2/`
  - R2 업로드/조회
- `supabase/migrations/`
  - DB 스키마 이력
- `public/`
  - KKE-OH 로고 및 기본 시각 자산

### 4.2 추가 정리가 필요한 모듈

- `components/site/`
  - 헤더 검색, 홈 챔피언 스트립, 게임 카드 말줄임 규칙 정리
- `components/game/`
  - 게임 상세 액션 tooltip, 리더보드 드래그 처리, 상태 문구 정리
- `components/ui/`
  - 공통 tooltip, danger button, truncate-with-tooltip 패턴을 둘 수 있는 레이어 검토
- `components/points/`
  - 잔액 표시, 포인트 구매 UI, 거래내역 UI
- `components/ads/`
  - 배너/피드 광고 슬롯, 리워드 광고 진입 UI
- `lib/ai/`
  - AI 모델 카탈로그, 비용 계산, 초등학생 눈높이 설명 metadata
- `lib/points/`
  - 잔액 조회, 거래 원장, 차감/적립 서비스
- `lib/ads/`
  - Google 광고 슬롯 설정, 리워드 광고 지원 여부, 보상 검증
- `lib/i18n/` 또는 현행 `lib/i18n.ts`
  - 인증 오류, tooltip 라벨, 관리자/포인트/생성 수정 copy 정비

### 4.3 정리 대상 경로/모듈

- filesystem 전용 provider 및 fallback 코드
- 미사용 관리자 API
- 중복된 AI 생성 구현
- 사용하지 않는 보안/차단 로직
- 인코딩이 깨진 문자열이 포함된 UI 문구
- 페이지별로 따로 구현된 유사한 cost card / danger button / status badge 변형

## 5. 실행/설정 구조

### 5.1 환경변수

핵심 환경변수는 다음과 같다.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `OPENAI_API_KEY`
- `OPENAI_GAME_MODEL`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_SLOT_*`
- `POINT_PACKAGE_*` 또는 포인트 상품 설정 테이블

### 5.2 운영 원칙

- `GAME_DATA_DRIVER`, `GAME_STORAGE_DIR`, `AUTH_STORAGE_DIR`, `GAME_METRICS_DIR`처럼 filesystem 전환을 위한 설정은 운영 기준에서 제거 대상이다.
- 게임 메타데이터는 Supabase `games` 테이블을 기준으로 관리한다.
- 게임 자산은 R2에 저장하고, 앱에서는 자산 API를 통해 접근을 중계한다.
- 광고 설정과 포인트 정책은 환경변수와 DB 설정을 혼용할 수 있으나, 사용자 과금/차감 정책은 DB 기준이 우선이다.

## 6. 데이터 모델

### 6.1 게임 도메인 모델

핵심 게임 모델은 다음 속성을 유지한다.

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

### 6.2 확장 포인트/광고/AI 모델 데이터 모델

필수 신규 또는 확장 엔터티:

- `ai_models`
  - `id`
  - `label`
  - `provider`
  - `model_name`
  - `point_cost_create`
  - `point_cost_edit`
  - `kid_description`
  - `active`
  - `sort_order`
- `user_point_balances`
  - `user_id`
  - `balance`
  - `updated_at`
- `user_point_ledger`
  - `id`
  - `user_id`
  - `type`
  - `delta`
  - `balance_after`
  - `source_type`
  - `source_id`
  - `metadata`
  - `created_at`
- `point_packages`
  - `id`
  - `name`
  - `points`
  - `price`
  - `active`
- `point_purchase_orders`
  - `id`
  - `user_id`
  - `package_id`
  - `status`
  - `payment_provider`
  - `provider_order_id`
  - `created_at`
  - `updated_at`
- `rewarded_ad_events`
  - `id`
  - `user_id`
  - `game_id`
  - `status`
  - `reward_points`
  - `ad_provider`
  - `provider_event_id`
  - `created_at`

### 6.3 핵심 정책 필드

- `report_count`
  - 관리자 alert 기준값 산정에 사용
  - 공개 노출 제외 조건으로 직접 사용하지 않음
- `leaderboard_enabled`
  - AI 게임/수동 업로드 게임 모두 사용 가능해야 함
- `thumbnail_path`
  - 사용자 업로드, AI 생성, ZIP 내부 후보, KKE-OH 로고 기반 기본 플레이스홀더 중 하나를 참조
- `is_hidden`
  - 관리자 검수 숨김과 작성자 공개 숨김 모두 표현할 수 있어야 함
- `hidden_reason`
  - `Hidden by admin`, `Hidden by owner`, `Removed by admin`, `Removed by owner`처럼 원인을 구분할 수 있어야 함
- `user_point_ledger`
  - 포인트 지급/차감의 최종 진실 원장
- `ai_models`
  - 모델 선택 UI, 비용 계산, 어린이 친화 설명의 기준

### 6.4 Supabase 스키마 기준

유지 대상 핵심 테이블:

- `games`
- `game_reports`
- `game_feedback`
- `app_users`
- `app_sessions`
- `game_leaderboard_entries`

신규 추가 또는 확장 대상 테이블:

- `ai_models`
- `user_point_balances`
- `user_point_ledger`
- `point_packages`
- `point_purchase_orders`
- `rewarded_ad_events`

재검토 대상 테이블:

- `upload_events`
- `blocklist`

## 7. 저장소 구조

### 7.1 게임 저장소

`lib/games/repository.ts`는 Supabase 기반 단일 저장소 추상화로 정리한다.

필요 기능:

- 공개 게임 목록 조회
- 관리자용 목록 조회
- 작성자별 목록 조회
- 단건 조회(`id`, `slug`)
- 플레이 수 증가
- 반응 저장
- 피드백 저장
- 신고 저장
- 게시
- 작성자 숨김 / 다시 공개
- 관리자 숨김 / 복구
- 삭제

### 7.2 인증 저장소

인증 저장소는 Supabase 기반으로 단일화한다.

필요 기능:

- 로그인 ID 조회
- 회원 생성
- 세션 생성
- 세션 토큰으로 사용자 조회
- 세션 삭제
- locale 기반 오류 메시지 매핑 또는 오류 code 반환

### 7.3 포인트 저장소

신규 `PointRepository` 또는 동등 서비스가 필요하다.

필요 기능:

- 잔액 조회
- 포인트 적립
- 포인트 차감
- 원장 기록 생성
- 주문 승인 후 포인트 지급
- 보상형 광고 승인 후 포인트 지급
- 중복 적립 방지

### 7.4 제거 원칙

- filesystem provider는 운영 구조와 맞지 않으므로 제거 대상이다.
- fallback을 유지할 명확한 운영 이유가 없다면 reactions/leaderboard/auth filesystem fallback도 함께 정리한다.

## 8. 페이지 구조

### 8.1 사용자 페이지

- `/`
  - 헤더 검색
  - 공개 게임 목록
  - 입력 즉시 필터링
  - 상단 챔피언 리더보드 스트립
  - 자동 이동 + drag/touch 이동
  - 광고 슬롯
- `/login`
  - 가운데 정렬된 로그인 / 회원가입 카드
  - 불필요한 설명 카드 제거
- `/submit`
  - AI 생성
  - HTML 업로드
  - ZIP 업로드
  - `How it works`
  - AI 모델 선택
  - 포인트 비용 안내
  - 접힌 고급 설정
- `/game/[id]`
  - 게임 플레이
  - 리더보드
  - 좋아요/싫어요
  - 피드백
  - 신고
  - tooltip
  - 리워드 광고 진입 UI
- `/my-games`
  - 내 게임 목록
  - 게시
  - 게시 숨김
  - 삭제
- `/my-games/[id]/edit`
  - 게임 수정
  - 상단 메타데이터 입력
  - AI 수정 진행상황 UI
  - AI 모델 선택
  - 접힌 고급 설정
- `/points`
  - 포인트 잔액
  - 거래내역
  - 3열 구매 카드
- `/admin`
  - 간결한 전체 게임 관리 대시보드
  - 썸네일 포함 목록
  - 신고 alert 우선 검토 영역

### 8.2 공통 화면 규칙

- 게임 카드 제목과 작성자명은 1줄 말줄임 처리한다.
- 말줄임 처리된 텍스트와 아이콘 액션은 tooltip으로 원문 또는 기능명을 보강한다.
- danger action은 관리자/내 게임 화면에서 같은 붉은색 계열 스타일을 공유한다.

## 9. API 구조 기준

### 9.1 인증/설정

| 경로 | 메서드 | 역할 |
| --- | --- | --- |
| `/api/auth/login` | `POST` | 로그인 및 세션 쿠키 발급 |
| `/api/auth/signup` | `POST` | 회원가입 및 세션 쿠키 발급 |
| `/api/auth/logout` | `POST` | 로그아웃 및 세션 쿠키 제거 |
| `/api/locale` | `POST` | 언어 쿠키 저장 |

원칙:

- 인증 API는 locale cookie 또는 요청 컨텍스트에 맞는 오류 code / 현지화 메시지를 반환해야 한다.
- 중복 ID, 비밀번호 형식 오류 등은 클라이언트가 빨간 오류 스타일로 그대로 표시할 수 있는 안정적인 오류 포맷을 제공해야 한다.

### 9.2 업로드/생성/수정

| 경로 | 메서드 | 역할 |
| --- | --- | --- |
| `/api/upload/title-check` | `GET` | slug 사용 가능 여부 확인 |
| `/api/upload/zip-inspect` | `POST` | ZIP 검사 및 임시 세션 저장 |
| `/api/upload/paste` | `POST` | HTML 파일 업로드 저장 |
| `/api/upload/confirm` | `POST` | ZIP 검사 결과 확정 저장 |
| `/api/upload/generate-v2` | `POST` | 표준 AI 생성 API |
| `/api/my-games/[id]` | `POST` | 작성자용 게시/숨김/삭제 상태 변경 |
| `/api/my-games/[id]/edit` | `POST` | 게임 수정 API |
| `/api/ai/models` | `GET` | AI 모델 목록/비용/설명 조회 |

원칙:

- AI 생성 API는 하나만 유지한다.
- HTML 업로드는 파일 업로드만 받는다.
- 수동 업로드의 설명은 선택 입력으로 처리한다.
- ZIP 업로드에서는 별도 외부 썸네일 파일을 요구하지 않는다.
- 수동 업로드와 수정 흐름 모두 `leaderboard_enabled`를 명시적으로 다룬다.
- AI 생성/수정 요청은 `modelId`를 받아 포인트 선차감 검증을 수행한다.
- AI 생성/수정 UI는 모두 모델 설명, 현재 포인트, 예상 차감, 부족 여부를 같은 형식으로 받는다.

### 9.3 게임 플레이/광고

| 경로 | 메서드 | 역할 |
| --- | --- | --- |
| `/api/games/[id]/assets/[...assetPath]` | `GET` | 게임 자산 제공 |
| `/api/games/[id]/play` | `POST` | 플레이 수 증가 및 플레이 포인트 적립 검토 |
| `/api/games/[id]/reaction` | `POST` | 좋아요/싫어요 저장 |
| `/api/games/[id]/feedback` | `POST` | 피드백 저장 |
| `/api/games/[id]/report` | `POST` | 신고 저장 |
| `/api/games/[id]/leaderboard` | `POST` | 리더보드 점수 저장 |
| `/api/ads/rewarded/session` | `POST` | 리워드 광고 시청 세션 시작 |
| `/api/ads/rewarded/grant` | `POST` | 리워드 승인 후 포인트 적립 |

정책:

- 신고는 저장하되 자동 숨김을 수행하지 않는다.
- 플레이 수 증가는 IP 직접값이 아니라 해시 기반 값을 사용한다.
- 리워드 포인트는 광고 완료 이벤트가 승인된 후에만 지급한다.

### 9.4 포인트/구매

| 경로 | 메서드 | 역할 |
| --- | --- | --- |
| `/api/points/balance` | `GET` | 현재 잔액 조회 |
| `/api/points/ledger` | `GET` | 거래내역 조회 |
| `/api/points/packages` | `GET` | 구매 상품 조회 |
| `/api/points/purchase` | `POST` | 포인트 구매 주문 생성 |
| `/api/points/purchase/confirm` | `POST` | 결제 승인 후 포인트 적립 |

### 9.5 관리자

| 경로 | 메서드 | 역할 |
| --- | --- | --- |
| `/api/admin/games` | `GET` | 관리자용 게임 목록 |
| `/api/admin/games/[id]/hide` | `POST` | 게임 숨김 |
| `/api/admin/games/[id]/unhide` | `POST` | 게임 복구 |
| `/api/admin/games/[id]/delete` | `POST` | 게임 삭제 처리 |

원칙:

- 비활성 관리자 API는 유지하지 않는다.
- 신고 alert 상태를 응답이나 정렬 기준에서 우선 취급할 수 있어야 한다.

## 10. 핵심 업무 흐름

### 10.1 홈 탐색 흐름

1. 공개 게임과 챔피언 데이터를 조회한다.
2. 챔피언 스트립을 메인 상단에 먼저 배치한다.
3. 검색 입력값으로 제목/작성자 기준 클라이언트 필터링을 수행한다.
4. 챔피언 스트립은 자동 이동을 시작한다.
5. 사용자가 마우스 또는 손가락으로 drag 하면 수동 이동을 우선한다.
6. drag 종료 후 자동 이동을 다시 자연스럽게 재개한다.

### 10.2 AI 생성 흐름

1. 로그인 확인
2. AI 모델 목록, 초등학생용 설명, 비용, 잔액 조회
3. 모델 선택과 포인트 잔액 확인
4. 부족 시 차단 또는 포인트 구매 유도
5. 프롬프트 검증
6. 필요 시 접힌 고급 설정을 열어 메타데이터 입력
7. OpenAI Responses API 호출
8. HTML에 KKE-OH 리더보드 브리지 삽입
9. 썸네일 SVG 정규화 또는 기본 썸네일 결정
10. 포인트 차감 원장 기록
11. 초안 저장
12. 리더보드 활성화
13. 진행상황 UI와 완료 상태 노출

### 10.3 AI 수정 흐름

1. 로그인 확인
2. 수정 대상 소유권 확인
3. AI 모델 목록, 설명, 비용, 잔액 조회
4. 모델 선택과 포인트 잔액 확인
5. 부족 시 차단 또는 포인트 구매 유도
6. 상단 메타데이터 입력 확인
7. 필요 시 접힌 고급 설정 입력 확인
8. 현재 게임 정보/HTML 일부를 문맥으로 구성
9. OpenAI 호출
10. 포인트 차감 원장 기록
11. 수정 결과 저장
12. AI 생성과 동일한 수준의 진행상황 UI 표시

### 10.4 공개 게임 플레이와 리워드 광고 흐름

1. 공개 게임 플레이 시작
2. 플레이 수 증가 시도 및 포인트 적립 조건 판단
3. 게임 종료/클리어 후 리워드 광고 진입 UI 노출
4. 사용자가 opt-in 시 광고 세션 요청
5. 지원 환경이면 Google rewarded flow 실행
6. 보상 승인 이벤트 수신 시 포인트 적립
7. 실패/미지원 시 대체 안내 표시

### 10.5 작성자 공개/숨김 흐름

1. 초안 게임은 `Publish`로 공개 전환한다.
2. 이미 공개된 게임은 `Hide from Publish`로 숨김 전환한다.
3. 숨김 게임은 다시 공개할 수 있어야 한다.
4. 이 흐름은 초안 회귀와 구분되며, 기존 공개 상태 기록과 URL은 유지한다.

### 10.6 포인트 구매 흐름

1. 사용자가 포인트 상품 선택
2. 주문 생성
3. 결제 승인 대기
4. 승인 완료 후 포인트 적립
5. 원장 기록 생성
6. 잔액 즉시 반영

## 11. 주요 도메인 로직

### 11.1 slug 처리

- slug는 NFKC 정규화 후 소문자화
- 영문/숫자 외 문자는 하이픈으로 치환
- 최대 길이 64자
- 형식 검증 정규식: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- 중복 시 suffix(`-2`, `-3`...)를 붙여 유니크 생성

### 11.2 ZIP 검사

- 허용 확장자 목록 기반 필터
- 상대 경로 탈출 방지
- `game.json`은 무시
- HTML 목록, 썸네일 후보, allowlist 위반 여부를 함께 추출
- ZIP 업로드에서는 외부 썸네일 입력 대신 ZIP 내부 후보나 기본 썸네일 정책을 사용한다.

### 11.3 기본 썸네일 처리

- 기본 플레이스홀더는 KKE-OH 로고 기반으로 생성
- 사용자 지정 썸네일이 있으면 우선 사용
- ZIP 업로드에서는 별도 외부 썸네일 없이 ZIP 내부 후보 사용 여부를 검토한다.
- 썸네일은 업로드 시 WEBP로 최적화

### 11.4 신고 처리

신고 처리 원칙:

- 신고 사유는 저장
- `report_count`는 누적
- 2회 이상이면 관리자 alert 상태로 표시
- 자동 숨김은 하지 않음

### 11.5 리더보드 수집

리더보드 공용 연동 규약:

- 공식 점수 제출 함수: `window.kkeohSubmitScore(score)`
- AI 생성 게임은 해당 브리지를 자동 포함
- 수동 업로드 게임도 동일 브리지를 사용할 수 있어야 함
- iframe DOM 스캔 기반 점수 추출은 보조 수단으로 유지 가능하나, 공식 연동 방식은 브리지 함수로 통일
- 홈 챔피언 스트립은 자동 이동과 drag 이동을 모두 지원해야 한다.

### 11.6 포인트 차감/적립 원칙

- 모든 포인트 변화는 `user_point_ledger`에 기록한다.
- AI 생성/수정 차감은 서버에서 최종 검증한다.
- 플레이 포인트 적립은 공개 게임과 정상 플레이에만 적용한다.
- 리워드 광고 포인트는 grant 이벤트 확인 후에만 적립한다.
- 구매 포인트는 결제 승인 후에만 적립한다.
- 동일 이벤트의 중복 적립을 막기 위해 source 기반 idempotency가 필요하다.

### 11.7 광고 통합 원칙

- 일반 사이트 광고는 Google 광고 슬롯으로 통합한다.
- 아동 대상 서비스 특성상 ad request에는 child-directed treatment를 반영해야 한다.
- 13세 미만 또는 아동 대상 활동을 기반으로 개인화 광고를 사용하지 않는다.
- 웹 리워드 광고는 GPT rewarded 흐름처럼 지원 환경에서만 요청하고, 미지원 시 graceful fallback 해야 한다.
- 리워드 광고는 사용자 동의 후 표시해야 한다.

### 11.8 텍스트 말줄임 및 tooltip 규칙

- 홈 게임 카드 제목과 작성자명은 1줄 말줄임 처리한다.
- 말줄임 대상 텍스트는 `title` 속성 또는 공통 tooltip으로 원문을 제공한다.
- 게임 상세 액션 버튼은 마우스 hover와 키보드 focus에서 기능명을 확인할 수 있어야 한다.
- 로그인/회원가입 오류 메시지는 현재 locale에 맞는 문구를 붉은색 오류 스타일로 노출한다.

## 12. 보안/안전 설계

### 12.1 쿠키

- 세션, 반응, 플레이 집계에 `httpOnly` 쿠키 사용
- 운영 환경에서 `secure: true`
- `sameSite: lax`

### 12.2 자산 접근 제어

- 삭제 게임은 제공 금지
- 공개 게임은 누구나 제공 가능
- 초안/숨김 게임은 작성자 또는 관리자만 제공
- HTML 자산 응답에는 CSP 헤더 추가

### 12.3 iframe 실행 정책

게임 iframe sandbox:

- `allow-scripts`
- `allow-same-origin`
- `allow-pointer-lock`

### 12.4 과금/포인트 안전장치

- 포인트 차감은 클라이언트가 아니라 서버가 결정
- 구매 승인 전 선지급 금지
- 동일 보상 이벤트 중복 적립 금지
- AI 요청 실패 시 포인트 환불/보류 정책을 분리 정의

### 12.5 정리 원칙

- 사용하지 않는 Turnstile, blocklist, filesystem fallback은 제거 여부를 먼저 검토하고, 유지 가치가 없으면 코드에서 정리한다.
- 레거시 엔드포인트를 남겨두기보다 단일 정책으로 정리한다.

## 13. 테스트 기준

필수 검증 범위:

- 헤더 반응형 우선순위
  - 검색창 축소
  - `Create Game` 버튼 줄바꿈 방지
  - 헤더 포인트 버튼 제거
- 홈 검색 live filtering
  - 제목 기준
  - 작성자 기준
  - 입력 즉시 반영
- 홈 챔피언 스트립
  - 상단 배치
  - 자동 이동
  - 마우스 drag
  - 터치 drag
- 게임 카드 말줄임 및 tooltip
  - 제목 1줄
  - 작성자 1줄
- 로그인/회원가입 단순화 레이아웃
- 중복 ID 오류 locale 반영 및 붉은색 표시
- ZIP 검사
  - 외부 썸네일 입력 제거 회귀
- 수동 업로드 리더보드 on/off
- AI 생성/수정 모델 선택, 설명, 비용 카드 일관성
- AI 생성/수정 진행상황 UI
- 생성/수정 고급 설정 기본 접힘 상태
- 게임 상세 액션 tooltip
- 작성자 공개/숨김 흐름
- 관리자 리스트 썸네일 표시 및 단순화 레이아웃
- 포인트 구매 카드 3열 정렬
- 인코딩 복구 후 한국어 UI 회귀 확인
- 플레이 수 집계의 IP 해시 전달
- 광고 슬롯이 게임 조작 UI를 가리지 않는지 확인

## 14. 현재 코드와의 주요 갭

현재 코드와 목표 정의서 사이의 큰 차이는 다음과 같다.

- 헤더에 포인트 버튼이 남아 있고, 좁은 화면에서 `Create Game` 버튼과 검색창 우선순위가 맞지 않음
- 홈 검색이 live filtering이 아니라 제출형 동작이며 검색 기준도 현재 목표와 다름
- 홈 챔피언 스트립이 게임 그리드 아래에 있고 블랙보드 디자인 및 drag 상호작용이 없음
- 게임 카드 제목/작성자 말줄임과 tooltip 규칙이 없음
- 로그인 화면에 좌측 설명 카드가 있고 카드 내부 `Login` 뱃지 및 보조 문구가 남아 있음
- 인증 오류 locale 처리와 깨진 한국어 문구가 정리되지 않음
- 회원가입 중복 ID 오류가 선택 언어와 무관하게 일관되지 않음
- 생성 화면의 `How it works`, AI 모델 설명, cost card, 고급 설정 접힘 UX가 목표 수준에 미치지 않음
- ZIP 업로드에서 외부 썸네일 입력 제거 정책이 반영되지 않음
- 수정 화면의 입력 순서, AI 모드 우선순위, 하단 버튼 구성이 목표와 다름
- 게임 상세 액션 버튼의 명시적 tooltip이 없음
- 내 게임 화면이 `Move to Draft` 중심이며 작성자 숨김 흐름과 danger delete 스타일이 없음
- 관리자 화면 상단 설명이 과하고 썸네일이 목록에 표시되지 않음
- 포인트 구매 카드가 3열 정렬 기준을 만족하지 않음

이 갭을 메우는 작업 목록은 별도 문서에서 관리한다.
