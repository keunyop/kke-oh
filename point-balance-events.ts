export const POINT_BALANCE_UPDATED_EVENT = 'kkeoh:point-balance-updated';

export function dispatchPointBalanceUpdated(balance: number) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(POINT_BALANCE_UPDATED_EVENT, {
      detail: { balance }
    })
  );
}
