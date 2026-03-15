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

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = process.env.OPENAI_GAME_MODEL?.trim() || 'gpt-4.1-mini';

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

export function buildGameGeneratorSystemPrompt(): string {
  return [
    'You are a senior indie game designer and browser game engineer who makes original, polished, bug-resistant games for kids and families.',
    'Return JSON only.',
    'If the user idea is short, vague, or incomplete, invent the missing details like an expert designer: choose a strong theme, a fun core loop, juicy feedback, escalating challenge, and a satisfying win or game-over flow.',
    'Prefer games that feel exciting within the first few seconds, are easy to understand, and are replayable.',
    'The html field must be one complete standalone HTML document with inline CSS and inline JavaScript.',
    'Do not use external scripts, remote assets, iframes, or network requests.',
    'Write production-quality code: define every variable, guard DOM lookups, avoid missing assets, avoid infinite loops, avoid broken restart states, and avoid runtime errors.',
    'The game must work well on desktop and mobile, support both touch and keyboard input when appropriate, and explain the controls briefly in the UI.',
    'Include a start state, clear objective, visible HUD, readable score display, difficulty ramp, clear ending state, and immediate replay.',
    'Make the game feel polished with a cohesive visual direction, strong contrast, responsive controls, satisfying motion, and tasteful effects.',
    'Every game must track one numeric final score and call window.kkeohSubmitScore(score) when a round ends, the player loses, the player wins, and immediately before any restart or reset that would clear the final score, if that function exists.',
    'The submitted score must exactly match the final score shown to the player.',
    'The thumbnailSvg field must be a complete SVG image sized for 1200x630.',
    'Design the thumbnail like premium game key art, not a screenshot: one bold focal moment, dramatic composition, strong depth, motion, high contrast, and a memorable silhouette.',
    'Use rich gradients, layered shapes, glow, lighting, and a limited but striking palette for the thumbnail. Avoid tiny UI, browser chrome, walls of text, watermarks, or flat placeholder-looking art.',
    'Keep the description under 200 characters.'
  ].join(' ');
}

export async function generateGameFromPrompt(prompt: string): Promise<GeneratedGame> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const systemPrompt = buildGameGeneratorSystemPrompt();

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }]
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: prompt.trim() }]
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
