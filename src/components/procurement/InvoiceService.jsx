import { base44 } from '@/api/base44Client';
import { addDays, format } from 'date-fns';
import { AuditActions } from '@/components/audit/AuditService';

const PAYMENT_TERMS_DAYS = {
  immediate: 0,
  net_15: 15,
  net_30: 30,
  net_60: 60
};

/**
 * Generate invoice number
 */
function generateInvoiceNumber() {
  const date = new Date();
  const prefix = 'INV';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
}

/**
 * Calculate due date based on payment terms
 */
function calculateDueDate(invoiceDate, paymentTerms) {
  const days = PAYMENT_TERMS_DAYS[paymentTerms] || 30;
  return format(addDays(new Date(invoiceDate), days), 'yyyy-MM-dd');
}

/**
 * Auto-generate invoice from PO and Goods Receipt
 */
export async function generateInvoiceFromReceipt(purchaseOrder, goodsReceipt, vendor) {
  // Check if invoice already exists for this receipt
  const existingInvoices = await base44.entities.Invoice.filter({ receipt_id: goodsReceipt.id });
  if (existingInvoices.length > 0) {
    return { status: 'exists', invoice: existingInvoices[0] };
  }

  // Parse received items
  let receivedItems = [];
  try {
    receivedItems = JSON.parse(goodsReceipt.items_received || '[]');
  } catch (e) {
    receivedItems = [];
  }

  // Parse PO items for pricing
  let poItems = [];
  try {
    poItems = JSON.parse(purchaseOrder.items || '[]');
  } catch (e) {
    poItems = [];
  }

  // Build invoice items from received goods
  const invoiceItems = receivedItems.map(item => {
    const poItem = poItems.find(p => p.name === item.item_name) || {};
    const quantity = item.received_qty || 0;
    const unitPrice = poItem.unit_price || 0;
    return {
      name: item.item_name,
      quantity,
      unit_price: unitPrice,
      total: quantity * unitPrice
    };
  });

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 7; // Default VAT
  const taxAmount = Math.round(subtotal * taxRate / 100);
  const shippingCost = purchaseOrder.shipping_cost || 0;
  const totalAmount = subtotal + taxAmount + shippingCost;

  const invoiceDate = format(new Date(), 'yyyy-MM-dd');
  const paymentTerms = vendor?.payment_terms || 'net_30';

  const invoice = await base44.entities.Invoice.create({
    invoice_number: generateInvoiceNumber(),
    po_id: purchaseOrder.id,
    po_number: purchaseOrder.po_number,
    receipt_id: goodsReceipt.id,
    receipt_number: goodsReceipt.receipt_number,
    vendor_id: purchaseOrder.vendor_id,
    vendor_name: purchaseOrder.vendor_name,
    invoice_date: invoiceDate,
    due_date: calculateDueDate(invoiceDate, paymentTerms),
    items: JSON.stringify(invoiceItems),
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    shipping_cost: shippingCost,
    total_amount: totalAmount,
    payment_terms: paymentTerms,
    status: 'pending',
    notes: `Auto-generated from GR: ${goodsReceipt.receipt_number}`
  });

  // Create notification
  await base44.entities.Notification.create({
    type: 'system',
    title: 'New Invoice Generated',
    message: `Invoice ${invoice.invoice_number} for ฿${totalAmount.toLocaleString()} has been generated for PO ${purchaseOrder.po_number}.`,
    priority: 'medium',
    reference_type: 'task',
    reference_id: invoice.id,
    status: 'unread'
  });

  // Audit log
  AuditActions.invoiceCreated(invoice);

  return { status: 'created', invoice };
}

/**
 * Mark invoice as paid
 */
export async function markInvoicePaid(invoiceId) {
  const invoice = await base44.entities.Invoice.update(invoiceId, {
    status: 'paid',
    payment_date: format(new Date(), 'yyyy-MM-dd')
  });
  
  // Audit log
  AuditActions.invoicePaid(invoice);
}

/**
 * Check and update overdue invoices
 */
export async function checkOverdueInvoices() {
  const pendingInvoices = await base44.entities.Invoice.filter({ status: 'pending' });
  const today = new Date();
  
  for (const invoice of pendingInvoices) {
    if (invoice.due_date && new Date(invoice.due_date) < today) {
      await base44.entities.Invoice.update(invoice.id, { status: 'overdue' });
    }
  }
}