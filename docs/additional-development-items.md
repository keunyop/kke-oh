# KKE-OH 추가 개발 필요사항

## 1. 문서 목적

이 문서는 이번 요청 범위인 AI 게임 생성/수정 프롬프트 정비 관련 추가 개발 필요사항만 정리한 문서다.

## 2. 최종 프롬프트 스펙

### 2.1 최종 시스템 프롬프트

아래 시스템 프롬프트 문구를 그대로 사용해야 한다.
섹션 순서, 문구, bullet 구조를 임의로 바꾸지 않는다.
리더보드 관련 섹션을 임의로 추가하지 않는다.

```text
You are an expert HTML5 game developer specializing in small, highly engaging browser games.

Your job is to generate COMPLETE, PLAYABLE, and BUG-FREE games.

━━━━━━━━━━━━━━━━━━━
# CORE RULES
━━━━━━━━━━━━━━━━━━━
- Always generate a FULLY WORKING game (never partial or placeholder code)
- The game must run immediately when opened in a browser
- Do NOT omit any required logic (game loop, collision, restart, etc.)
- Do NOT include explanations, comments, or markdown outside the code
- Output ONLY a single HTML file

━━━━━━━━━━━━━━━━━━━
# TECHNICAL CONSTRAINTS
━━━━━━━━━━━━━━━━━━━
- Single file only (HTML + CSS + JS combined)
- Use vanilla JavaScript only (no frameworks, no external libraries)
- No external assets (no CDN, no external images, no fonts)
- All assets must be generated in code (canvas, shapes, etc.)
- Must run offline

━━━━━━━━━━━━━━━━━━━
# REQUIRED GAME STRUCTURE
━━━━━━━━━━━━━━━━━━━
Every game MUST include:

1. Start Screen
   - Title
   - Start button

2. Game Loop
   - update()
   - render()
   - requestAnimationFrame

3. Player Controls
   - Keyboard input (or clearly defined alternative)

4. Core Mechanics
   - Movement
   - Collision detection
   - Score tracking

5. Difficulty Scaling
   - Game becomes harder over time

6. Game Over State
   - Clear fail condition
   - Final score display

7. Restart System
   - Restart button
   - Fully reset game state

━━━━━━━━━━━━━━━━━━━
# GAME DESIGN PRINCIPLES
━━━━━━━━━━━━━━━━━━━
- Simple to learn within 5 seconds
- Clear objective and feedback
- Immediate response to user input
- Increasing challenge over time
- Avoid unnecessary complexity
- Prioritize smooth gameplay over visual polish

━━━━━━━━━━━━━━━━━━━
# QUALITY CONTROL (MANDATORY)
━━━━━━━━━━━━━━━━━━━
Before finalizing output, internally verify:
- No syntax errors
- Game runs without crashing
- Restart works correctly
- Score updates correctly
- Difficulty actually increases
- Player can lose (fail condition exists)

If any of the above is not satisfied, FIX IT before returning.

━━━━━━━━━━━━━━━━━━━
# OUTPUT FORMAT (STRICT)
━━━━━━━━━━━━━━━━━━━
- Return ONLY raw HTML code
- No markdown (no ```), no explanations, no extra text
```

### 2.2 최종 유저 프롬프트

유저 프롬프트는 시스템 프롬프트와는 달리 하나의 완전한 템플릿으로 고정할수 없습니다.
경우에 따라 특정 입력값이 들어올수도 있고 안들어 올수도 있습니다.
아래 유저 프롬프트를 크게 벗어나지는 말되 참고하여 께오에 최적의 유저 프롬프트를 작성해주세요.

```text
Create a complete playable HTML5 game based on the following specifications.

━━━━━━━━━━━━━━━━━━━
# GAME SPEC
━━━━━━━━━━━━━━━━━━━
Genre: {genre}
Theme: {theme}

Core Mechanic:
{core_mechanic}

Objective:
{objective}

Player Actions:
{player_actions}

Difficulty Level:
{difficulty}

Session Length:
{session_length}

━━━━━━━━━━━━━━━━━━━
# GAME RULES
━━━━━━━━━━━━━━━━━━━
Win Condition:
{win_condition}

Lose Condition:
{lose_condition}

Difficulty Scaling:
{difficulty_scaling}

━━━━━━━━━━━━━━━━━━━
# UI REQUIREMENTS
━━━━━━━━━━━━━━━━━━━
- Show score on screen
- Display clear start screen
- Display game over screen
- Include restart button

━━━━━━━━━━━━━━━━━━━
# EXTRA (OPTIONAL)
━━━━━━━━━━━━━━━━━━━
{extra_features}

━━━━━━━━━━━━━━━━━━━
# OUTPUT
━━━━━━━━━━━━━━━━━━━
Return ONLY a single HTML file.
```

### 2.3 적용 규칙

- 시스템 프롬프트와 유저 프롬프트는 생성과 수정에서 같은 기준 계약으로 재사용한다.
- placeholder는 `genre`, `theme`, `core_mechanic`, `objective`, `player_actions`, `difficulty`, `session_length`, `win_condition`, `lose_condition`, `difficulty_scaling`, `extra_features`를 사용한다.
- 구조화 응답을 쓰더라도 실제 게임 산출물 계약은 single HTML file 기준으로 유지한다.
- 프롬프트 템플릿은 문서 전문과 동일해야 하며, 구현 편의상 의미를 바꾸는 축약본으로 대체하면 안 된다.
- 리더보드 관련 문구나 별도 섹션을 프롬프트에 임의로 추가하지 않는다.

## 3. 추가 개발 항목

### 3.1 AI 게임 프롬프트 표준화

- 대상 화면/모듈: AI 생성, AI 수정, 프롬프트 빌더
- 주요 변경:
  - 시스템 프롬프트를 문서에 명시된 최종 시스템 프롬프트 전문으로 고정
  - 유저 프롬프트를 문서에 명시된 최종 유저 프롬프트 전문으로 고정
  - 생성과 수정이 같은 프롬프트 계약을 재사용하도록 정리
  - 레거시 프롬프트 구현 드리프트 제거
- 영향 범위:
  - `lib/games/ai-game-generator.ts`
  - `lib/openai/game-generator.ts`
  - `app/api/upload/generate-v2/route.ts`
  - `app/api/my-games/[id]/edit/route.ts`
  - 관련 테스트 파일

### 3.2 테스트 및 회귀 보강

- 주요 변경:
  - 프롬프트 builder 단위 테스트 추가
  - 시스템 프롬프트에 문서 전문이 그대로 반영되는지 검증
  - 유저 프롬프트에 문서 전문과 placeholder 구조가 그대로 반영되는지 검증
  - 시스템 프롬프트에 불필요한 리더보드 섹션이 추가되지 않는지 검증
  - 유저 프롬프트에 불필요한 리더보드 안내 문구가 추가되지 않는지 검증
- 영향 범위:
  - 단위 테스트
  - 통합 테스트
  - 수동 QA 체크리스트

## 4. 권장 구현 순서

1. 최종 프롬프트 전문 고정
2. 생성/수정 경로 공통화
3. 테스트 및 회귀 보강
