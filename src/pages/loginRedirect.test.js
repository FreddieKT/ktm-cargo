import { buildClientPortalLoginUrl, resolveLoginRedirectTarget } from './loginRedirect';

describe('loginRedirect helpers', () => {
  it('prefers the attempted route from navigation state', () => {
    const target = resolveLoginRedirectTarget({
      state: {
        from: {
          pathname: '/Procurement',
          search: '?tab=approval',
          hash: '#queue',
        },
      },
      search: '',
    });

    expect(target).toBe('/Procurement?tab=approval#queue');
  });

  it('falls back to returnTo query params when state is unavailable', () => {
    const target = resolveLoginRedirectTarget({
      search: '?returnTo=%2FInvoices%3Ftab%3Dvendor',
    });

    expect(target).toBe('/Invoices?tab=vendor');
  });

  it('builds a client portal login url that preserves the return target and e2e fixture', () => {
    const loginUrl = buildClientPortalLoginUrl('/Operations?tab=summary', '?__e2e=workflow-staff');

    expect(loginUrl).toBe(
      '/ClientPortal?__e2e=workflow-staff&returnTo=%2FOperations%3Ftab%3Dsummary'
    );
  });
});
