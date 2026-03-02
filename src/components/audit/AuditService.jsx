import { db } from '@/api/db';
import { auth } from '@/api/auth';

/**
 * Centralized Audit Trail Service
 * Logs all significant actions for compliance and tracking
 */

export async function logAuditEvent({
  action,
  entityType,
  entityId,
  entityReference,
  details,
  previousValue,
  newValue,
}) {
  let user = null;
  try {
    user = await auth.me();
  } catch (_e) {
    // User not logged in
  }

  const auditEntry = {
    action,
    entity_type: entityType,
    entity_id: entityId || '',
    entity_reference: entityReference || '',
    user_email: user?.email || 'system',
    user_name: user?.full_name || 'System',
    user_role: user?.role === 'admin' ? 'Managing Director' : user?.staff_role || 'unknown',
    details: details ? JSON.stringify(details) : '',
    previous_value: previousValue ? JSON.stringify(previousValue) : '',
    new_value: newValue ? JSON.stringify(newValue) : '',
  };

  return await db.auditLogs.create(auditEntry);
}

// Convenience functions for common actions

export const AuditActions = {
  // Purchase Order actions
  async poCreated(po) {
    return logAuditEvent({
      action: 'po_created',
      entityType: 'PurchaseOrder',
      entityId: po.id,
      entityReference: po.po_number,
      details: { vendor: po.vendor_name, amount: po.total_amount },
    });
  },

  async poApproved(po, comments) {
    return logAuditEvent({
      action: 'po_approved',
      entityType: 'PurchaseOrder',
      entityId: po.id,
      entityReference: po.po_number,
      details: { vendor: po.vendor_name, amount: po.total_amount, comments },
    });
  },

  async poRejected(po, comments) {
    return logAuditEvent({
      action: 'po_rejected',
      entityType: 'PurchaseOrder',
      entityId: po.id,
      entityReference: po.po_number,
      details: { vendor: po.vendor_name, amount: po.total_amount, comments },
    });
  },

  async poSubmitted(po, approver) {
    return logAuditEvent({
      action: 'po_submitted',
      entityType: 'PurchaseOrder',
      entityId: po.id,
      entityReference: po.po_number,
      details: { vendor: po.vendor_name, amount: po.total_amount, approver },
    });
  },

  // Invoice actions
  async invoiceCreated(invoice) {
    return logAuditEvent({
      action: 'invoice_created',
      entityType: 'Invoice',
      entityId: invoice.id,
      entityReference: invoice.invoice_number,
      details: { vendor: invoice.vendor_name, amount: invoice.total_amount, po: invoice.po_number },
    });
  },

  async invoicePaid(invoice) {
    return logAuditEvent({
      action: 'invoice_paid',
      entityType: 'Invoice',
      entityId: invoice.id,
      entityReference: invoice.invoice_number,
      details: { vendor: invoice.vendor_name, amount: invoice.total_amount },
    });
  },

  // Goods Receipt
  async goodsReceived(receipt, po) {
    return logAuditEvent({
      action: 'goods_received',
      entityType: 'GoodsReceipt',
      entityId: receipt.id,
      entityReference: receipt.receipt_number,
      details: {
        po_number: po?.po_number,
        vendor: receipt.vendor_name,
        value: receipt.total_value,
      },
    });
  },

  // User management
  async userRoleChanged(userId, userName, previousRole, newRole) {
    return logAuditEvent({
      action: 'user_role_changed',
      entityType: 'User',
      entityId: userId,
      entityReference: userName,
      previousValue: { role: previousRole },
      newValue: { role: newRole },
    });
  },

  async userInvited(email, name, role) {
    return logAuditEvent({
      action: 'user_invited',
      entityType: 'User',
      entityReference: email,
      details: { name, role },
    });
  },

  async userDeactivated(userId, userName) {
    return logAuditEvent({
      action: 'user_deactivated',
      entityType: 'User',
      entityId: userId,
      entityReference: userName,
    });
  },

  // Approval Rules
  async ruleCreated(rule) {
    return logAuditEvent({
      action: 'rule_created',
      entityType: 'ApprovalRule',
      entityId: rule.id,
      entityReference: rule.name,
      details: { type: rule.rule_type, auto_approve: rule.auto_approve },
    });
  },

  async ruleUpdated(rule, previousRule) {
    return logAuditEvent({
      action: 'rule_updated',
      entityType: 'ApprovalRule',
      entityId: rule.id,
      entityReference: rule.name,
      previousValue: previousRule,
      newValue: rule,
    });
  },

  async ruleDeleted(ruleId, ruleName) {
    return logAuditEvent({
      action: 'rule_deleted',
      entityType: 'ApprovalRule',
      entityId: ruleId,
      entityReference: ruleName,
    });
  },

  // Vendor
  async vendorCreated(vendor) {
    return logAuditEvent({
      action: 'vendor_created',
      entityType: 'Vendor',
      entityId: vendor.id,
      entityReference: vendor.name,
      details: { type: vendor.vendor_type },
    });
  },

  // Contract
  async contractCreated(contract) {
    return logAuditEvent({
      action: 'contract_created',
      entityType: 'VendorContract',
      entityId: contract.id,
      entityReference: contract.contract_number,
      details: { vendor: contract.vendor_name, value: contract.total_value },
    });
  },

  // Payment
  async paymentProcessed(payment) {
    return logAuditEvent({
      action: 'payment_processed',
      entityType: 'VendorPayment',
      entityId: payment.id,
      entityReference: payment.reference_number,
      details: { vendor: payment.vendor_name, amount: payment.total_amount },
    });
  },
};
