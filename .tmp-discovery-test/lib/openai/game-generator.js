import { createPlaceholderThumbnail } from '@/lib/games/placeholder';
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = process.env.OPENAI_GAME_MODEL?.trim() || 'gpt-4.1-mini';
function extractTextOutput(payload) {
    if (!payload || typeof payload !== 'object') {
        return null;
    }
    const data = payload;
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
function normalizeSvg(svg, title) {
    const trimmed = svg.trim();
    if (trimmed.startsWith('<svg')) {
        return trimmed;
    }
    return createPlaceholderThumbnail(title).content.toString('utf8');
}
export async function generateGameFromPrompt(prompt) {
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
    const payload = (await response.json().catch(() => null));
    if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'error' in payload && payload.error && typeof payload.error === 'object' && 'message' in payload.error
            ? String(payload.error.message)
            : 'OpenAI request failed.';
        throw new Error(message);
    }
    const rawText = extractTextOutput(payload);
    if (!rawText) {
        throw new Error('OpenAI response did not include generated content.');
    }
    let generated;
    try {
        generated = JSON.parse(rawText);
    }
    catch {
        throw new Error('OpenAI returned invalid JSON.');
    }
    if (!generated.title?.trim() || !generated.description?.trim() || !generated.html?.trim()) {
        throw new Error('OpenAI returned an incomplete game.');
    }
    return {
        title: generated.title.trim(),
        description: generated.description.trim(),
        html: generated.html.trim(),
        thumbnail: {
            path: 'thumbnail.svg',
            content: Buffer.from(normalizeSvg(generated.thumbnailSvg, generated.title), 'utf8'),
            contentType: 'image/svg+xml'
        }
    };
}
