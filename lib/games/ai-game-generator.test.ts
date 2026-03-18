import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGameGeneratorSystemPrompt, buildGameGeneratorUserPrompt } from './ai-game-generator';

const SECTION_BAR = '\u2501'.repeat(19);
const EXPECTED_SYSTEM_PROMPT = [
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

test('buildGameGeneratorSystemPrompt matches the documented final prompt exactly', () => {
  assert.equal(buildGameGeneratorSystemPrompt(), EXPECTED_SYSTEM_PROMPT);
});

test('buildGameGeneratorUserPrompt keeps the documented structure without leaderboard copy', () => {
  const prompt = buildGameGeneratorUserPrompt('Make a snowboarding game with big jumps and coins.');

  assert.match(prompt, /^Create a complete playable HTML5 game based on the following specifications\./);
  assert.match(prompt, /# GAME SPEC/);
  assert.match(prompt, /# GAME RULES/);
  assert.match(prompt, /# UI REQUIREMENTS/);
  assert.match(prompt, /# EXTRA \(OPTIONAL\)/);
  assert.match(prompt, /# OUTPUT/);
  assert.match(prompt, /Original request:\nMake a snowboarding game with big jumps and coins\./);
  assert.doesNotMatch(prompt, /LEADERBOARD/);
  assert.doesNotMatch(prompt, /window\.kkeohSubmitScore/);
});

test('buildGameGeneratorUserPrompt preserves explicit values and appends edit context when provided', () => {
  const prompt = buildGameGeneratorUserPrompt({
    request: 'Make the obstacles easier and add a bigger score board.',
    genre: 'Arcade',
    theme: 'Space bakery',
    coreMechanic: 'Dodge meteors and collect bread stars.',
    objective: 'Survive as long as possible while scoring points.',
    playerActions: 'Move left and right with arrow keys.',
    difficulty: 'Easy to medium',
    sessionLength: '2 to 4 minutes',
    winCondition: 'Reach 5,000 points.',
    loseCondition: 'Crash into three meteors.',
    difficultyScaling: 'Spawn more meteors every 20 seconds.',
    extraFeatures: 'Add juicy hit flashes and a combo meter.',
    existingGameTitle: 'Star Baker',
    existingGameDescription: 'An arcade dodging game.',
    existingGameHtml: '<canvas></canvas>'
  });

  assert.match(prompt, /Genre: Arcade/);
  assert.match(prompt, /Theme: Space bakery/);
  assert.match(prompt, /Dodge meteors and collect bread stars\./);
  assert.match(prompt, /Add juicy hit flashes and a combo meter\./);
  assert.match(prompt, /Original request:\nMake the obstacles easier and add a bigger score board\./);
  assert.match(prompt, /Edit context:/);
  assert.match(prompt, /Current game title: Star Baker/);
  assert.match(prompt, /Current game description: An arcade dodging game\./);
  assert.match(prompt, /Current game HTML excerpt:\n<canvas><\/canvas>/);
});