import { getGameAssetUrl } from '@/lib/games/urls';
import { getPlaceholderThumbnailDataUrl } from '@/lib/games/placeholder';
import type { GameRecord } from '@/lib/games/types';

const NEW_BADGE_DAYS = 7;

export type DiscoveryGame = {
  id: string;
  title: string;
  description: string;
  href: string;
  imageUrl?: string | null;
  uploaderName: string;
  playCount: number;
  likeCount: number;
  dislikeCount: number;
  score: number;
  isNew: boolean;
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

function getPlayScore(game: GameRecord) {
  return (game.plays_7d ?? 0) * 5 + (game.plays_30d ?? 0) * 1.5;
}

function getReactionScore(game: GameRecord) {
  const likes = game.like_count ?? 0;
  const dislikes = game.dislike_count ?? 0;
  const totalReactions = likes + dislikes;
  const approvalRatio = totalReactions > 0 ? likes / totalReactions : 0.5;

  return likes * 18 - dislikes * 12 + approvalRatio * Math.min(totalReactions, 20) * 4;
}

function getFreshnessBonus(createdAt: number) {
  if (!Number.isFinite(createdAt)) {
    return 0;
  }

  const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  return Math.max(0, 14 - ageDays) * 1.25;
}

function computePopularityScore(game: GameRecord) {
  const createdAt = Date.parse(game.created_at);
  return getPlayScore(game) + getReactionScore(game) + getFreshnessBonus(createdAt);
}

export function createDiscoveryGames(games: GameRecord[]): DiscoveryGame[] {
  return games.map((game) => {
    const createdAt = Date.parse(game.created_at);
    const category = inferCategory(game);
    const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);

    return {
      id: game.id,
      title: game.title,
      description: truncateText(game.description || 'A fun web game shared by a maker.', 110),
      href: `/game/${game.slug}`,
      imageUrl: game.thumbnail_path ? getGameAssetUrl(game.id, game.thumbnail_path) : getPlaceholderThumbnailDataUrl(game.title),
      uploaderName: game.uploader_name || 'Maker',
      playCount: Math.max(0, Math.round((game.plays_7d ?? 0) + (game.plays_30d ?? 0) * 0.2)),
      likeCount: game.like_count ?? 0,
      dislikeCount: game.dislike_count ?? 0,
      score: computePopularityScore(game),
      isNew: ageDays <= NEW_BADGE_DAYS,
      category,
      categorySlug: categoryToSlug(category),
      createdAt
    };
  });
}

export function sortDiscoveryGames(games: DiscoveryGame[]) {
  return [...games].sort((left, right) => {
    if (left.score !== right.score) {
      return right.score - left.score;
    }

    if (left.playCount !== right.playCount) {
      return right.playCount - left.playCount;
    }

    const leftApproval = left.likeCount - left.dislikeCount;
    const rightApproval = right.likeCount - right.dislikeCount;
    if (leftApproval !== rightApproval) {
      return rightApproval - leftApproval;
    }

    if (left.isNew !== right.isNew) {
      return left.isNew ? -1 : 1;
    }

    return right.createdAt - left.createdAt;
  });
}

export function filterDiscoveryGames(games: DiscoveryGame[], query: string, category: string): DiscoveryGame[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCategory = category.trim().toLowerCase();

  return games.filter((game) => {
    const matchesQuery = !normalizedQuery || `${game.title} ${game.uploaderName}`.toLowerCase().includes(normalizedQuery);
    const matchesCategory = !normalizedCategory || normalizedCategory === 'all' || game.categorySlug === normalizedCategory;
    return matchesQuery && matchesCategory;
  });
}

function takeGames(games: DiscoveryGame[], count: number): DiscoveryGame[] {
  return games.slice(0, Math.max(0, count));
}

export function buildDiscoverySections(games: DiscoveryGame[]): DiscoverySection[] {
  const byPopular = sortDiscoveryGames(games);
  const byRecent = [...games].sort((left, right) => right.createdAt - left.createdAt);
  const fastPlay = games.filter((game) => game.category === 'Fast Play');
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
