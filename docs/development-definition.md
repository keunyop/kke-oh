# KKE-OH 개발정의서

## 1. 문서 목적

이 문서는 `requirements-definition.md`에 맞춘 목표 개발 구조를 정리한 문서다.  
현재 코드의 설명이 아니라, 앞으로 정리되어야 할 기준 아키텍처와 구현 원칙을 정의한다.

- 기준일: 2026-03-16
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

## 3. 핵심 도메인

### 3.1 기존 도메인

- 게임 업로드/생성/수정
- 공개 목록/상세/리더보드
- 반응/피드백/신고
- 관리자 검수

### 3.2 신규 도메인

- AI 모델 카탈로그
- 포인트 잔액 및 거래 원장
- 포인트 구매 상품 및 주문
- 리워드 광고 세션 및 보상 지급
- Google 광고 슬롯 운영
- AI 생성/수정 사용량 및 비용 정책

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

### 4.2 신규 추가가 필요한 모듈

- `lib/ai/`
  - AI 모델 카탈로그, 비용 계산, 모델 정책
- `lib/points/`
  - 잔액 조회, 거래 원장, 차감/적립 서비스
- `lib/ads/`
  - Google 광고 슬롯 설정, 리워드 광고 지원 여부, 보상 검증
- `components/points/`
  - 잔액 표시, 포인트 구매 UI, 거래내역 UI
- `components/ads/`
  - 배너/피드 광고 슬롯, 리워드 광고 진입 UI

### 4.3 정리 대상 경로/모듈

- filesystem 전용 provider 및 fallback 코드
- 미사용 관리자 API
- 중복된 AI 생성 구현
- 사용하지 않는 보안/차단 로직
- 인코딩이 깨진 문자열이 포함된 UI 문구

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

### 6.2 신규 포인트/광고/AI 모델 데이터 모델

필수 신규 엔터티:

- `ai_models`
  - `id`
  - `label`
  - `provider`
  - `model_name`
  - `point_cost_create`
  - `point_cost_edit`
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
  - 사용자 업로드, AI 생성, KKE-OH 로고 기반 기본 플레이스홀더 중 하나를 참조
- `user_point_ledger`
  - 포인트 지급/차감의 최종 진실 원장
- `ai_models`
  - 모델 선택 UI와 비용 계산의 기준

### 6.4 Supabase 스키마 기준

유지 대상 핵심 테이블:

- `games`
- `game_reports`
- `game_feedback`
- `app_users`
- `app_sessions`
- `game_leaderboard_entries`

신규 추가 대상 테이블:

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
- 게시/초안 전환/숨김/복구/삭제

### 7.2 인증 저장소

인증 저장소는 Supabase 기반으로 단일화한다.

필요 기능:

- 로그인 ID 조회
- 회원 생성
- 세션 생성
- 세션 토큰으로 사용자 조회
- 세션 삭제

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
  - 공개 게임 목록
  - 검색
  - 챔피언 영역
  - 광고 슬롯
- `/login`
  - 로그인 / 회원가입
- `/submit`
  - AI 생성
  - HTML 업로드
  - ZIP 업로드
  - AI 모델 선택
  - 포인트 비용 안내
- `/game/[id]`
  - 게임 플레이
  - 리더보드
  - 좋아요/싫어요
  - 피드백
  - 신고
  - 리워드 광고 진입 UI
- `/my-games`
  - 내 게임 목록
- `/my-games/[id]/edit`
  - 게임 수정
  - AI 수정 진행상황 UI
  - AI 모델 선택
- `/points`
  - 포인트 잔액
  - 거래내역
  - 포인트 구매

### 8.2 관리자 페이지

- `/admin`
  - 전체 게임 관리 대시보드
  - 신고 alert 우선 검토 영역
  - 포인트/광고/AI 정책 점검 확장 기반

## 9. API 구조 기준

### 9.1 인증/설정

| 경로 | 메서드 | 역할 |
| --- | --- | --- |
| `/api/auth/login` | `POST` | 로그인 및 세션 쿠키 발급 |
| `/api/auth/signup` | `POST` | 회원가입 및 세션 쿠키 발급 |
| `/api/auth/logout` | `POST` | 로그아웃 및 세션 쿠키 제거 |
| `/api/locale` | `POST` | 언어 쿠키 저장 |

### 9.2 업로드/생성/수정

| 경로 | 메서드 | 역할 |
| --- | --- | --- |
| `/api/upload/title-check` | `GET` | slug 사용 가능 여부 확인 |
| `/api/upload/zip-inspect` | `POST` | ZIP 검사 및 임시 세션 저장 |
| `/api/upload/paste` | `POST` | HTML 파일 업로드 저장 |
| `/api/upload/confirm` | `POST` | ZIP 검사 결과 확정 저장 |
| `/api/upload/generate-v2` | `POST` | 표준 AI 생성 API |
| `/api/my-games/[id]/edit` | `POST` | 게임 수정 API |
| `/api/ai/models` | `GET` | AI 모델 목록/비용 조회 |

원칙:

- AI 생성 API는 하나만 유지한다.
- HTML 업로드는 파일 업로드만 받는다.
- 수동 업로드의 설명은 선택 입력으로 처리한다.
- 수동 업로드와 수정 흐름 모두 `leaderboard_enabled`를 명시적으로 다룬다.
- AI 생성/수정 요청은 `modelId`를 받아 포인트 선차감 검증을 수행한다.

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

### 10.1 AI 생성 흐름

1. 로그인 확인
2. AI 모델 목록 및 비용 조회
3. 모델 선택과 포인트 잔액 확인
4. 부족 시 차단 또는 포인트 구매 유도
5. 프롬프트/선택 필드 검증
6. OpenAI Responses API 호출
7. HTML에 KKE-OH 리더보드 브리지 삽입
8. 썸네일 SVG 정규화
9. 포인트 차감 원장 기록
10. 초안 저장
11. 리더보드 활성화
12. 진행상황 UI와 완료 상태 노출

### 10.2 AI 수정 흐름

1. 로그인 확인
2. 수정 대상 소유권 확인
3. AI 모델 목록 및 비용 조회
4. 모델 선택과 포인트 잔액 확인
5. 부족 시 차단 또는 포인트 구매 유도
6. 현재 게임 정보/HTML 일부를 문맥으로 구성
7. OpenAI 호출
8. 포인트 차감 원장 기록
9. 수정 결과 저장
10. AI 생성과 동일한 수준의 진행상황 UI 표시

### 10.3 공개 게임 플레이와 리워드 광고 흐름

1. 공개 게임 플레이 시작
2. 플레이 수 증가 시도 및 포인트 적립 조건 판단
3. 게임 종료/클리어 후 리워드 광고 진입 UI 노출
4. 사용자가 opt-in 시 광고 세션 요청
5. 지원 환경이면 Google rewarded flow 실행
6. 보상 승인 이벤트 수신 시 포인트 적립
7. 실패/미지원 시 대체 안내 표시

### 10.4 포인트 구매 흐름

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

### 11.3 기본 썸네일 처리

- 기본 플레이스홀더는 KKE-OH 로고 기반으로 생성
- 사용자 지정 썸네일이 있으면 우선 사용
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

- slug 정규화/중복 확인
- ZIP 검사
- 리더보드 점수 추출 및 브리지
- 신고 정책 변경
  - 자동 숨김 제거
  - 관리자 alert 분기
- 수동 업로드 리더보드 on/off
- AI 생성/수정 모델 선택 및 포인트 차감
- AI 생성/수정 진행상황 UI
- 포인트 잔액/원장/구매 흐름
- 리워드 광고 grant 후 포인트 적립
- 인코딩 복구 후 한국어 UI 회귀 확인
- 플레이 수 집계의 IP 해시 전달
- 광고 슬롯이 게임 조작 UI를 가리지 않는지 확인

## 14. 현재 코드와의 주요 갭

현재 코드와 목표 정의서 사이의 큰 차이는 다음과 같다.

- filesystem 이중 드라이버가 아직 남아 있음
- 신고 2회 시 자동 숨김 로직이 남아 있음
- 게임 상세 페이지에 신고 UI가 없음
- 수동 업로드는 설명 필수/리더보드 비활성 중심으로 구현돼 있음
- 수정 화면에 `details` 탭이 별도로 있음
- AI 수정은 진행상황 UI가 없음
- AI 모델 선택 UI가 없고 모델이 환경변수 하나로 고정됨
- 포인트 시스템, 구매 시스템, 광고 시스템이 없음
- 한국어 문자열 일부가 깨져 있음
- AI 생성 구현과 API가 중복돼 있음
- 플레이 수 증가 시 IP 해시가 실제로 전달되지 않음
- 반응 상태가 새로고침 후 버튼 상태로 복원되지 않음
- 생성 성공 상태 UI가 즉시 라우팅 때문에 사실상 보이지 않음

이 갭을 메우는 작업 목록은 별도 문서에서 관리한다.
