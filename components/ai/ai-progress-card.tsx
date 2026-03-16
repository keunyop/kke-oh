'use client';

type Props = {
  title: string;
  detail: string[];
  step: number;
  dots: number;
};

export function AiProgressCard({ title, detail, step, dots }: Props) {
  return (
    <div className="status-card submit-progress-card" role="status" aria-live="polite">
      <p className="status-title">
        {title}
        <span className="submit-progress-dots" aria-hidden="true">
          {'.'.repeat(dots)}
        </span>
      </p>
      <p className="small-copy">
        {detail[Math.min(step, detail.length - 1)]}
        <span className="submit-progress-dots" aria-hidden="true">
          {'.'.repeat(dots)}
        </span>
      </p>
      <div className="submit-progress-steps" aria-hidden="true">
        {detail.map((label, index) => (
          <span
            key={label}
            className={`submit-progress-step${
              index < step ? ' is-complete' : index === step ? ' is-active' : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
}
