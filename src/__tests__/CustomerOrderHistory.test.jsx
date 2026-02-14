import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerOrderHistory from '@/components/portal/CustomerOrderHistory';

const mockShipmentFilter = jest.fn();
const mockShoppingOrderFilter = jest.fn();

jest.mock('@/api/db', () => ({
  db: {
    shipments: {
      filter: (...args) => mockShipmentFilter(...args),
    },
    shoppingOrders: {
      filter: (...args) => mockShoppingOrderFilter(...args),
    },
  },
}));

function renderWithQuery(ui) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('CustomerOrderHistory', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders combined shipment and shopping orders for the customer', async () => {
    mockShipmentFilter.mockResolvedValueOnce([
      {
        id: 'ship-1',
        tracking_number: 'TRK-1001',
        items_description: 'Laptop and charger',
        status: 'in_transit',
        payment_status: 'unpaid',
        weight_kg: 2.5,
        total_amount: 1500,
        created_date: '2026-01-02T08:00:00.000Z',
      },
    ]);

    mockShoppingOrderFilter.mockResolvedValueOnce([
      {
        id: 'shop-1',
        order_number: 'SHOP-2001',
        product_details: 'Running shoes size 42',
        status: 'purchased',
        payment_status: 'deposit_paid',
        estimated_weight: 1.2,
        total_amount: 2200,
        created_date: '2026-01-03T09:00:00.000Z',
      },
    ]);

    renderWithQuery(<CustomerOrderHistory customer={{ id: 'cust-1', name: 'Alice' }} />);

    expect(await screen.findByText('SHOP-2001')).toBeInTheDocument();
    expect(screen.getByText('TRK-1001')).toBeInTheDocument();
    expect(screen.getByText('Order History (2)')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockShipmentFilter).toHaveBeenCalledWith({ customer_id: 'cust-1' }, '-created_date');
      expect(mockShoppingOrderFilter).toHaveBeenCalledWith(
        { customer_id: 'cust-1' },
        '-created_date'
      );
    });
  });
});
