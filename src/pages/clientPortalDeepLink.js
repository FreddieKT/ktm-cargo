const CUSTOMER_PORTAL_TABS = new Set([
  'dashboard',
  'track',
  'new-order',
  'history',
  'invoices',
  'support',
  'profile',
]);

const VENDOR_PORTAL_TABS = new Set(['dashboard', 'orders', 'invoices', 'performance', 'profile']);

export function resolvePortalDeepLink({ search = '', portalType, defaultTab = 'dashboard' }) {
  const params = new URLSearchParams(search || '');
  const tabParam = params.get('tab')?.trim().toLowerCase() || '';
  const trackingNumber = params.get('tracking')?.trim() || '';

  if (!portalType) {
    return { tab: defaultTab, trackingNumber: '', hasUnsupportedTab: false };
  }

  const allowedTabs = portalType === 'customer' ? CUSTOMER_PORTAL_TABS : VENDOR_PORTAL_TABS;
  const hasUnsupportedTab = !!tabParam && !allowedTabs.has(tabParam);
  const resolvedTab = tabParam && allowedTabs.has(tabParam) ? tabParam : defaultTab;

  // For customer deep links, tracking should open the tracker regardless of tab param.
  if (portalType === 'customer' && trackingNumber) {
    return { tab: 'track', trackingNumber, hasUnsupportedTab };
  }

  return {
    tab: resolvedTab,
    trackingNumber: portalType === 'customer' ? trackingNumber : '',
    hasUnsupportedTab,
  };
}
