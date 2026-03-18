import { createPlaceholderThumbnail } from '@/lib/games/placeholder';
import { injectLeaderboardBridge } from '@/lib/games/score-bridge';
import type { UploadedFile } from '@/lib/games/upload';

type GeneratedGamePayload = {
  title: string;
  description: string;
  html: string;
  thumbnailSvg: string;
};

type GeneratedGame = {
  title: string;
  description: string;
  html: string;
  thumbnail: UploadedFile;
};

export type GameGeneratorPromptInput = {
  request: string;
  genre?: string | null;
  theme?: string | null;
  coreMechanic?: string | null;
  objective?: string | null;
  playerActions?: string | null;
  difficulty?: string | null;
  sessionLength?: string | null;
  winCondition?: string | null;
  loseCondition?: string | null;
  difficultyScaling?: string | null;
  extraFeatures?: string | null;
  existingGameTitle?: string | null;
  existingGameDescription?: string | null;
  existingGameHtml?: string | null;
};

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = process.env.OPENAI_GAME_MODEL?.trim() || 'gpt-4.1-mini';
const SECTION_BAR = '\u2501'.repeat(19);

const GAME_GENERATOR_SYSTEM_PROMPT = [
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

function extractTextOutput(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }

  for (const output of data.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === 'string' && content.text.trim()) {
        return content.text;
      }
    }
  }

  return null;
}

function normalizeSvg(svg: string, title: string) {
  const trimmed = svg.trim();
  if (trimmed.startsWith('<svg')) {
    return trimmed;
  }

  return createPlaceholderThumbnail(title).content.toString('utf8');
}

function normalizePromptValue(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildFallbackValue(request: string, fallback: string) {
  return request ? `${fallback} Base it on this request: ${request}` : fallback;
}

function buildExtraFeaturesValue(input: GameGeneratorPromptInput) {
  const sections: string[] = [];
  const extraFeatures = normalizePromptValue(input.extraFeatures);

  if (extraFeatures) {
    sections.push(extraFeatures);
  }

  sections.push(
    input.request
      ? `Original request:\n${input.request}`
      : 'No extra features were explicitly provided. If needed, infer sensible details that fit the game concept.'
  );

  const title = normalizePromptValue(input.existingGameTitle);
  const description = normalizePromptValue(input.existingGameDescription);
  const html = normalizePromptValue(input.existingGameHtml);
  const editContext = [
    title ? `Current game title: ${title}` : null,
    description ? `Current game description: ${description}` : null,
    html ? `Current game HTML excerpt:\n${html}` : null
  ]
    .filter(Boolean)
    .join('\n\n');

  if (editContext) {
    sections.push(`Edit context:\n${editContext}`);
  }

  return sections.join('\n\n');
}

export function buildGameGeneratorSystemPrompt(): string {
  return GAME_GENERATOR_SYSTEM_PROMPT;
}

export function buildGameGeneratorUserPrompt(input: string | GameGeneratorPromptInput): string {
  const options: GameGeneratorPromptInput = typeof input === 'string' ? { request: input } : input;
  const request = normalizePromptValue(options.request) ?? '';
  const genre = normalizePromptValue(options.genre) ?? buildFallbackValue(request, 'Not specified. Infer the most suitable genre.');
  const theme = normalizePromptValue(options.theme) ?? buildFallbackValue(request, 'Not specified. Infer the most suitable theme.');
  const coreMechanic =
    normalizePromptValue(options.coreMechanic) ?? buildFallbackValue(request, 'Not specified. Infer the core mechanic from the request.');
  const objective =
    normalizePromptValue(options.objective) ?? buildFallbackValue(request, 'Not specified. Define a clear objective that fits the requested idea.');
  const playerActions =
    normalizePromptValue(options.playerActions) ?? buildFallbackValue(request, 'Not specified. Infer clear player actions and controls.');
  const difficulty =
    normalizePromptValue(options.difficulty) ?? buildFallbackValue(request, 'Not specified. Choose a suitable difficulty for a short browser game.');
  const sessionLength =
    normalizePromptValue(options.sessionLength) ?? buildFallbackValue(request, 'Not specified. Target a short, replayable browser session.');
  const winCondition =
    normalizePromptValue(options.winCondition) ?? buildFallbackValue(request, 'Not specified. Define a clear win condition.');
  const loseCondition =
    normalizePromptValue(options.loseCondition) ?? buildFallbackValue(request, 'Not specified. Define a clear lose condition.');
  const difficultyScaling =
    normalizePromptValue(options.difficultyScaling) ??
    buildFallbackValue(request, 'Not specified. Define how the challenge should increase over time.');
  const extraFeatures = buildExtraFeaturesValue(options);

  return [
    'Create a complete playable HTML5 game based on the following specifications.',
    '',
    SECTION_BAR,
    '# GAME SPEC',
    SECTION_BAR,
    `Genre: ${genre}`,
    `Theme: ${theme}`,
    '',
    'Core Mechanic:',
    coreMechanic,
    '',
    'Objective:',
    objective,
    '',
    'Player Actions:',
    playerActions,
    '',
    'Difficulty Level:',
    difficulty,
    '',
    'Session Length:',
    sessionLength,
    '',
    SECTION_BAR,
    '# GAME RULES',
    SECTION_BAR,
    'Win Condition:',
    winCondition,
    '',
    'Lose Condition:',
    loseCondition,
    '',
    'Difficulty Scaling:',
    difficultyScaling,
    '',
    SECTION_BAR,
    '# UI REQUIREMENTS',
    SECTION_BAR,
    '- Show score on screen',
    '- Display clear start screen',
    '- Display game over screen',
    '- Include restart button',
    '',
    SECTION_BAR,
    '# EXTRA (OPTIONAL)',
    SECTION_BAR,
    extraFeatures,
    '',
    SECTION_BAR,
    '# OUTPUT',
    SECTION_BAR,
    'Return ONLY a single HTML file.'
  ].join('\n');
}

export async function generateGameFromPrompt(prompt: string | GameGeneratorPromptInput, modelName?: string): Promise<GeneratedGame> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const systemPrompt = buildGameGeneratorSystemPrompt();
  const userPrompt = buildGameGeneratorUserPrompt(prompt);

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName?.trim() || OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }]
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'generated_game',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string', minLength: 2, maxLength: 60 },
              description: { type: 'string', minLength: 10, maxLength: 200 },
              html: { type: 'string', minLength: 200 },
              thumbnailSvg: { type: 'string', minLength: 50 }
            },
            required: ['title', 'description', 'html', 'thumbnailSvg']
          }
        }
      }
    })
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error && typeof payload.error === 'object' && 'message' in payload.error
        ? String(payload.error.message)
        : 'OpenAI request failed.';
    throw new Error(message);
  }

  const rawText = extractTextOutput(payload);
  if (!rawText) {
    throw new Error('OpenAI response did not include generated content.');
  }

  let generated: GeneratedGamePayload;
  try {
    generated = JSON.parse(rawText) as GeneratedGamePayload;
  } catch {
    throw new Error('OpenAI returned invalid JSON.');
  }

  if (!generated.title?.trim() || !generated.description?.trim() || !generated.html?.trim()) {
    throw new Error('OpenAI returned an incomplete game.');
  }

  return {
    title: generated.title.trim(),
    description: generated.description.trim(),
    html: injectLeaderboardBridge(generated.html.trim()),
    thumbnail: {
      path: 'thumbnail.svg',
      content: Buffer.from(normalizeSvg(generated.thumbnailSvg, generated.title), 'utf8'),
      contentType: 'image/svg+xml'
    }
  };
}