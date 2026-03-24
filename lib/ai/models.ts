import { createServiceClient } from '@/lib/db/supabase';
import { getDefaultAiModelId } from '@/lib/ai/model-selection';

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

type FriendlyAiModelCopy = {
  label: string;
  kidDescription: string;
};

const DEFAULT_AI_MODELS: AiModelCatalogItem[] = [
  {
    id: 'gpt-4o-mini',
    label: 'Quick Buddy',
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    pointCostCreate: 12,
    pointCostEdit: 8,
    kidDescription: 'Fast helper for small game ideas and tiny fixes.',
    active: true,
    sortOrder: 1
  },
  {
    id: 'gpt-5-mini',
    label: 'Smart Buddy',
    provider: 'openai',
    modelName: 'gpt-5-mini',
    pointCostCreate: 24,
    pointCostEdit: 16,
    kidDescription: 'A steady helper for most games, with stronger rules and clearer screens.',
    active: true,
    sortOrder: 2
  },
  {
    id: 'gpt-5.4-mini',
    label: 'Super Buddy',
    provider: 'openai',
    modelName: 'gpt-5.4-mini',
    pointCostCreate: 36,
    pointCostEdit: 24,
    kidDescription: 'Best for bigger ideas that need extra detail, polish, and careful cleanup.',
    active: true,
    sortOrder: 3
  }
];

function isMissingTableError(error: unknown, tableName: string) {
  return error instanceof Error && error.message.includes(tableName);
}

export function getFriendlyAiModelCopy(modelId: string, modelName?: string): FriendlyAiModelCopy {
  const defaultModel = DEFAULT_AI_MODELS.find((item) => item.id === modelId || item.modelName === modelName);

  return (
    defaultModel ?? {
      label: 'Game Buddy',
      kidDescription: 'Turns your idea into a browser game while using the points shown here.'
    }
  );
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

    return data.map((item) => {
      const friendlyCopy = getFriendlyAiModelCopy(item.id, item.model_name);
      const rawDescription = typeof item.kid_description === 'string' ? item.kid_description.trim() : '';

      return {
        id: item.id,
        label: friendlyCopy.label,
        provider: item.provider,
        modelName: item.model_name,
        pointCostCreate: item.point_cost_create,
        pointCostEdit: item.point_cost_edit,
        kidDescription: rawDescription && !/gpt/i.test(rawDescription) ? rawDescription : friendlyCopy.kidDescription,
        active: item.active,
        sortOrder: item.sort_order
      };
    });
  } catch (error) {
    if (isMissingTableError(error, 'ai_models') || isMissingTableError(error, 'kid_description')) {
      return DEFAULT_AI_MODELS;
    }

    throw error;
  }
}

export async function getAiModelById(modelId: string): Promise<AiModelCatalogItem> {
  const models = await listAiModels();
  const defaultModelId = getDefaultAiModelId(models);
  const model =
    models.find((item) => item.id === modelId && item.active) ??
    models.find((item) => item.id === defaultModelId) ??
    DEFAULT_AI_MODELS.find((item) => item.id === getDefaultAiModelId(DEFAULT_AI_MODELS)) ??
    DEFAULT_AI_MODELS[0];

  if (!model) {
    throw new Error('No AI models are available right now.');
  }

  return model;
}

export function getAiPointCost(model: AiModelCatalogItem, mode: 'create' | 'edit') {
  return mode === 'create' ? model.pointCostCreate : model.pointCostEdit;
}
