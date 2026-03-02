export const ROLES = Object.freeze({
    ADMIN: 'admin',
    STAFF: 'staff',
    USER: 'user',
});

export const STAFF_ROLES = Object.freeze({
    FINANCE_LEAD: 'finance_lead',
    MARKETING_MANAGER: 'marketing_manager',
    OPERATIONS: 'operations',
    SUPPORT: 'support',
});

export const STATUSES = Object.freeze({
    PENDING: 'pending',
    COMPLETED: 'completed',
    IN_PROGRESS: 'in_progress',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    ACTIVE: 'active',
    DRAFT: 'draft',
});

export const PAYMENT_STATUSES = Object.freeze({
    PAID: 'paid',
    UNPAID: 'unpaid',
    PARTIAL: 'partial',
});

export const INVOICE_STATUSES = Object.freeze({
    DRAFT: 'draft',
    ISSUED: 'issued',
    SENT: 'sent',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
});

export const CUSTOMER_TYPES = Object.freeze({
    INDIVIDUAL: 'individual',
    ONLINE_SHOPPER: 'online_shopper',
    SME_IMPORTER: 'sme_importer',
});
