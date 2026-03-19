import { createServiceClient } from '@/lib/db/supabase';

export type AiModelCatalogItem = {
  id: string;
  label: string;
  provider: string;
  modelName: string;
  pointCostCreate: number;
  pointCostEdit: number;
  kidDescription: string;
  active: boolean;
  sortOrder: number;
};

const DEFAULT_AI_MODELS: AiModelCatalogItem[] = [
  {
    id: 'gpt-4o-mini',
    label: 'Fast',
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    pointCostCreate: 12,
    pointCostEdit: 8,
    kidDescription: 'Quick and light. Good for simple game ideas and small fixes.',
    active: true,
    sortOrder: 1
  },
  {
    id: 'gpt-5-mini',
    label: 'Balanced',
    provider: 'openai',
    modelName: 'gpt-5-mini',
    pointCostCreate: 24,
    pointCostEdit: 16,
    kidDescription: 'A stronger all-around choice for better rules, screens, and polish.',
    active: true,
    sortOrder: 2
  },
  {
    id: 'gpt-5.4-mini',
    label: 'Polished',
    provider: 'openai',
    modelName: 'gpt-5.4-mini',
    pointCostCreate: 36,
    pointCostEdit: 24,
    kidDescription: 'Best for bigger ideas that need more detail, style, and careful clean-up.',
    active: true,
    sortOrder: 3
  }
];

function isMissingTableError(error: unknown, tableName: string) {
  return error instanceof Error && error.message.includes(tableName);
}

function getFallbackDescription(modelId: string, modelName: string) {
  const defaultModel = DEFAULT_AI_MODELS.find((item) => item.id === modelId || item.modelName === modelName);
  return defaultModel?.kidDescription ?? 'Builds a browser game from your idea and point budget.';
}

export async function listAiModels(): Promise<AiModelCatalogItem[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('ai_models')
      .select('id,label,provider,model_name,point_cost_create,point_cost_edit,kid_description,active,sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.length) {
      return DEFAULT_AI_MODELS;
    }

    return data.map((item) => ({
      id: item.id,
      label: item.label,
      provider: item.provider,
      modelName: item.model_name,
      pointCostCreate: item.point_cost_create,
      pointCostEdit: item.point_cost_edit,
      kidDescription:
        typeof item.kid_description === 'string' && item.kid_description.trim()
          ? item.kid_description
          : getFallbackDescription(item.id, item.model_name),
      active: item.active,
      sortOrder: item.sort_order
    }));
  } catch (error) {
    if (isMissingTableError(error, 'ai_models') || isMissingTableError(error, 'kid_description')) {
      return DEFAULT_AI_MODELS;
    }

    throw error;
  }
}

export async function getAiModelById(modelId: string): Promise<AiModelCatalogItem> {
  const models = await listAiModels();
  const model =
    models.find((item) => item.id === modelId && item.active) ??
    models[0] ??
    DEFAULT_AI_MODELS[0];

  if (!model) {
    throw new Error('No AI models are available right now.');
  }

  return model;
}

export function getAiPointCost(model: AiModelCatalogItem, mode: 'create' | 'edit') {
  return mode === 'create' ? model.pointCostCreate : model.pointCostEdit;
}

