import { appendE2EFixture } from '@/lib/e2e';

function normalizeInternalPath(target) {
  if (!target || typeof target !== 'string') return null;
  const trimmed = target.trim();
  if (!trimmed.startsWith('/')) return null;

  try {
    const url = new URL(trimmed, 'http://localhost');
    if (!url.pathname.startsWith('/')) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function normalizeLocationTarget(location) {
  const from = location?.state?.from;
  if (from?.pathname) {
    return normalizeInternalPath(`${from.pathname}${from.search || ''}${from.hash || ''}`);
  }

  const search = typeof location?.search === 'string' ? location.search : '';
  const returnTo = new URLSearchParams(search).get('returnTo');
  return normalizeInternalPath(returnTo);
}

export function resolveLoginRedirectTarget(location) {
  return normalizeLocationTarget(location);
}

export function buildClientPortalLoginUrl(target, search = '') {
  const loginUrl = appendE2EFixture('/ClientPortal', search);
  const normalizedTarget = normalizeInternalPath(target);

  if (!normalizedTarget) {
    return loginUrl;
  }

  const separator = loginUrl.includes('?') ? '&' : '?';
  return `${loginUrl}${separator}returnTo=${encodeURIComponent(normalizedTarget)}`;
}
