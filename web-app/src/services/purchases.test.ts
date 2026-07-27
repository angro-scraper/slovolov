import { describe, expect, it, vi } from 'vitest';
import {
  FAMILY_PRODUCT_ID,
  createPurchaseManager,
  type PurchaseGateway
} from './purchases';

function gateway(overrides: Partial<PurchaseGateway> = {}): PurchaseGateway {
  return {
    initialize: vi.fn().mockResolvedValue({ available: true, owned: false, price: '4,99 €' }),
    purchase: vi.fn().mockResolvedValue({ state: 'cancelled' }),
    restore: vi.fn().mockResolvedValue({ owned: false }),
    ...overrides
  };
}

describe('Slovolov Family kupovina', () => {
  it('koristi stabilan non-consumable product ID', () => {
    expect(FAMILY_PRODUCT_ID).toBe('slovolov_family_unlock');
  });

  it('ne otključava sadržaj kada je kupovina otkazana ili pending', async () => {
    const grant = vi.fn();
    const cancelled = createPurchaseManager(gateway(), grant);
    expect(await cancelled.purchase()).toMatchObject({ state: 'cancelled' });
    expect(grant).not.toHaveBeenCalled();

    const pending = createPurchaseManager(
      gateway({ purchase: vi.fn().mockResolvedValue({ state: 'pending' }) }),
      grant
    );
    expect(await pending.purchase()).toMatchObject({ state: 'pending' });
    expect(grant).not.toHaveBeenCalled();
  });

  it('otključava tek posle potvrđenog store vlasništva', async () => {
    const grant = vi.fn();
    const manager = createPurchaseManager(
      gateway({ purchase: vi.fn().mockResolvedValue({ state: 'verified' }) }),
      grant
    );
    await manager.purchase();
    expect(grant).toHaveBeenCalledWith('store');
  });

  it('restore vraća kupovinu, ali ne izmišlja uspeh kada proizvod nije kupljen', async () => {
    const grant = vi.fn();
    const restored = createPurchaseManager(
      gateway({ restore: vi.fn().mockResolvedValue({ owned: true }) }),
      grant
    );
    expect(await restored.restore()).toEqual({ owned: true });
    expect(grant).toHaveBeenCalledWith('store');

    grant.mockClear();
    const missing = createPurchaseManager(gateway(), grant);
    expect(await missing.restore()).toEqual({ owned: false });
    expect(grant).not.toHaveBeenCalled();
  });
});
