import { base44 } from '@/api/base44Client';

export async function sendFeedbackRequest(shipment, customer) {
  if (!customer?.email) return false;

  const feedbackLink = `${window.location.origin}/Feedback?shipment=${shipment.id}`;
  
  const emailBody = `
Dear ${customer.name || shipment.customer_name},

Your shipment has been delivered! 🎉

Tracking Number: ${shipment.tracking_number}
Delivered: ${new Date().toLocaleDateString()}

We'd love to hear about your experience. Your feedback helps us improve our service.

Please take a moment to rate your experience:
${feedbackLink}

Thank you for choosing BKK-YGN Cargo & Shopping Services!

Best regards,
The BKK-YGN Team
  `;

  try {
    await base44.integrations.Core.SendEmail({
      to: customer.email,
      subject: `How was your delivery? Rate your experience - ${shipment.tracking_number}`,
      body: emailBody
    });

    // Create pending feedback record
    await base44.entities.Feedback.create({
      shipment_id: shipment.id,
      customer_id: customer.id || '',
      customer_name: customer.name || shipment.customer_name,
      customer_email: customer.email,
      service_type: shipment.service_type,
      status: 'pending'
    });

    return true;
  } catch (error) {
    console.error('Failed to send feedback request:', error);
    return false;
  }
}

export async function checkAndRequestFeedback(shipment, customers) {
  // Find customer by name or phone
  const customer = customers.find(c => 
    c.name === shipment.customer_name || c.phone === shipment.customer_phone
  );
  
  if (customer?.email) {
    return sendFeedbackRequest(shipment, customer);
  }
  return false;
}