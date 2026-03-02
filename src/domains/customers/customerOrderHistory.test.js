import {
  normalizeShipmentOrder,
  normalizeShoppingOrder,
  buildCustomerOrderHistory,
} from './customerOrderHistory';

describe('customerOrderHistory normalization', () => {
  test('normalizes shipment orders with tracking fallback and numeric coercion', () => {
    const normalized = normalizeShipmentOrder({
      id: 'abc123',
      items_description: 'Phone accessories',
      service_type: 'cargo_medium',
      status: 'in_transit',
      payment_status: 'unpaid',
      total_amount: '1500',
      weight_kg: '3.5',
      created_date: '2026-01-01T10:00:00.000Z',
    });

    expect(normalized.sourceType).toBe('shipment');
    expect(normalized.displayId).toBe('SHP-ABC123');
    expect(normalized.totalAmount).toBe(1500);
    expect(normalized.weightKg).toBe(3.5);
    expect(normalized.serviceLabel).toBe('cargo medium');
  });

  test('normalizes shopping orders with order number and estimated weight fallback', () => {
    const normalized = normalizeShoppingOrder({
      id: 'shop001',
      order_number: 'SHOP-2026-1001',
      product_details: 'Nike shoes size 42',
      product_links: 'https://example.com/item',
      status: 'purchased',
      payment_status: 'deposit_paid',
      total_amount: '3200',
      estimated_weight: '2.2',
      created_date: '2026-01-02T12:00:00.000Z',
    });

    expect(normalized.sourceType).toBe('shopping');
    expect(normalized.displayId).toBe('SHOP-2026-1001');
    expect(normalized.weightKg).toBe(2.2);
    expect(normalized.totalAmount).toBe(3200);
    expect(normalized.searchText).toContain('nike shoes');
  });
});

describe('buildCustomerOrderHistory', () => {
  test('merges shipments and shopping orders and sorts newest first', () => {
    const history = buildCustomerOrderHistory(
      [
        {
          id: 's1',
          tracking_number: 'TRK-OLD',
          created_date: '2026-01-01T09:00:00.000Z',
          total_amount: 100,
          status: 'pending',
        },
        {
          id: 's2',
          tracking_number: 'TRK-NEW',
          created_date: '2026-01-04T09:00:00.000Z',
          total_amount: 200,
          status: 'confirmed',
        },
      ],
      [
        {
          id: 'o1',
          order_number: 'SHOP-9001',
          created_date: '2026-01-03T09:00:00.000Z',
          total_amount: 300,
          status: 'purchased',
        },
      ]
    );

    expect(history).toHaveLength(3);
    expect(history[0].displayId).toBe('TRK-NEW');
    expect(history[1].displayId).toBe('SHOP-9001');
    expect(history[2].displayId).toBe('TRK-OLD');
  });

  test('keeps IDs unique across order types even with same source id', () => {
    const history = buildCustomerOrderHistory(
      [{ id: 'same-id', created_date: '2026-01-01T00:00:00.000Z' }],
      [{ id: 'same-id', created_date: '2026-01-01T00:00:00.000Z' }]
    );

    const ids = history.map((item) => item.id);
    expect(new Set(ids).size).toBe(2);
    expect(ids.some((id) => id.startsWith('shipment-'))).toBe(true);
    expect(ids.some((id) => id.startsWith('shopping-'))).toBe(true);
  });
});
