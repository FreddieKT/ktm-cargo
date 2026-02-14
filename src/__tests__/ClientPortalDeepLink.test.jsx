import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockCustomerShipmentTracker = jest.fn((props) => (
  <div data-testid="customer-tracker-mock">
    Tracker Mock
    {props.initialTrackingNumber ? ` ${props.initialTrackingNumber}` : ''}
  </div>
));

jest.mock('@/components/portal/CustomerPortalDashboard', () => ({
  __esModule: true,
  default: () => <div>Customer Dashboard Mock</div>,
}));

jest.mock('@/components/portal/CustomerShipmentTracker', () => ({
  __esModule: true,
  default: (props) => mockCustomerShipmentTracker(props),
}));

jest.mock('@/components/portal/CustomerOrderHistory', () => ({
  __esModule: true,
  default: () => <div>Customer History Mock</div>,
}));

jest.mock('@/components/portal/CustomerNewOrder', () => ({
  __esModule: true,
  default: () => <div>Customer New Order Mock</div>,
}));

jest.mock('@/components/portal/CustomerInvoices', () => ({
  __esModule: true,
  default: () => <div>Customer Invoices Mock</div>,
}));

jest.mock('@/components/portal/CustomerSupport', () => ({
  __esModule: true,
  default: () => <div>Customer Support Mock</div>,
}));

jest.mock('@/components/portal/CustomerProfile', () => ({
  __esModule: true,
  default: () => <div>Customer Profile Mock</div>,
}));

jest.mock('@/components/portal/VendorPortalDashboard', () => ({
  __esModule: true,
  default: () => <div>Vendor Dashboard Mock</div>,
}));

jest.mock('@/components/portal/VendorOrders', () => ({
  __esModule: true,
  default: () => <div>Vendor Orders Mock</div>,
}));

jest.mock('@/components/portal/VendorInvoices', () => ({
  __esModule: true,
  default: () => <div>Vendor Invoices Mock</div>,
}));

jest.mock('@/components/portal/VendorProfile', () => ({
  __esModule: true,
  default: () => <div>Vendor Profile Mock</div>,
}));

jest.mock('@/components/portal/VendorPerformance', () => ({
  __esModule: true,
  default: () => <div>Vendor Performance Mock</div>,
}));

jest.mock('@/components/portal/ClientNotificationBell', () => ({
  __esModule: true,
  default: () => <div data-testid="client-notification-bell-mock" />,
}));

jest.mock('@/api/auth', () => ({
  auth: {
    isAuthenticated: jest.fn(),
    me: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock('@/api/db', () => ({
  db: {
    companySettings: { list: jest.fn() },
    vendors: { filter: jest.fn(), update: jest.fn() },
    customers: { filter: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}));

const mockSupabase = {
  auth: {
    onAuthStateChange: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  },
  rpc: jest.fn(),
  channel: jest.fn(),
  removeChannel: jest.fn(),
};

jest.mock('@/api/supabaseClient', () => ({
  supabase: mockSupabase,
}));

const { auth } = jest.requireMock('@/api/auth');
const { db } = jest.requireMock('@/api/db');
const ClientPortal = jest.requireActual('@/pages/ClientPortal').default;

function renderClientPortal(initialEntry) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/ClientPortal" element={<ClientPortal />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ClientPortal deep-link hydration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    auth.isAuthenticated.mockResolvedValue(true);
    auth.me.mockResolvedValue({
      id: 'user-1',
      role: 'customer',
      email: 'alice@example.com',
      full_name: 'Alice',
      phone: '+123456789',
    });

    db.companySettings.list.mockResolvedValue([]);
    db.vendors.filter.mockResolvedValue([]);
    db.customers.filter.mockImplementation(async (criteria) => {
      if (criteria?.auth_user_id === 'user-1') {
        return [
          {
            id: 'cust-1',
            name: 'Alice',
            email: 'alice@example.com',
            phone: '+123456789',
            customer_type: 'individual',
          },
        ];
      }
      return [];
    });
    db.customers.create.mockResolvedValue(null);
    db.customers.update.mockResolvedValue(null);
    db.vendors.update.mockResolvedValue(null);

    mockSupabase.rpc.mockResolvedValue({ error: null });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    mockSupabase.channel.mockImplementation(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue('mock-channel'),
    }));
    mockSupabase.removeChannel.mockReturnValue(undefined);
  });

  it('opens the deep-linked customer tab when tab query param is valid', async () => {
    renderClientPortal('/ClientPortal?tab=history');

    await waitFor(() => {
      expect(screen.getByText('Customer History Mock')).toBeInTheDocument();
    });
  });

  it('falls back to dashboard when deep-linked tab is invalid', async () => {
    renderClientPortal('/ClientPortal?tab=unknown-tab');

    await waitFor(() => {
      expect(screen.getByText('Customer Dashboard Mock')).toBeInTheDocument();
    });
  });

  it('forces track tab and forwards tracking number from URL', async () => {
    renderClientPortal('/ClientPortal?tab=invoices&tracking=TRK-123');

    await waitFor(() => {
      expect(screen.getByTestId('customer-tracker-mock')).toHaveTextContent('TRK-123');
    });

    expect(mockCustomerShipmentTracker).toHaveBeenCalled();
  });
});
