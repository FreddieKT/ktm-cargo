import { differenceInDays } from 'date-fns';

/**
 * AI-powered customer segmentation engine
 * Analyzes customer data to automatically categorize into tiers
 */

export const VALUE_TIERS = {
  VIP: {
    key: 'vip',
    label: 'VIP',
    color: 'bg-purple-100 text-purple-800',
    minSpent: 100000,
    minShipments: 20,
  },
  HIGH: {
    key: 'high',
    label: 'High Value',
    color: 'bg-emerald-100 text-emerald-800',
    minSpent: 50000,
    minShipments: 10,
  },
  MEDIUM: {
    key: 'medium',
    label: 'Medium Value',
    color: 'bg-blue-100 text-blue-800',
    minSpent: 10000,
    minShipments: 3,
  },
  LOW: {
    key: 'low',
    label: 'Low Value',
    color: 'bg-slate-100 text-slate-800',
    minSpent: 0,
    minShipments: 0,
  },
};

export const BEHAVIORAL_SEGMENTS = {
  LOYAL: { key: 'loyal', label: 'Loyal', color: 'bg-amber-100 text-amber-800', icon: 'Crown' },
  AT_RISK: {
    key: 'at_risk',
    label: 'At Risk',
    color: 'bg-rose-100 text-rose-800',
    icon: 'AlertTriangle',
  },
  NEW: { key: 'new', label: 'New', color: 'bg-sky-100 text-sky-800', icon: 'Sparkles' },
  LAPSED: { key: 'lapsed', label: 'Lapsed', color: 'bg-gray-100 text-gray-800', icon: 'Clock' },
  RETURNING: {
    key: 'returning',
    label: 'Returning',
    color: 'bg-green-100 text-green-800',
    icon: 'RefreshCw',
  },
};

export function analyzeCustomer(customer, shipments) {
  const customerShipments = shipments.filter(
    (s) => s.customer_name === customer.name || s.customer_phone === customer.phone
  );

  const totalSpent = customerShipments.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const shipmentCount = customerShipments.length;
  const avgOrderValue = shipmentCount > 0 ? totalSpent / shipmentCount : 0;

  // Sort shipments by date
  const sortedShipments = [...customerShipments].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  );

  const lastShipmentDate =
    sortedShipments.length > 0 ? new Date(sortedShipments[0].created_date) : null;

  const firstShipmentDate =
    sortedShipments.length > 0
      ? new Date(sortedShipments[sortedShipments.length - 1].created_date)
      : null;

  const daysSinceLastOrder = lastShipmentDate
    ? differenceInDays(new Date(), lastShipmentDate)
    : 999;

  const customerAgeDays = firstShipmentDate
    ? differenceInDays(new Date(), firstShipmentDate)
    : differenceInDays(new Date(), new Date(customer.created_date || new Date()));

  // Calculate order frequency (orders per 30 days)
  const orderFrequency = customerAgeDays > 0 ? (shipmentCount / customerAgeDays) * 30 : 0;

  // Determine value tier
  let valueTier = VALUE_TIERS.LOW;
  if (totalSpent >= VALUE_TIERS.VIP.minSpent || shipmentCount >= VALUE_TIERS.VIP.minShipments) {
    valueTier = VALUE_TIERS.VIP;
  } else if (
    totalSpent >= VALUE_TIERS.HIGH.minSpent ||
    shipmentCount >= VALUE_TIERS.HIGH.minShipments
  ) {
    valueTier = VALUE_TIERS.HIGH;
  } else if (
    totalSpent >= VALUE_TIERS.MEDIUM.minSpent ||
    shipmentCount >= VALUE_TIERS.MEDIUM.minShipments
  ) {
    valueTier = VALUE_TIERS.MEDIUM;
  }

  // Determine behavioral segment
  let behavioralSegment = BEHAVIORAL_SEGMENTS.NEW;

  if (shipmentCount === 0 || customerAgeDays < 14) {
    behavioralSegment = BEHAVIORAL_SEGMENTS.NEW;
  } else if (daysSinceLastOrder > 60) {
    behavioralSegment = BEHAVIORAL_SEGMENTS.LAPSED;
  } else if (daysSinceLastOrder > 30 && valueTier !== VALUE_TIERS.LOW) {
    behavioralSegment = BEHAVIORAL_SEGMENTS.AT_RISK;
  } else if (orderFrequency >= 2 && shipmentCount >= 5) {
    behavioralSegment = BEHAVIORAL_SEGMENTS.LOYAL;
  } else if (daysSinceLastOrder < 14 && shipmentCount > 1) {
    behavioralSegment = BEHAVIORAL_SEGMENTS.RETURNING;
  }

  // Calculate customer score (0-100)
  const recencyScore = Math.max(0, 100 - daysSinceLastOrder * 2);
  const frequencyScore = Math.min(100, orderFrequency * 25);
  const monetaryScore = Math.min(100, totalSpent / 1000);
  const customerScore = Math.round(recencyScore * 0.3 + frequencyScore * 0.3 + monetaryScore * 0.4);

  // Recommended actions based on segment
  let recommendedAction = '';
  let campaignType = '';

  switch (behavioralSegment.key) {
    case 'new':
      recommendedAction = 'Send welcome offer and onboarding guide';
      campaignType = 'promotion';
      break;
    case 'lapsed':
      recommendedAction = 'Win-back campaign with special discount';
      campaignType = 'discount';
      break;
    case 'at_risk':
      recommendedAction = 'Re-engagement offer before they lapse';
      campaignType = 'discount';
      break;
    case 'loyal':
      recommendedAction = 'VIP appreciation and referral program';
      campaignType = 'referral';
      break;
    case 'returning':
      recommendedAction = 'Encourage loyalty with rewards program';
      campaignType = 'loyalty';
      break;
  }

  return {
    ...customer,
    // Metrics
    totalSpent,
    shipmentCount,
    avgOrderValue,
    orderFrequency,
    daysSinceLastOrder,
    customerAgeDays,
    customerScore,
    lastShipmentDate,
    firstShipmentDate,
    // Segments
    valueTier,
    behavioralSegment,
    // Marketing
    recommendedAction,
    campaignType,
  };
}

export function segmentCustomers(customers, shipments) {
  return customers.map((customer) => analyzeCustomer(customer, shipments));
}

export function getSegmentSummary(analyzedCustomers) {
  const summary = {
    byValueTier: {
      vip: { count: 0, revenue: 0, customers: [] },
      high: { count: 0, revenue: 0, customers: [] },
      medium: { count: 0, revenue: 0, customers: [] },
      low: { count: 0, revenue: 0, customers: [] },
    },
    byBehavior: {
      loyal: { count: 0, customers: [] },
      at_risk: { count: 0, customers: [] },
      new: { count: 0, customers: [] },
      lapsed: { count: 0, customers: [] },
      returning: { count: 0, customers: [] },
    },
    byType: {
      individual: { count: 0, customers: [] },
      online_shopper: { count: 0, customers: [] },
      sme_importer: { count: 0, customers: [] },
    },
    totals: {
      customers: analyzedCustomers.length,
      totalRevenue: 0,
      avgScore: 0,
    },
  };

  analyzedCustomers.forEach((c) => {
    // Value tier
    const tier = c.valueTier.key;
    summary.byValueTier[tier].count++;
    summary.byValueTier[tier].revenue += c.totalSpent;
    summary.byValueTier[tier].customers.push(c);

    // Behavioral segment
    const behavior = c.behavioralSegment.key;
    summary.byBehavior[behavior].count++;
    summary.byBehavior[behavior].customers.push(c);

    // Customer type
    const type = c.customer_type || 'individual';
    if (summary.byType[type]) {
      summary.byType[type].count++;
      summary.byType[type].customers.push(c);
    }

    // Totals
    summary.totals.totalRevenue += c.totalSpent;
    summary.totals.avgScore += c.customerScore;
  });

  summary.totals.avgScore =
    analyzedCustomers.length > 0
      ? Math.round(summary.totals.avgScore / analyzedCustomers.length)
      : 0;

  return summary;
}

export function getMarketingRecommendations(summary) {
  const recommendations = [];

  if (summary.byBehavior.at_risk.count > 0) {
    recommendations.push({
      priority: 'high',
      segment: 'At Risk',
      action: `Re-engage ${summary.byBehavior.at_risk.count} at-risk customers with a win-back campaign`,
      campaignType: 'discount',
      targetCount: summary.byBehavior.at_risk.count,
    });
  }

  if (summary.byBehavior.lapsed.count > 0) {
    recommendations.push({
      priority: 'medium',
      segment: 'Lapsed',
      action: `Win back ${summary.byBehavior.lapsed.count} lapsed customers with special offers`,
      campaignType: 'discount',
      targetCount: summary.byBehavior.lapsed.count,
    });
  }

  if (summary.byBehavior.loyal.count > 0) {
    recommendations.push({
      priority: 'medium',
      segment: 'Loyal',
      action: `Reward ${summary.byBehavior.loyal.count} loyal customers with referral incentives`,
      campaignType: 'referral',
      targetCount: summary.byBehavior.loyal.count,
    });
  }

  if (summary.byBehavior.new.count > 0) {
    recommendations.push({
      priority: 'medium',
      segment: 'New',
      action: `Onboard ${summary.byBehavior.new.count} new customers with welcome offers`,
      campaignType: 'promotion',
      targetCount: summary.byBehavior.new.count,
    });
  }

  return recommendations;
}
