const AI_PREFILL_PROMPT_LIMIT = 1200;

export function normalizeAiPrefillPrompt(prompt?: string | null) {
  if (!prompt) {
    return '';
  }

  return prompt.trim().slice(0, AI_PREFILL_PROMPT_LIMIT);
}

export function buildAiDraftLaunchPath({
  prompt,
  modelId
}: {
  prompt?: string | null;
  modelId?: string | null;
}) {
  const params = new URLSearchParams();
  const normalizedPrompt = normalizeAiPrefillPrompt(prompt);
  const normalizedModelId = modelId?.trim() ?? '';

  if (normalizedPrompt) {
    params.set('aiPrompt', normalizedPrompt);
  }

  if (normalizedModelId) {
    params.set('aiModel', normalizedModelId);
  }

  const query = params.toString();
  return query ? `/submit?${query}` : '/submit';
}
