import { getGameAssetUrl } from '@/lib/games/urls';
import type { GameRecord } from '@/lib/games/types';

export type DiscoveryGame = {
  id: string;
  title: string;
  description: string;
  href: string;
  imageUrl?: string | null;
  badge: string;
  makerLabel: string;
  meta: string;
  score: number;
  category: string;
  categorySlug: string;
  createdAt: number;
};

export type DiscoverySection = {
  title: string;
  subtitle: string;
  seeAllHref: string;
  cards: DiscoveryGame[];
};

const categories = [
  'Action',
  'Puzzle',
  'Arcade',
  'Creative',
  'School Project',
  'Fast Play',
  'Beginner Made',
  'Mobile Friendly'
];

function hashValue(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function categoryToSlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function inferCategory(game: GameRecord): string {
  const haystack = `${game.title} ${game.description}`.toLowerCase();

  if (haystack.includes('puzzle')) return 'Puzzle';
  if (haystack.includes('school') || haystack.includes('student')) return 'School Project';
  if (haystack.includes('draw') || haystack.includes('build') || haystack.includes('paint')) return 'Creative';
  if (haystack.includes('mobile') || haystack.includes('touch')) return 'Mobile Friendly';
  if (haystack.includes('fast') || haystack.includes('quick')) return 'Fast Play';
  if (haystack.includes('action') || haystack.includes('jump') || haystack.includes('run')) return 'Action';
  if (haystack.includes('arcade') || haystack.includes('score')) return 'Arcade';
  return categories[hashValue(game.id) % categories.length];
}

function inferBadge(game: GameRecord, createdAt: number, score: number): string {
  const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  if (ageDays <= 10) return 'New';
  if (score >= 20) return 'Popular';
  if (game.allowlist_violation) return 'Reviewed';
  if ((game.thumbnail_path ?? '').length > 0) return 'Featured';
  return 'Maker Pick';
}

function inferMakerLabel(game: GameRecord): string {
  const firstWord = game.title.split(/\s+/)[0] ?? 'Maker';
  return `${titleCase(firstWord)} Studio`;
}

function buildMeta(game: GameRecord, category: string, score: number): string {
  const plays = Math.round((game.plays_7d ?? 0) + (game.plays_30d ?? 0) * 0.2);
  const parts = [category, `${Math.max(1, plays)} plays`];
  if ((game.description ?? '').length <= 80) {
    parts.push('Fast to try');
  }
  if (score >= 10) {
    parts.push('Loved by players');
  }
  return parts.join(' • ');
}

export function createDiscoveryGames(games: GameRecord[]): DiscoveryGame[] {
  return games.map((game) => {
    const score = (game.plays_7d ?? 0) + 0.2 * (game.plays_30d ?? 0);
    const createdAt = Date.parse(game.created_at);
    const category = inferCategory(game);

    return {
      id: game.id,
      title: game.title,
      description: truncateText(game.description || 'A small web game shared by the Kke-oh community.', 110),
      href: `/game/${game.id}`,
      imageUrl: game.thumbnail_path ? getGameAssetUrl(game.id, game.thumbnail_path) : null,
      badge: inferBadge(game, createdAt, score),
      makerLabel: inferMakerLabel(game),
      meta: buildMeta(game, category, score),
      score,
      category,
      categorySlug: categoryToSlug(category),
      createdAt
    };
  });
}

export function filterDiscoveryGames(games: DiscoveryGame[], query: string, category: string): DiscoveryGame[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCategory = category.trim().toLowerCase();

  return games.filter((game) => {
    const matchesQuery =
      !normalizedQuery ||
      `${game.title} ${game.description} ${game.category} ${game.makerLabel}`.toLowerCase().includes(normalizedQuery);
    const matchesCategory = !normalizedCategory || normalizedCategory === 'all' || game.categorySlug === normalizedCategory;
    return matchesQuery && matchesCategory;
  });
}

function takeGames(games: DiscoveryGame[], count: number): DiscoveryGame[] {
  return games.slice(0, Math.max(0, count));
}

export function buildDiscoverySections(games: DiscoveryGame[]): DiscoverySection[] {
  const byPopular = [...games].sort((left, right) => right.score - left.score);
  const byRecent = [...games].sort((left, right) => right.createdAt - left.createdAt);
  const fastPlay = games.filter((game) => game.category === 'Fast Play' || game.meta.includes('Fast to try'));
  const schoolProjects = games.filter((game) => game.category === 'School Project' || game.category === 'Beginner Made');
  const tinyIdeas = [...games].sort((left, right) => left.description.length - right.description.length);

  return [
    {
      title: 'Featured Games',
      subtitle: 'Friendly picks that are easy to jump into.',
      seeAllHref: '/#discover',
      cards: takeGames(byPopular, 6)
    },
    {
      title: 'New This Week',
      subtitle: 'Fresh projects from makers sharing what they built.',
      seeAllHref: '/?sort=new#discover',
      cards: takeGames(byRecent, 6)
    },
    {
      title: 'Popular with Players',
      subtitle: 'Games people keep coming back to.',
      seeAllHref: '/?sort=popular#discover',
      cards: takeGames(byPopular, 6)
    },
    {
      title: 'Made by Students',
      subtitle: 'School projects, experiments, and first launches.',
      seeAllHref: '/?filter=school-project#discover',
      cards: takeGames(schoolProjects.length ? schoolProjects : byRecent, 6)
    },
    {
      title: 'Tiny Games, Big Ideas',
      subtitle: 'Quick concepts with plenty of charm.',
      seeAllHref: '/?filter=fast-play#discover',
      cards: takeGames(tinyIdeas, 6)
    },
    {
      title: 'Simple One-Button Games',
      subtitle: 'Easy to learn and ready for a short play session.',
      seeAllHref: '/?filter=fast-play#discover',
      cards: takeGames(fastPlay.length ? fastPlay : games, 6)
    }
  ].filter((section) => section.cards.length > 0);
}

export function getCategoryOptions() {
  return ['All', ...categories].map((category) => ({
    label: category,
    slug: category === 'All' ? 'all' : categoryToSlug(category)
  }));
}
