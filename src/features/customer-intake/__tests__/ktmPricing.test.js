import {
  AIR_CARGO_RATE_THB_PER_KG,
  LAND_CARGO_RATE_THB_PER_KG,
  MIN_BILLABLE_WEIGHT_KG,
  WEIGHT_ROUNDING_STEP_KG,
  SHOPPING_COMMISSION_RATE,
  MIN_SHOPPING_COMMISSION_THB,
  SUPPORTED_ROUTES,
  SUPPORTED_CARGO_MODES,
  roundUpToNearestHalfKg,
  getCargoRate,
  calculateCargoFee,
  calculateShoppingCommission,
  calculateKtmPricing,
} from '../lib/ktmPricing.js';

// --- Constants ---

describe('constants', () => {
  test('AIR_CARGO_RATE_THB_PER_KG is 300', () => {
    expect(AIR_CARGO_RATE_THB_PER_KG).toBe(300);
  });

  test('LAND_CARGO_RATE_THB_PER_KG is 180', () => {
    expect(LAND_CARGO_RATE_THB_PER_KG).toBe(180);
  });

  test('MIN_BILLABLE_WEIGHT_KG is 0.5', () => {
    expect(MIN_BILLABLE_WEIGHT_KG).toBe(0.5);
  });

  test('WEIGHT_ROUNDING_STEP_KG is 0.5', () => {
    expect(WEIGHT_ROUNDING_STEP_KG).toBe(0.5);
  });

  test('SHOPPING_COMMISSION_RATE is 0.1', () => {
    expect(SHOPPING_COMMISSION_RATE).toBe(0.1);
  });

  test('MIN_SHOPPING_COMMISSION_THB is 100', () => {
    expect(MIN_SHOPPING_COMMISSION_THB).toBe(100);
  });

  test('SUPPORTED_ROUTES contains THAILAND_MYANMAR and MYANMAR_THAILAND', () => {
    expect(SUPPORTED_ROUTES).toContain('THAILAND_MYANMAR');
    expect(SUPPORTED_ROUTES).toContain('MYANMAR_THAILAND');
  });

  test('SUPPORTED_CARGO_MODES contains air and land', () => {
    expect(SUPPORTED_CARGO_MODES).toContain('air');
    expect(SUPPORTED_CARGO_MODES).toContain('land');
  });
});

// --- roundUpToNearestHalfKg ---

describe('roundUpToNearestHalfKg', () => {
  test('0.01 rounds up to 0.5', () => {
    expect(roundUpToNearestHalfKg(0.01)).toBe(0.5);
  });

  test('0.5 stays 0.5', () => {
    expect(roundUpToNearestHalfKg(0.5)).toBe(0.5);
  });

  test('0.51 rounds up to 1.0', () => {
    expect(roundUpToNearestHalfKg(0.51)).toBe(1.0);
  });

  test('1.0 stays 1.0', () => {
    expect(roundUpToNearestHalfKg(1.0)).toBe(1.0);
  });

  test('1.01 rounds up to 1.5', () => {
    expect(roundUpToNearestHalfKg(1.01)).toBe(1.5);
  });

  test('1.5 stays 1.5', () => {
    expect(roundUpToNearestHalfKg(1.5)).toBe(1.5);
  });

  test('1.51 rounds up to 2.0', () => {
    expect(roundUpToNearestHalfKg(1.51)).toBe(2.0);
  });

  test('throws RangeError for 0', () => {
    expect(() => roundUpToNearestHalfKg(0)).toThrow(RangeError);
  });

  test('throws RangeError for negative weight', () => {
    expect(() => roundUpToNearestHalfKg(-1)).toThrow(RangeError);
  });

  test('throws TypeError for string input', () => {
    expect(() => roundUpToNearestHalfKg('1')).toThrow(TypeError);
  });

  test('throws TypeError for NaN', () => {
    expect(() => roundUpToNearestHalfKg(NaN)).toThrow(TypeError);
  });

  test('throws TypeError for Infinity', () => {
    expect(() => roundUpToNearestHalfKg(Infinity)).toThrow(TypeError);
  });

  test('throws TypeError for null', () => {
    expect(() => roundUpToNearestHalfKg(null)).toThrow(TypeError);
  });

  test('throws TypeError for undefined', () => {
    expect(() => roundUpToNearestHalfKg(undefined)).toThrow(TypeError);
  });
});

// --- getCargoRate ---

describe('getCargoRate', () => {
  test('returns 300 for air', () => {
    expect(getCargoRate('air')).toBe(300);
  });

  test('returns 180 for land', () => {
    expect(getCargoRate('land')).toBe(180);
  });

  test('throws RangeError for unsupported mode', () => {
    expect(() => getCargoRate('sea')).toThrow(RangeError);
  });

  test('throws TypeError for non-string mode', () => {
    expect(() => getCargoRate(123)).toThrow(TypeError);
  });

  test('throws TypeError for null mode', () => {
    expect(() => getCargoRate(null)).toThrow(TypeError);
  });

  test('throws TypeError for undefined mode', () => {
    expect(() => getCargoRate(undefined)).toThrow(TypeError);
  });
});

// --- calculateCargoFee ---

describe('calculateCargoFee', () => {
  test('air 3kg returns 900 THB', () => {
    expect(calculateCargoFee({ mode: 'air', weightKg: 3 })).toBe(900);
  });

  test('land 3kg returns 540 THB', () => {
    expect(calculateCargoFee({ mode: 'land', weightKg: 3 })).toBe(540);
  });

  test('air 1.2kg billable weight 1.5 returns 450 THB', () => {
    expect(calculateCargoFee({ mode: 'air', weightKg: 1.2 })).toBe(450);
  });

  test('air minimum 0.1kg billable 0.5kg returns 150 THB', () => {
    expect(calculateCargoFee({ mode: 'air', weightKg: 0.1 })).toBe(150);
  });

  test('land minimum 0.1kg billable 0.5kg returns 90 THB', () => {
    expect(calculateCargoFee({ mode: 'land', weightKg: 0.1 })).toBe(90);
  });

  test('throws RangeError for invalid mode', () => {
    expect(() => calculateCargoFee({ mode: 'sea', weightKg: 1 })).toThrow(RangeError);
  });

  test('throws RangeError for zero weight', () => {
    expect(() => calculateCargoFee({ mode: 'air', weightKg: 0 })).toThrow(RangeError);
  });

  test('throws RangeError for negative weight', () => {
    expect(() => calculateCargoFee({ mode: 'air', weightKg: -1 })).toThrow(RangeError);
  });

  test('throws TypeError for string weight', () => {
    expect(() => calculateCargoFee({ mode: 'air', weightKg: '3' })).toThrow(TypeError);
  });

  test('throws TypeError for missing weight', () => {
    expect(() => calculateCargoFee({ mode: 'air' })).toThrow(TypeError);
  });

  test('throws TypeError for missing mode', () => {
    expect(() => calculateCargoFee({ weightKg: 3 })).toThrow(TypeError);
  });
});

// --- calculateShoppingCommission ---

describe('calculateShoppingCommission', () => {
  test('700 THB product cost returns 100 THB (minimum enforced)', () => {
    expect(calculateShoppingCommission(700)).toBe(100);
  });

  test('1000 THB product cost returns 100 THB (exactly at minimum)', () => {
    expect(calculateShoppingCommission(1000)).toBe(100);
  });

  test('1001 THB product cost returns 100.1 THB', () => {
    expect(calculateShoppingCommission(1001)).toBeCloseTo(100.1, 10);
  });

  test('2500 THB product cost returns 250 THB', () => {
    expect(calculateShoppingCommission(2500)).toBe(250);
  });

  test('throws RangeError for zero product cost', () => {
    expect(() => calculateShoppingCommission(0)).toThrow(RangeError);
  });

  test('throws RangeError for negative product cost', () => {
    expect(() => calculateShoppingCommission(-100)).toThrow(RangeError);
  });

  test('throws TypeError for string product cost', () => {
    expect(() => calculateShoppingCommission('1000')).toThrow(TypeError);
  });

  test('throws TypeError for NaN product cost', () => {
    expect(() => calculateShoppingCommission(NaN)).toThrow(TypeError);
  });

  test('throws TypeError for Infinity product cost', () => {
    expect(() => calculateShoppingCommission(Infinity)).toThrow(TypeError);
  });

  test('throws TypeError for null product cost', () => {
    expect(() => calculateShoppingCommission(null)).toThrow(TypeError);
  });

  test('throws TypeError for undefined product cost', () => {
    expect(() => calculateShoppingCommission(undefined)).toThrow(TypeError);
  });
});

// --- calculateKtmPricing ---

describe('calculateKtmPricing', () => {
  test('Thailand to Myanmar air cargo returns correct object', () => {
    const result = calculateKtmPricing({ route: 'THAILAND_MYANMAR', mode: 'air', weightKg: 3 });
    expect(result).toMatchObject({
      route: 'THAILAND_MYANMAR',
      mode: 'air',
      billableWeightKg: 3,
      cargoFeeThb: 900,
      shoppingCommissionThb: 0,
      totalThb: 900,
    });
  });

  test('Myanmar to Thailand land cargo returns correct object', () => {
    const result = calculateKtmPricing({ route: 'MYANMAR_THAILAND', mode: 'land', weightKg: 3 });
    expect(result).toMatchObject({
      route: 'MYANMAR_THAILAND',
      mode: 'land',
      billableWeightKg: 3,
      cargoFeeThb: 540,
      shoppingCommissionThb: 0,
      totalThb: 540,
    });
  });

  test('cargo-only pricing (includeShoppingCommission defaults to false)', () => {
    const result = calculateKtmPricing({ route: 'THAILAND_MYANMAR', mode: 'air', weightKg: 2 });
    expect(result.shoppingCommissionThb).toBe(0);
    expect(result.totalThb).toBe(result.cargoFeeThb);
  });

  test('with shopping commission adds commission to total', () => {
    const result = calculateKtmPricing({
      route: 'THAILAND_MYANMAR',
      mode: 'air',
      weightKg: 3,
      productCostThb: 2500,
      includeShoppingCommission: true,
    });
    expect(result.shoppingCommissionThb).toBe(250);
    expect(result.totalThb).toBe(1150); // 900 cargo + 250 commission
  });

  test('totalThb does NOT include productCostThb', () => {
    const result = calculateKtmPricing({
      route: 'THAILAND_MYANMAR',
      mode: 'air',
      weightKg: 3,
      productCostThb: 2500,
      includeShoppingCommission: true,
    });
    expect(result.totalThb).toBe(result.cargoFeeThb + result.shoppingCommissionThb);
    expect(result.totalThb).not.toBe(result.cargoFeeThb + result.shoppingCommissionThb + 2500);
  });

  test('shopping commission minimum enforced in combined pricing', () => {
    const result = calculateKtmPricing({
      route: 'THAILAND_MYANMAR',
      mode: 'land',
      weightKg: 1,
      productCostThb: 500,
      includeShoppingCommission: true,
    });
    expect(result.shoppingCommissionThb).toBe(100);
    expect(result.totalThb).toBe(result.cargoFeeThb + 100);
  });

  test('output object includes billableWeightKg reflecting rounding', () => {
    const result = calculateKtmPricing({ route: 'THAILAND_MYANMAR', mode: 'air', weightKg: 1.2 });
    expect(result.billableWeightKg).toBe(1.5);
  });

  test('input object is not mutated', () => {
    const input = {
      route: 'THAILAND_MYANMAR',
      mode: 'air',
      weightKg: 3,
      productCostThb: 2500,
      includeShoppingCommission: true,
    };
    const original = { ...input };
    calculateKtmPricing(input);
    expect(input).toEqual(original);
  });

  test('throws RangeError for unsupported route', () => {
    expect(() =>
      calculateKtmPricing({ route: 'THAILAND_JAPAN', mode: 'air', weightKg: 3 })
    ).toThrow(RangeError);
  });

  test('throws TypeError for missing route', () => {
    expect(() => calculateKtmPricing({ mode: 'air', weightKg: 3 })).toThrow(TypeError);
  });

  test('throws RangeError for unsupported mode', () => {
    expect(() =>
      calculateKtmPricing({ route: 'THAILAND_MYANMAR', mode: 'sea', weightKg: 3 })
    ).toThrow(RangeError);
  });

  test('throws TypeError for non-boolean includeShoppingCommission', () => {
    expect(() =>
      calculateKtmPricing({
        route: 'THAILAND_MYANMAR',
        mode: 'air',
        weightKg: 3,
        includeShoppingCommission: 'true',
      })
    ).toThrow(TypeError);
  });

  test('throws TypeError for missing productCostThb when includeShoppingCommission is true', () => {
    expect(() =>
      calculateKtmPricing({
        route: 'THAILAND_MYANMAR',
        mode: 'air',
        weightKg: 3,
        includeShoppingCommission: true,
      })
    ).toThrow(TypeError);
  });

  test('throws RangeError for zero weightKg', () => {
    expect(() =>
      calculateKtmPricing({ route: 'THAILAND_MYANMAR', mode: 'air', weightKg: 0 })
    ).toThrow(RangeError);
  });

  test('throws TypeError for NaN weightKg', () => {
    expect(() =>
      calculateKtmPricing({ route: 'THAILAND_MYANMAR', mode: 'air', weightKg: NaN })
    ).toThrow(TypeError);
  });
});
