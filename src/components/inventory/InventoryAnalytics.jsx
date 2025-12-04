import { differenceInDays, subDays } from 'date-fns';

/**
 * Calculate demand analytics and reorder suggestions
 */
export function analyzeInventoryDemand(item, movements, shipments) {
  const last30Days = subDays(new Date(), 30);
  const last90Days = subDays(new Date(), 90);

  // Filter movements for this item
  const itemMovements = movements.filter((m) => m.item_id === item.id);

  // Calculate usage in last 30 days
  const recentUsage = itemMovements
    .filter((m) => m.movement_type === 'out' && new Date(m.created_date) >= last30Days)
    .reduce((sum, m) => sum + (m.quantity || 0), 0);

  // Calculate usage in last 90 days
  const historicalUsage = itemMovements
    .filter((m) => m.movement_type === 'out' && new Date(m.created_date) >= last90Days)
    .reduce((sum, m) => sum + (m.quantity || 0), 0);

  // Daily average usage
  const dailyUsage30 = recentUsage / 30;
  const dailyUsage90 = historicalUsage / 90;
  const avgDailyUsage = (dailyUsage30 + dailyUsage90) / 2;

  // Predict demand based on shipment trends
  const recentShipments = shipments.filter((s) => new Date(s.created_date) >= last30Days).length;
  const shipmentTrend = recentShipments > shipments.length / 3 ? 1.2 : 1.0; // 20% increase if trending up

  const adjustedDailyUsage = avgDailyUsage * shipmentTrend;

  // Calculate suggested reorder point (lead time * daily usage + safety stock)
  const safetyStock = Math.ceil(adjustedDailyUsage * 7); // 7 days safety
  const suggestedReorderPoint = Math.ceil(
    (item.lead_time_days || 7) * adjustedDailyUsage + safetyStock
  );

  // Calculate suggested reorder quantity (30 days supply)
  const suggestedReorderQty = Math.ceil(adjustedDailyUsage * 30);

  // Days until stockout at current rate
  const daysUntilStockout =
    adjustedDailyUsage > 0 ? Math.floor(item.current_stock / adjustedDailyUsage) : 999;

  // Urgency level
  let urgency = 'normal';
  if (item.current_stock <= 0) urgency = 'critical';
  else if (daysUntilStockout <= item.lead_time_days) urgency = 'high';
  else if (item.current_stock <= item.reorder_point) urgency = 'medium';

  return {
    dailyUsage: Math.round(adjustedDailyUsage * 10) / 10,
    weeklyUsage: Math.round(adjustedDailyUsage * 7),
    monthlyUsage: Math.round(adjustedDailyUsage * 30),
    daysUntilStockout,
    suggestedReorderPoint,
    suggestedReorderQty,
    urgency,
    trend: shipmentTrend > 1 ? 'increasing' : 'stable',
    recentUsage,
    historicalUsage,
  };
}

export function getStockStatus(item) {
  if (item.current_stock <= 0)
    return { status: 'out_of_stock', color: 'bg-rose-100 text-rose-800' };
  if (item.current_stock <= item.reorder_point)
    return { status: 'low_stock', color: 'bg-amber-100 text-amber-800' };
  return { status: 'in_stock', color: 'bg-emerald-100 text-emerald-800' };
}

export function getLowStockItems(items) {
  return items.filter((item) => item.current_stock <= item.reorder_point);
}

export function getReorderAlerts(items, movements, shipments) {
  return items
    .map((item) => ({
      item,
      analytics: analyzeInventoryDemand(item, movements, shipments),
    }))
    .filter(({ analytics }) => analytics.urgency !== 'normal')
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2 };
      return urgencyOrder[a.analytics.urgency] - urgencyOrder[b.analytics.urgency];
    });
}
