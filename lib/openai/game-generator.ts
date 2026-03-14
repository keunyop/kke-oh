import { createPlaceholderThumbnail } from '@/lib/games/placeholder';
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

function injectLeaderboardBridge(html: string): string {
  const bridge = `<script>
(function () {
  if (typeof window === 'undefined' || window.kkeohSubmitScore) return;
  let lastSubmittedScore = null;
  let lastSubmittedAt = 0;
  window.kkeohSubmitScore = function (score) {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return false;
    const safeScore = Math.max(0, Math.round(numericScore));
    const now = Date.now();
    if (lastSubmittedScore === safeScore && now - lastSubmittedAt < 2000) {
      return false;
    }
    lastSubmittedScore = safeScore;
    lastSubmittedAt = now;
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'kkeoh:submit-score', score: safeScore }, window.location.origin);
        return true;
      }
    } catch {}
    return false;
  };
})();
</script>`;

  const hasBridgeDefinition = /window\.kkeohSubmitScore\s*=|function\s+kkeohSubmitScore\s*\(/.test(html);
  if (hasBridgeDefinition) {
    return html;
  }

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${bridge}\n</body>`);
  }

  return `${html}\n${bridge}`;
}

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

export async function generateGameFromPrompt(prompt: string): Promise<GeneratedGame> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const systemPrompt = [
    'You create safe, playful browser games for children.',
    'Return JSON only.',
    'The html field must be one complete standalone HTML document with inline CSS and inline JavaScript.',
    'Do not use external scripts, remote assets, or network requests.',
    'Keep controls simple, mobile friendly, and keyboard friendly.',
    'Every game must track a numeric score and call window.kkeohSubmitScore(score) when a round ends, the player loses, or the player wins, if that function exists.',
    'The thumbnailSvg field must be a complete SVG image sized for 1200x630.',
    'Keep the description under 200 characters.'
  ].join(' ');

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


