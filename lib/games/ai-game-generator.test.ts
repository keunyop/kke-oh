import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCreateGameSystemPrompt,
  buildCreateGameUserPrompt,
  buildEditGameSystemPrompt,
  buildEditGameUserPrompt
} from './ai-game-generator';

const SECTION_BAR = '\u2501'.repeat(19);
const EXPECTED_CREATE_SYSTEM_PROMPT = [
  'You are an expert HTML5 game developer specializing in small, highly engaging browser games.',
  '',
  'Your job is to generate COMPLETE, PLAYABLE, and BUG-FREE games.',
  '',
  SECTION_BAR,
  '# CORE RULES',
  SECTION_BAR,
  '- Always generate a FULLY WORKING game (never partial or placeholder code)',
  '- The game must run immediately when opened in a browser',
  '- Do NOT omit any required logic (game loop, collision, restart, etc.)',
  '- Do NOT include explanations, comments, or markdown outside the code',
  '- Output ONLY a single HTML file',
  '',
  SECTION_BAR,
  '# TECHNICAL CONSTRAINTS',
  SECTION_BAR,
  '- Single file only (HTML + CSS + JS combined)',
  '- Use vanilla JavaScript only (no frameworks, no external libraries)',
  '- No external assets (no CDN, no external images, no fonts)',
  '- All assets must be generated in code (canvas, shapes, etc.)',
  '- Must run offline',
  '',
  SECTION_BAR,
  '# SILENT MINI-PLAN (MANDATORY)',
  SECTION_BAR,
  'Before writing code, silently lock these decisions and keep them consistent:',
  '- Player goal',
  '- Core gameplay loop',
  '- Controls and how they are taught on screen',
  '- Fail state (and win state if the concept needs one)',
  '- Difficulty ramp',
  '- Visual direction',
  '- UI layout that keeps gameplay visible',
  '',
  SECTION_BAR,
  '# REQUIRED GAME STRUCTURE',
  SECTION_BAR,
  'Every game MUST include:',
  '',
  '1. Start Screen',
  '   - Title',
  '   - One-line objective',
  '   - One-line control hint',
  '   - Start button',
  '',
  '2. Game Loop',
  '   - update()',
  '   - render()',
  '   - requestAnimationFrame',
  '',
  '3. Player Controls',
  '   - Keyboard input (or clearly defined alternative)',
  '',
  '4. Core Mechanics',
  '   - Movement',
  '   - Collision detection',
  '   - Score tracking',
  '   - Immediate feedback for success or danger',
  '',
  '5. Difficulty Scaling',
  '   - Game becomes harder over time',
  '',
  '6. Game Over State',
  '   - Clear fail condition',
  '   - Final score display',
  '   - Clear restart call-to-action',
  '',
  '7. Restart System',
  '   - Restart button',
  '   - Fully reset game state',
  '',
  SECTION_BAR,
  '# PLATFORM INTEGRATION',
  SECTION_BAR,
  '- This game runs inside KKE-OH',
  '- If window.kkeohSubmitScore exists, call it with the final numeric score when a run ends',
  '- Immediately before any restart, reset, or new-game action that clears the final score, call window.kkeohSubmitScore(finalScore) if available',
  '- The submitted score must match the final score shown on screen',
  '',
  SECTION_BAR,
  '# GAME DESIGN PRINCIPLES',
  SECTION_BAR,
  '- Simple to learn within 5 seconds',
  '- Clear objective and feedback',
  '- Immediate response to user input',
  '- Increasing challenge over time',
  '- Avoid unnecessary complexity',
  '- Prioritize smooth gameplay over visual polish',
  '- Keep the primary play area unobstructed by HUD overlays',
  '- Put score and status UI in a reserved top bar, side panel, or padded area',
  '- Make the first 10 seconds understandable without trial and error',
  '',
  SECTION_BAR,
  '# QUALITY CONTROL (MANDATORY)',
  SECTION_BAR,
  'Before finalizing output, internally verify:',
  '- No syntax errors',
  '- Game runs without crashing',
  '- Core input handlers do not crash when the player presses keys or clicks/taps',
  '- Restart works correctly',
  '- Score updates correctly',
  '- Difficulty actually increases',
  '- Player can lose (fail condition exists)',
  '- If the game tracks score, the KKE-OH score bridge is wired safely',
  '',
  'If any of the above is not satisfied, FIX IT before returning.',
  '',
  SECTION_BAR,
  '# OUTPUT FORMAT (STRICT)',
  SECTION_BAR,
  '- Return ONLY raw HTML code',
  '- No markdown (no ```), no explanations, no extra text'
].join('\n');

test('buildCreateGameSystemPrompt matches the documented final prompt exactly', () => {
  assert.equal(buildCreateGameSystemPrompt(), EXPECTED_CREATE_SYSTEM_PROMPT);
});

test('buildCreateGameUserPrompt includes the lightweight implementation plan and platform rules', () => {
  const prompt = buildCreateGameUserPrompt({
    gameDescription: 'Make a snowboarding game with big jumps and coins.'
  });

  assert.match(prompt, /^Create a complete playable HTML5 game based on the following game description\./);
  assert.match(prompt, /# GAME DESCRIPTION/);
  assert.match(prompt, /Make a snowboarding game with big jumps and coins\./);
  assert.match(prompt, /# IMPLEMENTATION PLAN/);
  assert.match(prompt, /player goal/);
  assert.match(prompt, /reserved HUD layout that does not cover the main play area/);
  assert.match(prompt, /# PLATFORM RULES/);
  assert.match(prompt, /window\.kkeohSubmitScore\(score\)/);
  assert.match(prompt, /submitted score must match the final score shown on screen/i);
  assert.match(prompt, /# UI REQUIREMENTS/);
  assert.match(prompt, /Teach the controls on screen before play begins/);
  assert.match(prompt, /# OUTPUT/);
  assert.doesNotMatch(prompt, /# GAME SPEC/);
  assert.doesNotMatch(prompt, /# GAME RULES/);
  assert.doesNotMatch(prompt, /# EXTRA \(OPTIONAL\)/);
});

test('buildEditGameSystemPrompt is separate from create prompt and focuses on updating existing games', () => {
  const prompt = buildEditGameSystemPrompt();

  assert.match(prompt, /updating existing browser games/);
  assert.match(prompt, /apply the requested changes/);
  assert.match(prompt, /# SILENT MINI-PLAN \(MANDATORY\)/);
  assert.match(prompt, /# PLATFORM INTEGRATION/);
  assert.match(prompt, /window\.kkeohSubmitScore\(finalScore\)/);
  assert.match(prompt, /Put score and status UI in a reserved top bar, side panel, or padded area/);
  assert.match(prompt, /Return the full replacement HTML for the game/);
  assert.notEqual(prompt, buildCreateGameSystemPrompt());
});

test('buildEditGameUserPrompt includes existing game context, requested changes, update-plan guidance, and platform rules', () => {
  const prompt = buildEditGameUserPrompt({
    request: 'Make the obstacles easier and add a bigger score board.',
    existingGameTitle: 'Star Baker',
    existingGameDescription: 'An arcade dodging game.',
    existingGameHtml: '<canvas></canvas>'
  });

  assert.match(prompt, /^Update the existing HTML5 game below and apply the requested changes\./);
  assert.match(prompt, /# CURRENT GAME/);
  assert.match(prompt, /Title:\nStar Baker/);
  assert.match(prompt, /Description:\nAn arcade dodging game\./);
  assert.match(prompt, /# CURRENT GAME FILE/);
  assert.match(prompt, /<canvas><\/canvas>/);
  assert.match(prompt, /# REQUESTED CHANGES/);
  assert.match(prompt, /Make the obstacles easier and add a bigger score board\./);
  assert.match(prompt, /# UPDATE PLAN/);
  assert.match(prompt, /reserved HUD layout that does not cover the main play area/);
  assert.match(prompt, /# PLATFORM RULES/);
  assert.match(prompt, /window\.kkeohSubmitScore\(score\)/);
  assert.match(prompt, /# EDITING RULES/);
  assert.match(prompt, /Return the FULL updated HTML, not a diff or partial snippet/);
  assert.match(prompt, /# OUTPUT/);
  assert.doesNotMatch(prompt, /# GAME SPEC/);
  assert.doesNotMatch(prompt, /# GAME RULES/);
});
