import { db } from '@/api/db';
import { format, addDays } from 'date-fns';

/**
 * Generates a unique invoice number for shopping orders
 */
function generateShoppingInvoiceNumber() {
  const prefix = 'SINV';
  const date = format(new Date(), 'yyyyMM');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${date}-${random}`;
}

/**
 * Creates a customer invoice from a shopping order
 */
export async function generateShoppingOrderInvoice(order, customer) {
  // Check if invoice already exists
  const existingInvoices = await db.customerInvoices.filter({
    order_id: order.id,
  });

  if (existingInvoices.length > 0) {
    console.log('Invoice already exists for order:', order.id);
    return { invoice: existingInvoices[0], isNew: false };
  }

  const productCost = parseFloat(order.actual_product_cost || order.estimated_product_cost) || 0;
  const commissionAmount = parseFloat(order.commission_amount) || 0;
  const shippingCost = parseFloat(order.shipping_cost) || 0;
  const totalAmount = parseFloat(order.total_amount) || 0;

  const invoice = await db.customerInvoices.create({
    invoice_number: generateShoppingInvoiceNumber(),
    invoice_type: 'shopping_order',
    order_id: order.id,
    order_number: order.order_number || '',
    customer_id: customer?.id || order.customer_id || '',
    customer_name: order.customer_name,
    customer_email: customer?.email || '',
    customer_phone: order.customer_phone || '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    service_type: 'shopping_service',
    weight_kg: order.actual_weight || order.estimated_weight || 0,
    price_per_kg: 110, // Shopping service rate
    shipping_amount: shippingCost,
    product_cost: productCost,
    commission_amount: commissionAmount,
    subtotal: totalAmount,
    tax_amount: 0,
    total_amount: totalAmount,
    payment_method: 'promptpay',
    status: order.payment_status === 'paid' ? 'paid' : 'issued',
    payment_date: order.payment_status === 'paid' ? format(new Date(), 'yyyy-MM-dd') : null,
    notes: `Shopping Order: ${order.order_number}\nProducts: ${order.product_details || order.product_links || ''}`,
  });

  // Create notification
  await db.notifications.create({
    type: 'invoice_generated',
    title: `Invoice Generated - ${invoice.invoice_number}`,
    message: `Invoice for shopping order ${order.order_number} has been generated. Amount: ฿${totalAmount.toLocaleString()}`,
    reference_type: 'invoice',
    reference_id: invoice.id,
    status: 'unread',
  });

  return { invoice, isNew: true };
}

/**
 * Process shopping order for invoicing when delivered + paid
 */
export async function processShoppingOrderInvoicing(order, customers) {
  // Only process if order is delivered AND paid
  if (order.status !== 'delivered' || order.payment_status !== 'paid') {
    return { invoice: null, skipped: true, reason: 'Not delivered or not paid' };
  }

  // Find customer
  const customer = customers?.find(
    (c) =>
      c.id === order.customer_id ||
      c.name === order.customer_name ||
      c.phone === order.customer_phone
  );

  const result = await generateShoppingOrderInvoice(order, customer);

  return {
    invoice: result.invoice,
    skipped: false,
    isNew: result.isNew,
  };
}

/**
 * Batch process multiple orders for invoicing
 */
export async function batchProcessShoppingInvoices(orders, customers) {
  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
    invoices: [],
  };

  for (const order of orders) {
    try {
      const result = await processShoppingOrderInvoicing(order, customers);
      if (result.skipped) {
        results.skipped++;
      } else {
        results.processed++;
        if (result.invoice) {
          results.invoices.push(result.invoice);
        }
      }
    } catch (error) {
      console.error('Error processing order:', order.id, error);
      results.errors++;
    }
  }

  return results;
}

/**
 * Calculate profit for a shopping order
 */
export function calculateShoppingOrderProfit(order) {
  const revenue = parseFloat(order.total_amount) || 0;
  const vendorCost = parseFloat(order.vendor_cost) || 0;
  const productCost = parseFloat(order.actual_product_cost || order.estimated_product_cost) || 0;

  // Profit = Total Amount - Vendor Cost - Product Cost
  // (Commission and shipping are part of total_amount, vendor_cost is what we pay to carrier)
  const grossProfit = revenue - vendorCost - productCost;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    revenue,
    vendorCost,
    productCost,
    grossProfit,
    margin: margin.toFixed(1),
  };
}
