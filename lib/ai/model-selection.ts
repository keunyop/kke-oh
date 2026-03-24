export const PREFERRED_AI_MODEL_ID = 'gpt-5-mini';

export function getDefaultAiModelId<T extends { id: string }>(models: readonly T[]) {
  if (!models.length) {
    return '';
  }

  return models.find((model) => model.id === PREFERRED_AI_MODEL_ID)?.id ?? models[0]?.id ?? '';
}

export function getDefaultAiModel<T extends { id: string }>(models: readonly T[]) {
  const modelId = getDefaultAiModelId(models);
  return models.find((model) => model.id === modelId) ?? models[0] ?? null;
}
