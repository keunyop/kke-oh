function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function truncate(value, maxLength) {
    if (value.length <= maxLength) {
        return value;
    }
    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}
function createPlaceholderSvg(title) {
    const safeTitle = escapeXml(truncate(title.trim() || 'KKE-OH!', 32));
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff4d8" />
      <stop offset="55%" stop-color="#ffd58a" />
      <stop offset="100%" stop-color="#ffad6f" />
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.88)" />
      <stop offset="100%" stop-color="rgba(255,245,230,0.72)" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#bg)" />
  <circle cx="970" cy="136" r="112" fill="rgba(255,255,255,0.24)" />
  <circle cx="206" cy="524" r="156" fill="rgba(255,255,255,0.18)" />
  <rect x="96" y="82" width="1008" height="466" rx="34" fill="url(#card)" stroke="rgba(122,87,36,0.14)" />
  <g transform="translate(152 134)">
    <circle cx="48" cy="48" r="48" fill="#ffb84d" />
    <circle cx="48" cy="48" r="20" fill="#6a4a20" />
  </g>
  <text x="152" y="272" fill="#452d10" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="72" font-weight="700">${safeTitle}</text>
  <text x="152" y="344" fill="#7b6852" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="28">Playable on KKE-OH!</text>
  <text x="152" y="432" fill="#9a7340" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="24">Default thumbnail</text>
</svg>`.trim();
}
export function createPlaceholderThumbnail(title) {
    return {
        path: 'thumbnail.svg',
        content: Buffer.from(createPlaceholderSvg(title), 'utf8'),
        contentType: 'image/svg+xml'
    };
}
export function getPlaceholderThumbnailDataUrl(title) {
    const svg = createPlaceholderSvg(title);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
