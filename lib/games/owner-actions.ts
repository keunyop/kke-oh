import type { GameRecord } from './types';

export type OwnerAction = 'publish' | 'hide' | 'unhide' | 'delete';

type OwnerActionGame = Pick<GameRecord, 'status' | 'is_hidden'>;

export function getPrimaryOwnerAction(game: OwnerActionGame): Exclude<OwnerAction, 'delete'> {
  if (game.status === 'DRAFT') return 'publish';
  if (game.is_hidden) return 'unhide';
  return 'hide';
}

export function shouldRenderPrimaryOwnerActionFirst(game: OwnerActionGame) {
  return getPrimaryOwnerAction(game) === 'publish';
}

export function getPrimaryOwnerActionClassName(action: Exclude<OwnerAction, 'delete'>) {
  if (action === 'publish') return 'button-primary';
  if (action === 'hide') return 'button-secondary';
  return 'button-ghost';
}
