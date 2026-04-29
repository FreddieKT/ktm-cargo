export const AIR_CARGO_RATE_THB_PER_KG = 300;
export const LAND_CARGO_RATE_THB_PER_KG = 180;
export const MIN_BILLABLE_WEIGHT_KG = 0.5;
export const WEIGHT_ROUNDING_STEP_KG = 0.5;
export const SHOPPING_COMMISSION_RATE = 0.1;
export const MIN_SHOPPING_COMMISSION_THB = 100;
export const SUPPORTED_ROUTES = ['THAILAND_MYANMAR', 'MYANMAR_THAILAND'];
export const SUPPORTED_CARGO_MODES = ['air', 'land'];

function assertFiniteNumber(value, name) {
  if (value === null || value === undefined || typeof value !== 'number') {
    throw new TypeError(`${name} must be a number`);
  }
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}

function assertPositive(value, name) {
  if (value <= 0) {
    throw new RangeError(`${name} must be greater than 0`);
  }
}

export function roundUpToNearestHalfKg(weightKg) {
  assertFiniteNumber(weightKg, 'weightKg');
  assertPositive(weightKg, 'weightKg');
  return Math.ceil(weightKg / WEIGHT_ROUNDING_STEP_KG) * WEIGHT_ROUNDING_STEP_KG;
}

export function getCargoRate(mode) {
  if (mode === null || mode === undefined || typeof mode !== 'string') {
    throw new TypeError('mode must be a string');
  }
  if (!SUPPORTED_CARGO_MODES.includes(mode)) {
    throw new RangeError(`mode must be one of: ${SUPPORTED_CARGO_MODES.join(', ')}`);
  }
  return mode === 'air' ? AIR_CARGO_RATE_THB_PER_KG : LAND_CARGO_RATE_THB_PER_KG;
}

export function calculateCargoFee({ mode, weightKg } = {}) {
  if (mode === undefined) throw new TypeError('mode is required');
  assertFiniteNumber(weightKg, 'weightKg');
  assertPositive(weightKg, 'weightKg');
  const rate = getCargoRate(mode);
  const billableWeight = roundUpToNearestHalfKg(weightKg);
  return rate * billableWeight;
}

export function calculateShoppingCommission(productCostThb) {
  assertFiniteNumber(productCostThb, 'productCostThb');
  assertPositive(productCostThb, 'productCostThb');
  const commission = productCostThb * SHOPPING_COMMISSION_RATE;
  return Math.max(commission, MIN_SHOPPING_COMMISSION_THB);
}

export function calculateKtmPricing({
  route,
  mode,
  weightKg,
  productCostThb,
  includeShoppingCommission = false,
} = {}) {
  if (route === undefined || route === null) throw new TypeError('route is required');
  if (typeof route !== 'string' || !SUPPORTED_ROUTES.includes(route)) {
    throw new RangeError(`route must be one of: ${SUPPORTED_ROUTES.join(', ')}`);
  }

  if (includeShoppingCommission !== false && typeof includeShoppingCommission !== 'boolean') {
    throw new TypeError('includeShoppingCommission must be a boolean');
  }

  if (includeShoppingCommission === true) {
    if (productCostThb === undefined || productCostThb === null) {
      throw new TypeError('productCostThb is required when includeShoppingCommission is true');
    }
  }

  assertFiniteNumber(weightKg, 'weightKg');
  assertPositive(weightKg, 'weightKg');

  if (typeof mode !== 'string') throw new TypeError('mode must be a string');
  if (!SUPPORTED_CARGO_MODES.includes(mode)) {
    throw new RangeError(`mode must be one of: ${SUPPORTED_CARGO_MODES.join(', ')}`);
  }

  const billableWeightKg = roundUpToNearestHalfKg(weightKg);
  const rate = getCargoRate(mode);
  const cargoFeeThb = rate * billableWeightKg;
  const shoppingCommissionThb = includeShoppingCommission
    ? calculateShoppingCommission(productCostThb)
    : 0;
  const totalThb = cargoFeeThb + shoppingCommissionThb;

  return {
    route,
    mode,
    billableWeightKg,
    cargoFeeThb,
    shoppingCommissionThb,
    totalThb,
  };
}
