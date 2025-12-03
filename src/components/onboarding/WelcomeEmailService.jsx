import { base44 } from '@/api/base44Client';

const emailTemplates = {
  welcome: {
    subject: "Welcome to BKK-YGN Cargo & Shopping Services! 🎉",
    getBody: (customer) => `
Dear ${customer.name},

Welcome to Bangkok-Yangon Cargo & Shopping Services! We're thrilled to have you as part of our community.

Your account has been created successfully. Here's what you can do:

🚚 SHIP WITH CONFIDENCE
- Fast cargo delivery from Bangkok to Yangon (3-5 days)
- Express shipping available (1-2 days)
- Real-time tracking for every shipment

💰 COMPETITIVE RATES
- Cargo shipping from ฿85/kg
- Personal shopping service with 10% commission
- Volume discounts for regular shippers

📱 EASY TO USE
- Get instant quotes with our Price Calculator
- Track shipments in real-time
- Download shipping documents anytime

Your unique referral code: ${customer.referral_code || 'WELCOME2024'}
Share this with friends and earn rewards!

Ready to ship? Contact us or visit our app to get started.

Best regards,
The BKK-YGN Cargo Team
    `
  },

  calculator_guide: {
    subject: "📊 Get Instant Shipping Quotes - Calculator Guide",
    getBody: (customer) => `
Hi ${customer.name},

Want to know exactly how much your shipment will cost? Our Price Calculator makes it easy!

HOW TO USE THE CALCULATOR:
━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Choose Your Service
- Cargo (Small/Medium/Large packages)
- Shopping Service (we buy & ship for you)
- Express (fastest delivery)

Step 2: Enter Package Weight
- Just input the weight in kg
- Prices update instantly

Step 3: Add Optional Services
- Insurance (3% of shipping cost)
- Professional packing (฿50-200)

Step 4: View Your Quote
- See detailed cost breakdown
- Check THB & MMK prices
- View estimated profit margin

💡 PRO TIP: Use the exchange rate slider to adjust THB-MMK conversion for accurate local pricing!

Try it now: [Open Calculator]

Questions? Reply to this email anytime.

Best,
BKK-YGN Cargo Team
    `
  },

  benefits_rewards: {
    subject: "🎁 Unlock Exclusive Benefits as You Ship More!",
    getBody: (customer) => `
Hello ${customer.name},

Great news! As a ${customer.customer_type === 'sme_importer' ? 'business' : 'valued'} customer, you're automatically enrolled in our rewards program.

YOUR CUSTOMER TIER BENEFITS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥉 NEW CUSTOMER (Current)
- Welcome discount on first shipment
- Access to all standard services
- Email support

🥈 REGULAR (After 5 shipments)
- 5% discount on all orders
- Priority customer support
- Early access to promotions

🥇 PREMIUM (After 20 shipments)
- 10% discount on all orders
- Priority handling & faster processing
- Dedicated account manager

💎 VIP (After 50 shipments)
- 15% discount on all orders
- Free insurance on shipments
- 24/7 VIP support line

CURRENT PROMOTIONS:
- First-time shipper: 10% off your first cargo shipment
- Refer a friend: Earn ฿100 credit for each referral
- Bulk shipping: Extra 5% off for 10+ kg shipments

Start shipping today to climb the rewards ladder!

Best regards,
BKK-YGN Cargo Team
    `
  },

  getting_started: {
    subject: "✅ Your Complete Guide to Getting Started",
    getBody: (customer) => `
Hi ${customer.name},

Here's everything you need to know to start shipping with us:

STEP-BY-STEP GUIDE:
━━━━━━━━━━━━━━━━━━━

1️⃣ CREATE A SHIPMENT
- Go to Shipments → New Shipment
- Fill in your details and package info
- Get your tracking number instantly

2️⃣ PREPARE YOUR PACKAGE
- Pack items securely (or request our packing service)
- Label with your tracking number
- Schedule pickup or drop off in Bangkok

3️⃣ TRACK YOUR SHIPMENT
- Receive updates at every stage
- View status: Pending → Picked Up → In Transit → Customs → Delivered

4️⃣ RECEIVE IN YANGON
- Get notified when package arrives
- Collect from our Yangon office or request delivery

IMPORTANT CONTACTS:
- Bangkok Office: +66-XX-XXX-XXXX
- Yangon Office: +95-XX-XXX-XXXX
- Email: support@bkk-ygn-cargo.com

USEFUL LINKS:
- Price Calculator: Get instant quotes
- Documents: Download invoices & waybills
- FAQ: Common questions answered

We're here to help! Reply to this email with any questions.

Happy shipping! 🚀
BKK-YGN Cargo Team
    `
  }
};

export async function sendWelcomeEmailSeries(customer) {
  const emailSequence = [
    { template: 'welcome', delay: 0 },
    { template: 'calculator_guide', delay: 1 }, // Day 1
    { template: 'benefits_rewards', delay: 3 }, // Day 3
    { template: 'getting_started', delay: 5 }   // Day 5
  ];

  // Send first email immediately
  const welcomeTemplate = emailTemplates.welcome;
  
  try {
    await base44.integrations.Core.SendEmail({
      to: customer.email,
      subject: welcomeTemplate.subject,
      body: welcomeTemplate.getBody(customer)
    });
    
    console.log(`Welcome email sent to ${customer.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

export async function sendOnboardingEmail(customer, templateKey) {
  const template = emailTemplates[templateKey];
  if (!template || !customer.email) return false;

  try {
    await base44.integrations.Core.SendEmail({
      to: customer.email,
      subject: template.subject,
      body: template.getBody(customer)
    });
    return true;
  } catch (error) {
    console.error(`Failed to send ${templateKey} email:`, error);
    return false;
  }
}

export { emailTemplates };