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
  '# REQUIRED GAME STRUCTURE',
  SECTION_BAR,
  'Every game MUST include:',
  '',
  '1. Start Screen',
  '   - Title',
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
  '',
  '5. Difficulty Scaling',
  '   - Game becomes harder over time',
  '',
  '6. Game Over State',
  '   - Clear fail condition',
  '   - Final score display',
  '',
  '7. Restart System',
  '   - Restart button',
  '   - Fully reset game state',
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
  '',
  SECTION_BAR,
  '# QUALITY CONTROL (MANDATORY)',
  SECTION_BAR,
  'Before finalizing output, internally verify:',
  '- No syntax errors',
  '- Game runs without crashing',
  '- Restart works correctly',
  '- Score updates correctly',
  '- Difficulty actually increases',
  '- Player can lose (fail condition exists)',
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

test('buildCreateGameUserPrompt uses game description instead of spec and rules sections', () => {
  const prompt = buildCreateGameUserPrompt({
    gameDescription: 'Make a snowboarding game with big jumps and coins.'
  });

  assert.match(prompt, /^Create a complete playable HTML5 game based on the following game description\./);
  assert.match(prompt, /# GAME DESCRIPTION/);
  assert.match(prompt, /Make a snowboarding game with big jumps and coins\./);
  assert.match(prompt, /# UI REQUIREMENTS/);
  assert.match(prompt, /# OUTPUT/);
  assert.doesNotMatch(prompt, /# GAME SPEC/);
  assert.doesNotMatch(prompt, /# GAME RULES/);
  assert.doesNotMatch(prompt, /# EXTRA \(OPTIONAL\)/);
  assert.doesNotMatch(prompt, /LEADERBOARD/);
  assert.doesNotMatch(prompt, /window\.kkeohSubmitScore/);
});

test('buildEditGameSystemPrompt is separate from create prompt and focuses on updating existing games', () => {
  const prompt = buildEditGameSystemPrompt();

  assert.match(prompt, /updating existing browser games/);
  assert.match(prompt, /apply the requested changes/);
  assert.match(prompt, /Return the full replacement HTML for the game/);
  assert.notEqual(prompt, buildCreateGameSystemPrompt());
});

test('buildEditGameUserPrompt includes existing game context and requested changes', () => {
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
  assert.match(prompt, /# EDITING RULES/);
  assert.match(prompt, /Return the FULL updated HTML, not a diff or partial snippet/);
  assert.match(prompt, /# OUTPUT/);
  assert.doesNotMatch(prompt, /# GAME SPEC/);
  assert.doesNotMatch(prompt, /# GAME RULES/);
});
