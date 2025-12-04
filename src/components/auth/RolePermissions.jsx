/**
 * Role-Based Access Control (RBAC) Configuration
 */

export const ROLES = {
  MANAGING_DIRECTOR: 'managing_director',
  FINANCE_LEAD: 'finance_lead',
  MARKETING_MANAGER: 'marketing_manager',
};

export const ROLE_LABELS = {
  managing_director: 'Managing Director',
  finance_lead: 'Finance Lead',
  marketing_manager: 'Marketing Manager',
};

export const ROLE_COLORS = {
  managing_director: 'bg-purple-100 text-purple-800',
  finance_lead: 'bg-emerald-100 text-emerald-800',
  marketing_manager: 'bg-blue-100 text-blue-800',
};

// Define permissions for each module/feature
export const PERMISSIONS = {
  // Dashboard
  view_dashboard: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD, ROLES.MARKETING_MANAGER],

  // Shipments
  view_shipments: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD, ROLES.MARKETING_MANAGER],
  manage_shipments: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],

  // Shopping Orders
  view_shopping_orders: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD, ROLES.MARKETING_MANAGER],
  manage_shopping_orders: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],

  // Customers
  view_customers: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD, ROLES.MARKETING_MANAGER],
  manage_customers: [ROLES.MANAGING_DIRECTOR, ROLES.MARKETING_MANAGER],

  // Segments & Campaigns
  view_campaigns: [ROLES.MANAGING_DIRECTOR, ROLES.MARKETING_MANAGER],
  manage_campaigns: [ROLES.MANAGING_DIRECTOR, ROLES.MARKETING_MANAGER],

  // Feedback
  view_feedback: [ROLES.MANAGING_DIRECTOR, ROLES.MARKETING_MANAGER],

  // Inventory
  view_inventory: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],
  manage_inventory: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],

  // Procurement
  view_procurement: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],
  manage_procurement: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],
  approve_purchase_orders: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],

  // Vendors
  view_vendors: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],
  manage_vendors: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],

  // Tasks
  view_tasks: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD, ROLES.MARKETING_MANAGER],
  manage_tasks: [ROLES.MANAGING_DIRECTOR],

  // Reports
  view_reports: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD, ROLES.MARKETING_MANAGER],
  export_reports: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],

  // Settings
  view_settings: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD, ROLES.MARKETING_MANAGER],
  manage_settings: [ROLES.MANAGING_DIRECTOR],
  manage_pricing: [ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_LEAD],
  invite_staff: [ROLES.MANAGING_DIRECTOR],
};

// Navigation items with required permissions
export const NAV_PERMISSIONS = {
  Dashboard: 'view_dashboard',
  Shipments: 'view_shipments',
  ShipmentDocuments: 'view_shipments',
  ShoppingOrders: 'view_shopping_orders',
  Customers: 'view_customers',
  CustomerSegments: 'view_campaigns',
  FeedbackAnalytics: 'view_feedback',
  Inventory: 'view_inventory',
  Procurement: 'view_procurement',
  Vendors: 'view_vendors',
  Tasks: 'view_tasks',
  Reports: 'view_reports',
  PriceCalculator: 'view_dashboard',
  Settings: 'view_settings',
};

/**
 * Check if user has permission
 */
export function hasPermission(user, permission) {
  if (!user) return false;

  // Admin role always has full access
  if (user.role === 'admin') return true;

  const staffRole = user.staff_role || ROLES.MARKETING_MANAGER;
  const allowedRoles = PERMISSIONS[permission] || [];

  return allowedRoles.includes(staffRole);
}

/**
 * Check if user can access a page
 */
export function canAccessPage(user, pageName) {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const requiredPermission = NAV_PERMISSIONS[pageName];
  if (!requiredPermission) return true;

  return hasPermission(user, requiredPermission);
}

/**
 * Get user's effective role label
 */
export function getUserRoleLabel(user) {
  if (!user) return '';
  if (user.role === 'admin') return 'Managing Director';
  return ROLE_LABELS[user.staff_role] || 'Staff';
}
