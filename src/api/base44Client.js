import { supabase } from './supabaseClient';

// Helper to parse sort string (e.g. "-created_date" -> { column: "created_date", ascending: false })
const parseSort = (sortString) => {
  if (!sortString) return null;
  const isDesc = sortString.startsWith('-');
  const column = isDesc ? sortString.substring(1) : sortString;
  return { column, ascending: !isDesc };
};

// Generic Entity Client Factory
const createEntityClient = (tableName) => ({
  list: async (sortString, limit) => {
    let query = supabase.from(tableName).select('*');

    if (sortString) {
      const { column, ascending } = parseSort(sortString);
      query = query.order(column, { ascending });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  get: async (id) => {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  create: async (data) => {
    const { data: created, error } = await supabase.from(tableName).insert(data).select().single();
    if (error) throw error;
    return created;
  },

  update: async (id, updates) => {
    const { data: updated, error } = await supabase.from(tableName).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return updated;
  },

  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  filter: async (filters, sortString) => {
    let query = supabase.from(tableName).select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    if (sortString) {
      const { column, ascending } = parseSort(sortString);
      query = query.order(column, { ascending });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
});

// Auth Adapter
const authAdapter = {
  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // DEV MODE BYPASS: If no user is logged in (because Auth isn't set up yet),
    // return a Mock Admin user so the UI works.
    if (!user) {
      console.warn('No Supabase session found. Using MOCK ADMIN for development.');
      return {
        id: 'mock-admin-id',
        email: 'admin@ktmcargo.com',
        full_name: 'Dev Admin',
        role: 'admin', // Full access
        staff_role: 'managing_director',
        created_date: new Date().toISOString()
      };
    }

    // Fetch profile data
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    // If profile doesn't exist, create it (Self-healing)
    if (!profile) {
      console.log('Profile missing, creating default profile...');
      const newProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'staff',
        staff_role: 'marketing_manager', // Default role
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      const { data: created, error } = await supabase.from('profiles').insert(newProfile).select().single();
      if (!error) {
        profile = created;
      } else {
        console.error('Error creating profile:', error);
        // Fallback so app doesn't crash
        profile = { staff_role: 'marketing_manager', role: 'staff' };
      }
    }

    return {
      ...user,
      ...profile,
      // Map Supabase user fields to expected app fields
      email: user.email,
      id: user.id,
      // Ensure staff_role is present for RBAC
      staff_role: profile?.staff_role || 'marketing_manager',
      role: profile?.role || 'staff'
    };
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  logout: async () => {
    await supabase.auth.signOut();
    // Redirect to the public landing page
    window.location.href = '/';
  },

  redirectToLogin: (redirectUrl) => {
    // Redirect to the client portal for login
    window.location.href = '/ClientPortal';
  }
};

// Integrations Adapter (Mock for now)
const integrationsAdapter = {
  Core: {
    SendEmail: async (params) => {
      console.log('MOCK EMAIL SENT:', params);
      return { success: true };
    },
    UploadFile: async (file) => {
      console.log('MOCK FILE UPLOAD:', file);
      return { url: 'https://via.placeholder.com/150' };
    },
    GenerateImage: async (prompt) => {
      console.log('MOCK IMAGE GEN:', prompt);
      return { url: 'https://via.placeholder.com/150' };
    }
  }
};

// Export the 'base44' object that mimics the old SDK
export const base44 = {
  entities: {
    Customer: createEntityClient('customers'),
    Shipment: createEntityClient('shipments'),
    ShoppingOrder: createEntityClient('shopping_orders'),
    Task: createEntityClient('tasks'),
    Expense: createEntityClient('expenses'),
    Campaign: createEntityClient('campaigns'),
    Feedback: createEntityClient('feedback'),
    InventoryItem: createEntityClient('inventory_items'),
    StockMovement: createEntityClient('stock_movements'),
    Notification: createEntityClient('notifications'),
    Vendor: createEntityClient('vendors'),
    VendorOrder: createEntityClient('vendor_orders'),
    VendorPayment: createEntityClient('vendor_payments'),
    ServicePricing: createEntityClient('service_pricing'),
    Surcharge: createEntityClient('surcharges'),
    CustomSegment: createEntityClient('custom_segments'),
    ScheduledReport: createEntityClient('scheduled_reports'),
    PurchaseOrder: createEntityClient('purchase_orders'), // Map to vendor_orders if they are the same? Or separate table? Schema had vendor_orders.
    GoodsReceipt: createEntityClient('goods_receipts'),
    VendorContract: createEntityClient('vendor_contracts'),
    ApprovalRule: createEntityClient('approval_rules'),
    ApprovalHistory: createEntityClient('approval_history'),
    Invoice: createEntityClient('invoices'),
    AuditLog: createEntityClient('audit_logs'),
    VendorInvitation: createEntityClient('vendor_invitations'),
    CustomerInvoice: createEntityClient('customer_invoices'),
    VendorPayout: createEntityClient('vendor_payouts'),
    CompanySettings: createEntityClient('company_settings'),
    NotificationTemplate: createEntityClient('notification_templates')
  },
  auth: authAdapter,
  integrations: integrationsAdapter
};
