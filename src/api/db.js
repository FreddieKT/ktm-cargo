import { supabase } from './supabaseClient';
import * as Sentry from '@sentry/react';

const IS_PROD =
  typeof __APP_IS_PROD__ !== 'undefined'
    ? __APP_IS_PROD__
    : typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

/**
 * Map a Supabase/PostgREST error to a safe, user-facing Error.
 *
 * In **production** the thrown Error.message is always generic so that
 * table names, column hints, and constraint details are never leaked to
 * the client.  The full error is captured in Sentry for debugging.
 *
 * In **development** the detailed message is preserved for convenience.
 */
function toSafeError(error, operation, tableName, extraContext = {}) {
  // Always send full details to Sentry
  Sentry.captureException(error instanceof Error ? error : new Error(error?.message || 'Unknown DB error'), {
    tags: {
      component: 'db',
      operation,
      table: tableName,
      supabaseCode: error.code,
    },
    extra: {
      supabaseCode: error.code,
      supabaseDetails: error.details,
      supabaseHint: error.hint,
      supabaseMessage: error.message,
      ...extraContext,
    },
  });

  // Build the Error that will be thrown to the caller / UI
  const devMessage = error.details || error.hint || error.message || `Failed to ${operation} ${tableName}`;
  const prodMessage = `Failed to ${operation} record. Please try again or contact support.`;

  const safeError = new Error(IS_PROD ? prodMessage : devMessage);
  safeError.name = 'SupabaseError';
  safeError.code = error.code;

  // Keep details/hint accessible for programmatic handling but NOT in .message
  if (!IS_PROD) {
    safeError.details = error.details;
    safeError.hint = error.hint;
    safeError.originalMessage = error.message;
  }

  return safeError;
}

// Helper to parse sort string (e.g. "-created_date" -> { column: "created_date", ascending: false })
const parseSort = (sortString) => {
  if (!sortString) return null;
  const isDesc = sortString.startsWith('-');
  const column = isDesc ? sortString.substring(1) : sortString;
  return { column, ascending: !isDesc };
};

// Read-Only Entity Client Factory
export const createReadOnlyEntityClient = (tableName, selectFields = '*') => ({
  list: async (sortString, limit) => {
    let query = supabase.from(tableName).select(selectFields);

    if (sortString) {
      const { column, ascending } = parseSort(sortString);
      query = query.order(column, { ascending });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw toSafeError(error, 'list', tableName);
    return data || [];
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from(tableName)
      .select(selectFields)
      .eq('id', id)
      .single();
    if (error) throw toSafeError(error, 'get', tableName, { id });
    return data;
  },

  filter: async (filters, sortString, limit) => {
    let query = supabase.from(tableName).select(selectFields);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value.operator) {
        // Handle complex filter: { operator: 'gt', value: 10 }
        // operators: eq, neq, gt, gte, lt, lte, like, ilike, is, in
        if (typeof query[value.operator] === 'function') {
          query = query[value.operator](key, value.value);
        } else {
          console.warn(`Unknown filter operator: ${value.operator}`);
        }
      } else {
        // Default to equality for backward compatibility
        query = query.eq(key, value);
      }
    });

    if (sortString) {
      const { column, ascending } = parseSort(sortString);
      query = query.order(column, { ascending });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw toSafeError(error, 'filter', tableName, { filters });
    return data || [];
  },
});

// Full Entity Client Factory (Read + Write)
export const createEntityClient = (tableName, selectFields = '*') => ({
  ...createReadOnlyEntityClient(tableName, selectFields),

  create: async (data) => {
    const { data: created, error } = await supabase
      .from(tableName)
      .insert(data)
      .select(selectFields)
      .single();
    if (error) throw toSafeError(error, 'create', tableName, { data });
    return created;
  },

  update: async (id, updates) => {
    const { data: updated, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select(selectFields)
      .single();
    if (error) throw toSafeError(error, 'update', tableName, { id, updates });
    return updated;
  },

  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw toSafeError(error, 'delete', tableName, { id });
    return true;
  },
});

export const db = {
  profiles: createEntityClient('profiles', '*'),
  customers: createEntityClient('customers', '*'),
  shipments: createEntityClient('shipments', '*'),
  shoppingOrders: createEntityClient('shopping_orders', '*'),
  tasks: createEntityClient('tasks', '*'),
  expenses: createEntityClient('expenses', '*'),
  campaigns: createEntityClient('campaigns', '*'),
  feedback: createEntityClient('feedback', '*'),
  inventoryItems: createEntityClient('inventory_items', '*'),
  stockMovements: createEntityClient('stock_movements', '*'),
  notifications: createEntityClient('notifications', '*'),
  vendors: createEntityClient('vendors', '*'),
  vendorOrders: createEntityClient('vendor_orders', '*'),
  vendorPayments: createEntityClient('vendor_payments', '*'),
  servicePricing: createEntityClient('service_pricing', '*'),
  surcharges: createEntityClient('surcharges', '*'),
  customSegments: createEntityClient('custom_segments', '*'),
  scheduledReports: createEntityClient('scheduled_reports', '*'),
  purchaseOrders: createEntityClient('purchase_orders', '*'),
  goodsReceipts: createEntityClient('goods_receipts', '*'),
  vendorContracts: createEntityClient('vendor_contracts', '*'),
  approvalRules: createEntityClient('approval_rules', '*'),
  approvalHistory: createEntityClient('approval_history', '*'),
  auditLogs: createReadOnlyEntityClient('audit_logs', '*'),
  vendorInvitations: createEntityClient('vendor_invitations', '*'),
  customerInvoices: createEntityClient('customer_invoices', '*'),
  vendorPayouts: createEntityClient('vendor_payouts', '*'),
  companySettings: createEntityClient('company_settings', '*'),
  notificationTemplates: createEntityClient('notification_templates', '*'),
};
