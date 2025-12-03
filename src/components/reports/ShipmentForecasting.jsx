import { subMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval, addMonths } from 'date-fns';

/**
 * AI-powered shipment forecasting engine
 * Analyzes historical data to predict future volumes and revenue
 */

export function analyzeHistoricalTrends(shipments, orders) {
  const now = new Date();
  const monthlyData = [];
  
  // Get last 12 months of data
  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    
    const monthShipments = shipments.filter(s => {
      if (!s.created_date) return false;
      const date = new Date(s.created_date);
      return date >= monthStart && date <= monthEnd;
    });
    
    const monthOrders = orders.filter(o => {
      if (!o.created_date) return false;
      const date = new Date(o.created_date);
      return date >= monthStart && date <= monthEnd;
    });
    
    const revenue = monthShipments.reduce((sum, s) => sum + (s.total_amount || 0), 0) +
                    monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const weight = monthShipments.reduce((sum, s) => sum + (s.weight_kg || 0), 0);
    
    monthlyData.push({
      month: format(monthStart, 'MMM yyyy'),
      monthIndex: i,
      shipments: monthShipments.length,
      orders: monthOrders.length,
      totalVolume: monthShipments.length + monthOrders.length,
      revenue,
      weight,
      avgOrderValue: (monthShipments.length + monthOrders.length) > 0 
        ? revenue / (monthShipments.length + monthOrders.length) 
        : 0,
    });
  }
  
  return monthlyData;
}

export function calculateSeasonality(historicalData) {
  // Simple seasonality based on month patterns
  const seasonalFactors = {};
  const monthGroups = {};
  
  historicalData.forEach(d => {
    const monthName = d.month.split(' ')[0];
    if (!monthGroups[monthName]) monthGroups[monthName] = [];
    monthGroups[monthName].push(d.totalVolume);
  });
  
  const overallAvg = historicalData.reduce((s, d) => s + d.totalVolume, 0) / historicalData.length || 1;
  
  Object.keys(monthGroups).forEach(month => {
    const monthAvg = monthGroups[month].reduce((s, v) => s + v, 0) / monthGroups[month].length;
    seasonalFactors[month] = monthAvg / overallAvg || 1;
  });
  
  return seasonalFactors;
}

export function calculateGrowthRate(historicalData) {
  if (historicalData.length < 3) return 0;
  
  // Compare recent 3 months vs previous 3 months
  const recent = historicalData.slice(-3);
  const previous = historicalData.slice(-6, -3);
  
  const recentAvg = recent.reduce((s, d) => s + d.totalVolume, 0) / 3;
  const previousAvg = previous.reduce((s, d) => s + d.totalVolume, 0) / 3 || 1;
  
  return (recentAvg - previousAvg) / previousAvg;
}

export function generateForecast(shipments, orders, monthsAhead = 6) {
  const historicalData = analyzeHistoricalTrends(shipments, orders);
  const seasonality = calculateSeasonality(historicalData);
  const growthRate = calculateGrowthRate(historicalData);
  
  // Base forecast on recent average with growth and seasonality
  const recentMonths = historicalData.slice(-3);
  const baseVolume = recentMonths.reduce((s, d) => s + d.totalVolume, 0) / 3;
  const baseRevenue = recentMonths.reduce((s, d) => s + d.revenue, 0) / 3;
  const baseWeight = recentMonths.reduce((s, d) => s + d.weight, 0) / 3;
  
  const forecasts = [];
  const now = new Date();
  
  for (let i = 1; i <= monthsAhead; i++) {
    const forecastDate = addMonths(now, i);
    const monthName = format(forecastDate, 'MMM');
    const seasonalFactor = seasonality[monthName] || 1;
    
    // Apply growth rate compounded monthly + seasonality
    const growthFactor = Math.pow(1 + (growthRate / 12), i);
    
    const predictedVolume = Math.round(baseVolume * growthFactor * seasonalFactor);
    const predictedRevenue = Math.round(baseRevenue * growthFactor * seasonalFactor);
    const predictedWeight = Math.round(baseWeight * growthFactor * seasonalFactor);
    
    // Confidence decreases over time
    const confidence = Math.max(0.5, 0.95 - (i * 0.08));
    
    forecasts.push({
      month: format(forecastDate, 'MMM yyyy'),
      shortMonth: format(forecastDate, 'MMM'),
      predictedVolume,
      predictedRevenue,
      predictedWeight,
      confidence: Math.round(confidence * 100),
      // Range based on confidence
      volumeMin: Math.round(predictedVolume * (1 - (1 - confidence) * 0.5)),
      volumeMax: Math.round(predictedVolume * (1 + (1 - confidence) * 0.5)),
      revenueMin: Math.round(predictedRevenue * (1 - (1 - confidence) * 0.5)),
      revenueMax: Math.round(predictedRevenue * (1 + (1 - confidence) * 0.5)),
    });
  }
  
  // Summary stats
  const totalPredictedRevenue = forecasts.reduce((s, f) => s + f.predictedRevenue, 0);
  const totalPredictedVolume = forecasts.reduce((s, f) => s + f.predictedVolume, 0);
  const avgMonthlyGrowth = growthRate / 12 * 100;
  
  return {
    forecasts,
    historicalData,
    summary: {
      totalPredictedRevenue,
      totalPredictedVolume,
      avgMonthlyGrowth: Math.round(avgMonthlyGrowth * 10) / 10,
      growthTrend: growthRate > 0.05 ? 'growing' : growthRate < -0.05 ? 'declining' : 'stable',
      confidence: forecasts[0]?.confidence || 0,
    }
  };
}

export function analyzeServiceTrends(shipments) {
  const serviceData = {};
  
  shipments.forEach(s => {
    const type = s.service_type || 'standard';
    if (!serviceData[type]) {
      serviceData[type] = { count: 0, revenue: 0, weight: 0 };
    }
    serviceData[type].count++;
    serviceData[type].revenue += s.total_amount || 0;
    serviceData[type].weight += s.weight_kg || 0;
  });
  
  const total = shipments.length || 1;
  
  return Object.entries(serviceData).map(([type, data]) => ({
    type: type.replace('_', ' '),
    count: data.count,
    percentage: Math.round((data.count / total) * 100),
    revenue: data.revenue,
    avgWeight: Math.round(data.weight / data.count * 10) / 10,
  })).sort((a, b) => b.count - a.count);
}