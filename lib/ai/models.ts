import { createServiceClient } from '@/lib/db/supabase';

export type AiModelCatalogItem = {
  id: string;
  label: string;
  provider: string;
  modelName: string;
  pointCostCreate: number;
  pointCostEdit: number;
  active: boolean;
  sortOrder: number;
};

const DEFAULT_AI_MODELS: AiModelCatalogItem[] = [
  {
    id: 'gpt-4.1-mini',
    label: 'Fast',
    provider: 'openai',
    modelName: 'gpt-4.1-mini',
    pointCostCreate: 12,
    pointCostEdit: 8,
    active: true,
    sortOrder: 1
  },
  {
    id: 'gpt-4.1',
    label: 'Balanced',
    provider: 'openai',
    modelName: 'gpt-4.1',
    pointCostCreate: 24,
    pointCostEdit: 16,
    active: true,
    sortOrder: 2
  },
  {
    id: 'gpt-5-mini',
    label: 'Polished',
    provider: 'openai',
    modelName: 'gpt-5-mini',
    pointCostCreate: 36,
    pointCostEdit: 24,
    active: true,
    sortOrder: 3
  }
];

function isMissingTableError(error: unknown, tableName: string) {
  return error instanceof Error && error.message.includes(tableName);
}

export async function listAiModels(): Promise<AiModelCatalogItem[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('ai_models')
      .select('id,label,provider,model_name,point_cost_create,point_cost_edit,active,sort_order')
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
      active: item.active,
      sortOrder: item.sort_order
    }));
  } catch (error) {
    if (isMissingTableError(error, 'ai_models')) {
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
