type CategoryChipProps = {
  label: string;
  href: string;
  active?: boolean;
};

export function CategoryChip({ label, href, active = false }: CategoryChipProps) {
  return (
    <a
      href={href}
      className={`category-chip${active ? ' category-chip-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </a>
  );
}
