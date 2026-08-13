import { describe, expect, it, vi } from 'vitest';
import {
  IOS_PREMIUM_MONTHLY_PRODUCT_ID,
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

describe('Slovolov Premium pretplata', () => {
  it('koristi stabilan iOS subscription product ID', () => {
    expect(IOS_PREMIUM_MONTHLY_PRODUCT_ID).toBe('rs.slovolov.app.premium.monthly');
  });

  it('ne otključava sadržaj kada je kupovina otkazana ili pending', async () => {
    const syncAccess = vi.fn();
    const cancelled = createPurchaseManager(gateway(), syncAccess);
    expect(await cancelled.purchase()).toMatchObject({ state: 'cancelled' });
    expect(syncAccess).not.toHaveBeenCalled();

    const pending = createPurchaseManager(
      gateway({ purchase: vi.fn().mockResolvedValue({ state: 'pending' }) }),
      syncAccess
    );
    expect(await pending.purchase()).toMatchObject({ state: 'pending' });
    expect(syncAccess).not.toHaveBeenCalled();
  });

  it('otključava tek posle potvrđenog store vlasništva', async () => {
    const syncAccess = vi.fn();
    const manager = createPurchaseManager(
      gateway({ purchase: vi.fn().mockResolvedValue({ state: 'verified' }) }),
      syncAccess
    );
    await manager.purchase();
    expect(syncAccess).toHaveBeenCalledWith(true);
  });

  it('restore vraća kupovinu, ali ne izmišlja uspeh kada proizvod nije kupljen', async () => {
    const syncAccess = vi.fn();
    const restored = createPurchaseManager(
      gateway({ restore: vi.fn().mockResolvedValue({ owned: true }) }),
      syncAccess
    );
    expect(await restored.restore()).toEqual({ owned: true });
    expect(syncAccess).toHaveBeenCalledWith(true);

    syncAccess.mockClear();
    const missing = createPurchaseManager(gateway(), syncAccess);
    expect(await missing.restore()).toEqual({ owned: false });
    expect(syncAccess).toHaveBeenCalledWith(false);
  });

  it('ponovno proverava entitlement na otvaranju i povlači pristup kada je pretplata istekla', async () => {
    const syncAccess = vi.fn();
    const manager = createPurchaseManager(gateway({ initialize: vi.fn().mockResolvedValue({ available: true, owned: false }) }), syncAccess);
    await manager.initialize();
    expect(syncAccess).toHaveBeenCalledWith(false);
  });
});
