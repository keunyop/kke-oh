'use client';

import type { Locale } from '@/lib/i18n';

type AiModelOption = {
  id: string;
  label: string;
  modelName: string;
  kidDescription?: string;
};

type Props = {
  locale: Locale;
  modelId: string;
  models: AiModelOption[];
  pointBalance: number;
  pointCost: number;
  pending?: boolean;
  isLoading?: boolean;
  isShortage?: boolean;
  onChange: (value: string) => void;
  shortageCopy?: string;
};

function tx(locale: Locale, ko: string, en: string) {
  return locale === 'ko' ? ko : en;
}

export function AiModelCompactPanel({
  locale,
  modelId,
  models,
  pointBalance,
  pointCost,
  pending = false,
  isLoading = false,
  isShortage = false,
  onChange,
  shortageCopy
}: Props) {
  const activeModel = models.find((model) => model.id === modelId) ?? models[0] ?? null;

  return (
    <section className="status-card ai-compact-card">
      <div className="ai-compact-model">
        <label className="field-label">
          <span>{tx(locale, 'AI 모델', 'AI model')}</span>
          <select value={modelId} onChange={(event) => onChange(event.target.value)} disabled={pending || isLoading}>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label} · {model.modelName}
              </option>
            ))}
          </select>
        </label>
        <p className="small-copy ai-compact-description">
          {isLoading
            ? tx(locale, 'AI 모델을 불러오는 중이에요.', 'Loading AI models...')
            : activeModel?.kidDescription ?? tx(locale, '모델 설명을 불러오는 중이에요.', 'Loading model description...')}
        </p>
      </div>

      <div className="ai-compact-stats">
        <div className="ai-compact-stat">
          <span className="small-copy">{tx(locale, '잔여 포인트', 'Points left')}</span>
          <strong>{pointBalance}</strong>
        </div>
        <div className="ai-compact-stat">
          <span className="small-copy">{tx(locale, '예상 차감', 'Expected cost')}</span>
          <strong>{pointCost}</strong>
        </div>
      </div>

      {isShortage ? <p className="small-copy ai-compact-warning">{shortageCopy ?? ''}</p> : null}
    </section>
  );
}
