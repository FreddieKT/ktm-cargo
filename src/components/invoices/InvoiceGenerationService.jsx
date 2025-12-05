import { db } from '@/api/db';
import { format, addDays } from 'date-fns';
import {
  triggerInvoiceGeneratedAlert,
  triggerVendorPayoutAlert,
} from '@/components/notifications/NotificationService';

/**
 * Generates a unique invoice number
 */
function generateInvoiceNumber() {
  const prefix = 'INV';
  const date = format(new Date(), 'yyyyMM');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${date}-${random}`;
}

/**
 * Generates a unique payout reference number
 */
function generatePayoutNumber() {
  const prefix = 'PAY';
  const date = format(new Date(), 'yyyyMM');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${date}-${random}`;
}

/**
 * Creates a customer invoice from a delivered and paid shipment
 */
export async function generateCustomerInvoice(shipment, customer) {
  // Check if invoice already exists for this shipment
  const existingInvoices = await db.customerInvoices.filter({
    shipment_id: shipment.id,
  });

  if (existingInvoices.length > 0) {
    console.log('Invoice already exists for shipment:', shipment.id);
    return existingInvoices[0];
  }

  const weight = parseFloat(shipment.weight_kg) || 0;
  const pricePerKg = parseFloat(shipment.price_per_kg) || 0;
  const shippingAmount = weight * pricePerKg;
  const insuranceAmount = parseFloat(shipment.insurance_amount) || 0;
  const packagingFee = parseFloat(shipment.packaging_fee) || 0;
  const subtotal = shippingAmount + insuranceAmount + packagingFee;
  const taxAmount = 0; // Can be configured if needed
  const totalAmount = subtotal + taxAmount;

  const invoice = await db.customerInvoices.create({
    invoice_number: generateInvoiceNumber(),
    invoice_type: 'shipment',
    shipment_id: shipment.id,
    tracking_number: shipment.tracking_number || '',
    customer_id: customer?.id || shipment.customer_id || '',
    customer_name: shipment.customer_name,
    customer_email: customer?.email || '',
    customer_phone: shipment.customer_phone || '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    service_type: shipment.service_type,
    weight_kg: weight,
    price_per_kg: pricePerKg,
    shipping_amount: shippingAmount,
    insurance_amount: insuranceAmount,
    packaging_fee: packagingFee,
    subtotal: subtotal,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    payment_method: shipment.payment_method || 'promptpay',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'issued',
    notes: shipment.items_description || '',
  });

  // Trigger notification for invoice generation
  triggerInvoiceGeneratedAlert(invoice).catch(console.error);

  return invoice;
}

/**
 * Creates a vendor payout record from a delivered shipment
 */
export async function generateVendorPayout(shipment, invoice, vendorOrder, vendor) {
  // Check if payout already exists for this shipment
  const existingPayouts = await db.vendorPayouts.filter({
    shipment_id: shipment.id,
  });

  if (existingPayouts.length > 0) {
    console.log('Payout already exists for shipment:', shipment.id);
    return existingPayouts[0];
  }

  const weight = parseFloat(shipment.weight_kg) || 0;
  const costPerKg = parseFloat(shipment.cost_basis) || 0;
  const costAmount = weight * costPerKg;
  const commissionRate = 0; // Can be configured per vendor
  const commissionAmount = costAmount * (commissionRate / 100);
  const totalPayout = costAmount + commissionAmount;
  const profitAmount = (shipment.total_amount || 0) - totalPayout;

  const payout = await db.vendorPayouts.create({
    payout_number: generatePayoutNumber(),
    shipment_id: shipment.id,
    tracking_number: shipment.tracking_number || '',
    invoice_id: invoice?.id || '',
    vendor_id: vendor?.id || vendorOrder?.vendor_id || '',
    vendor_name: vendor?.name || vendorOrder?.vendor_name || 'Carrier Service',
    service_type: shipment.service_type,
    weight_kg: weight,
    cost_per_kg: costPerKg,
    cost_amount: costAmount,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    total_payout: totalPayout,
    profit_amount: profitAmount,
    due_date: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    status: 'pending',
    payment_method: 'bank_transfer',
    notes: `Payout for shipment ${shipment.tracking_number || shipment.id}`,
  });

  // Trigger notification for vendor payout
  triggerVendorPayoutAlert(payout).catch(console.error);

  return payout;
}

/**
 * Main function to generate both invoice and payout when shipment is delivered + paid
 */
export async function processShipmentForInvoicing(shipment, customers, vendorOrders, vendors) {
  // Only process if shipment is delivered AND paid
  if (shipment.status !== 'delivered' || shipment.payment_status !== 'paid') {
    return { invoice: null, payout: null, skipped: true };
  }

  // Find customer
  const customer = customers?.find(
    (c) =>
      c.id === shipment.customer_id ||
      c.name === shipment.customer_name ||
      c.phone === shipment.customer_phone
  );

  // Generate customer invoice
  const invoice = await generateCustomerInvoice(shipment, customer);

  // Find related vendor order and vendor
  const vendorOrder = vendorOrders?.find((vo) => vo.shipment_id === shipment.id);
  const vendor = vendorOrder ? vendors?.find((v) => v.id === vendorOrder.vendor_id) : null;

  // Generate vendor payout
  const payout = await generateVendorPayout(shipment, invoice, vendorOrder, vendor);

  return { invoice, payout, skipped: false };
}
