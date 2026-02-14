const LAYOUT_BYPASS_EXACT_PATHS = new Set(['/', '/PriceCalculator']);
const LAYOUT_BYPASS_PREFIXES = ['/ClientPortal', '/VendorRegistration'];

export function shouldBypassAppLayout(pathname = '') {
  if (LAYOUT_BYPASS_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return LAYOUT_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
