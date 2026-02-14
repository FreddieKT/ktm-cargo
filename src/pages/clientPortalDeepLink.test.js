import { resolvePortalDeepLink } from './clientPortalDeepLink';

describe('resolvePortalDeepLink', () => {
  it('uses customer tab from URL when valid', () => {
    expect(
      resolvePortalDeepLink({
        search: '?tab=history',
        portalType: 'customer',
      })
    ).toEqual({
      tab: 'history',
      trackingNumber: '',
      hasUnsupportedTab: false,
    });
  });

  it('forces track tab when customer tracking query exists', () => {
    expect(
      resolvePortalDeepLink({
        search: '?tab=invoices&tracking=TRK-123',
        portalType: 'customer',
      })
    ).toEqual({
      tab: 'track',
      trackingNumber: 'TRK-123',
      hasUnsupportedTab: false,
    });
  });

  it('falls back safely on unsupported customer tab', () => {
    expect(
      resolvePortalDeepLink({
        search: '?tab=unknown-tab',
        portalType: 'customer',
      })
    ).toEqual({
      tab: 'dashboard',
      trackingNumber: '',
      hasUnsupportedTab: true,
    });
  });

  it('supports vendor tab deep links', () => {
    expect(
      resolvePortalDeepLink({
        search: '?tab=orders',
        portalType: 'vendor',
      })
    ).toEqual({
      tab: 'orders',
      trackingNumber: '',
      hasUnsupportedTab: false,
    });
  });

  it('ignores tracking for vendor portal and falls back on unsupported tab', () => {
    expect(
      resolvePortalDeepLink({
        search: '?tab=track&tracking=TRK-999',
        portalType: 'vendor',
      })
    ).toEqual({
      tab: 'dashboard',
      trackingNumber: '',
      hasUnsupportedTab: true,
    });
  });
});
