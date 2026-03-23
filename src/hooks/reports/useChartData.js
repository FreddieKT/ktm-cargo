import { useMemo } from 'react';
import {
  eachDayOfInterval,
  format,
  parseISO,
  isWithinInterval,
  subMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

export function useChartData(data, filteredData, dateRange) {
  const { shipments, shoppingOrders, customers, campaigns, expenses, filteredExpenses } = {
    ...data,
    ...filteredData,
  };

  // Revenue by service type
  const serviceChartData = useMemo(() => {
    const revenueByService = new Map();
    (filteredData.filteredShipments || []).forEach((s) => {
      const type = s.service_type || 'other';
      revenueByService.set(type, (revenueByService.get(type) || 0) + (s.total_amount || 0));
    });
    return Array.from(revenueByService.entries()).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
    }));
  }, [filteredData.filteredShipments]);

  // Daily revenue trend
  const dailyRevenue = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const shipmentRev = shipments
        .filter((s) => s.created_date?.startsWith(dateStr))
        .reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const orderRev = shoppingOrders
        .filter((o) => o.created_date?.startsWith(dateStr))
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      return {
        date: format(date, 'MMM d'),
        revenue: shipmentRev + orderRev,
        shipments: shipmentRev,
        shopping: orderRev,
      };
    });
  }, [shipments, shoppingOrders, dateRange]);

  // Customer acquisition by segment
  const customersBySegment = useMemo(() => {
    const segments = { individual: 0, online_shopper: 0, sme_importer: 0 };
    customers.forEach((c) => {
      if (!c.created_date) return;
      const date = parseISO(c.created_date);
      if (isWithinInterval(date, { start: dateRange.from, end: dateRange.to })) {
        segments[c.customer_type || 'individual']++;
      }
    });
    return [
      { name: 'Individual', value: segments.individual, color: '#3b82f6' },
      { name: 'Online Shopper', value: segments.online_shopper, color: '#8b5cf6' },
      { name: 'SME Importer', value: segments.sme_importer, color: '#f59e0b' },
    ];
  }, [customers, dateRange]);

  // Monthly comparison
  const monthlyComparison = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      const monthShipments = shipments.filter((s) => {
        if (!s.created_date) return false;
        const date = parseISO(s.created_date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });
      const monthOrders = shoppingOrders.filter((o) => {
        if (!o.created_date) return false;
        const date = parseISO(o.created_date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });
      months.push({
        month: format(monthStart, 'MMM'),
        revenue:
          monthShipments.reduce((sum, s) => sum + (s.total_amount || 0), 0) +
          monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        shipments: monthShipments.length,
        orders: monthOrders.length,
      });
    }
    return months;
  }, [shipments, shoppingOrders]);

  // Campaign performance
  const campaignPerformance = campaigns.map((c) => ({
    name: c.name?.substring(0, 15) || 'Campaign',
    sent: c.sent_count || 0,
    conversions: c.conversion_count || 0,
    rate: c.sent_count > 0 ? (((c.conversion_count || 0) / c.sent_count) * 100).toFixed(1) : 0,
  }));

  // Expenses by category
  const expenseChartData = useMemo(() => {
    const expensesByCategoryMap = new Map();
    (filteredExpenses || []).forEach((e) => {
      const cat = e.category || 'other';
      expensesByCategoryMap.set(cat, (expensesByCategoryMap.get(cat) || 0) + (e.amount || 0));
    });
    return Array.from(expensesByCategoryMap.entries()).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
    }));
  }, [filteredExpenses]);

  return {
    serviceChartData,
    dailyRevenue,
    customersBySegment,
    monthlyComparison,
    campaignPerformance,
    expenseChartData,
  };
}

export { format, subDays } from 'date-fns';
