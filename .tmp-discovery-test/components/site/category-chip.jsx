export function CategoryChip({ label, href, active = false }) {
    return (<a href={href} className={`category-chip${active ? ' category-chip-active' : ''}`} aria-current={active ? 'page' : undefined}>
      {label}
    </a>);
}
