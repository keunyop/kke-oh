'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  className?: string;
  summary: ReactNode;
  children: ReactNode;
};

export function ClosableDetails({ className, summary, children }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeIfOutside(event: MouseEvent | TouchEvent) {
      const details = ref.current;
      if (!details?.open) return;
      if (event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && ref.current?.open) {
        ref.current.open = false;
      }
    }

    document.addEventListener('mousedown', closeIfOutside);
    document.addEventListener('touchstart', closeIfOutside);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeIfOutside);
      document.removeEventListener('touchstart', closeIfOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <details
      ref={ref}
      className={className}
      onClick={(event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest('summary')) return;
        if (target.closest('a, button')) {
          window.requestAnimationFrame(() => {
            if (ref.current) {
              ref.current.open = false;
            }
          });
        }
      }}
    >
      {summary}
      {children}
    </details>
  );
}