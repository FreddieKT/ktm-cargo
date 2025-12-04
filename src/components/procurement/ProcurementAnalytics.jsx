import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  Truck,
  Receipt,
  BarChart3,
} from 'lucide-react';
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  differenceInDays,
} from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ProcurementAnalytics({
  purchaseOrders = [],
  goodsReceipts = [],
  vendorPayments = [],
  vendors = [],
  approvalHistory = [],
}) {
  // Calculate spending by month
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return {
      month: format(date, 'MMM'),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  const monthlySpending = last6Months.map(({ month, start, end }) => {
    const monthPOs = purchaseOrders.filter((po) => {
      const poDate = new Date(po.order_date);
      return isWithinInterval(poDate, { start, end });
    });
    return {
      month,
      amount: monthPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0),
      count: monthPOs.length,
    };
  });

  // Spending by vendor type
  const spendingByVendorType = vendors.reduce((acc, vendor) => {
    const vendorPOs = purchaseOrders.filter((po) => po.vendor_id === vendor.id);
    const totalSpent = vendorPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0);
    const type = vendor.vendor_type || 'other';

    if (!acc[type]) acc[type] = 0;
    acc[type] += totalSpent;
    return acc;
  }, {});

  const vendorTypeData = Object.entries(spendingByVendorType).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }));

  // Top vendors by spend
  const vendorSpend = vendors
    .map((vendor) => {
      const vendorPOs = purchaseOrders.filter((po) => po.vendor_id === vendor.id);
      return {
        name: vendor.name,
        totalSpent: vendorPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0),
        orderCount: vendorPOs.length,
        rating: vendor.rating || 5,
        onTimeRate: vendor.on_time_rate || 100,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // KPIs
  const totalSpent = purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);
  const avgOrderValue = purchaseOrders.length > 0 ? totalSpent / purchaseOrders.length : 0;
  const pendingOrders = purchaseOrders.filter(
    (po) => !['received', 'cancelled'].includes(po.status)
  ).length;
  const avgLeadTime = 7; // Could calculate from actual data

  const currentMonthSpend = monthlySpending[5]?.amount || 0;
  const lastMonthSpend = monthlySpending[4]?.amount || 0;
  const spendTrend =
    lastMonthSpend > 0
      ? (((currentMonthSpend - lastMonthSpend) / lastMonthSpend) * 100).toFixed(1)
      : 0;

  // === NEW: Spending trend by vendor over time ===
  const vendorTrendData = last6Months.map(({ month, start, end }) => {
    const monthData = { month };
    vendors.slice(0, 5).forEach((vendor) => {
      const vendorPOs = purchaseOrders.filter((po) => {
        const poDate = new Date(po.order_date);
        return po.vendor_id === vendor.id && isWithinInterval(poDate, { start, end });
      });
      monthData[vendor.name] = vendorPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0);
    });
    return monthData;
  });

  // === NEW: Tax and Shipping breakdown ===
  const costBreakdown = purchaseOrders.reduce(
    (acc, po) => {
      acc.subtotal += po.subtotal || 0;
      acc.tax += po.tax_amount || 0;
      acc.shipping += po.shipping_cost || 0;
      return acc;
    },
    { subtotal: 0, tax: 0, shipping: 0 }
  );

  const costBreakdownData = [
    { name: 'Base Cost', value: costBreakdown.subtotal, color: '#3b82f6' },
    { name: 'Tax', value: costBreakdown.tax, color: '#f59e0b' },
    { name: 'Shipping', value: costBreakdown.shipping, color: '#10b981' },
  ].filter((d) => d.value > 0);

  // === NEW: PO Cycle Time Analysis ===
  const cycleTimeData = purchaseOrders
    .filter((po) => po.status === 'approved' && po.order_date && po.approved_date)
    .map((po) => {
      const created = new Date(po.order_date);
      const approved = new Date(po.approved_date);
      return differenceInDays(approved, created);
    });

  const avgCycleTime =
    cycleTimeData.length > 0
      ? (cycleTimeData.reduce((a, b) => a + b, 0) / cycleTimeData.length).toFixed(1)
      : 0;

  const cycleTimeDistribution = [
    { range: '0-1 days', count: cycleTimeData.filter((d) => d <= 1).length },
    { range: '2-3 days', count: cycleTimeData.filter((d) => d >= 2 && d <= 3).length },
    { range: '4-7 days', count: cycleTimeData.filter((d) => d >= 4 && d <= 7).length },
    { range: '7+ days', count: cycleTimeData.filter((d) => d > 7).length },
  ];

  // === NEW: Approval bottleneck analysis ===
  const approvalStats = approvalHistory.reduce(
    (acc, h) => {
      if (h.action === 'submitted') acc.submitted++;
      if (h.action === 'approved') acc.approved++;
      if (h.action === 'rejected') acc.rejected++;
      if (h.action === 'auto_approved') acc.autoApproved++;
      if (h.approver_name) {
        acc.byApprover[h.approver_name] = (acc.byApprover[h.approver_name] || 0) + 1;
      }
      return acc;
    },
    { submitted: 0, approved: 0, rejected: 0, autoApproved: 0, byApprover: {} }
  );

  const approverWorkload = Object.entries(approvalStats.byApprover)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // === NEW: Vendor Performance Metrics ===
  const vendorPerformance = vendors
    .map((vendor) => {
      const vendorPOs = purchaseOrders.filter((po) => po.vendor_id === vendor.id);
      const deliveredPOs = vendorPOs.filter((po) => po.status === 'received');
      const vendorReceipts = goodsReceipts.filter((r) => r.vendor_id === vendor.id);

      const qualityPassed = vendorReceipts.filter((r) => r.quality_status === 'passed').length;
      const qualityRate =
        vendorReceipts.length > 0 ? (qualityPassed / vendorReceipts.length) * 100 : 100;

      return {
        name: vendor.name,
        rating: vendor.rating || 5,
        onTimeRate: vendor.on_time_rate || 100,
        qualityRate: Math.round(qualityRate),
        totalOrders: vendorPOs.length,
        totalSpent: vendorPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0),
      };
    })
    .filter((v) => v.totalOrders > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Avg Cycle Time</p>
                <p className="text-2xl font-bold mt-1">{avgCycleTime} days</p>
                <p className="text-xs text-slate-500 mt-1">Order to approval</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Timer className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Auto-Approved</p>
                <p className="text-2xl font-bold mt-1">{approvalStats.autoApproved}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  {approvalStats.submitted > 0
                    ? Math.round((approvalStats.autoApproved / approvalStats.submitted) * 100)
                    : 0}
                  % of total
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Rejection Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {approvalStats.submitted > 0
                    ? Math.round((approvalStats.rejected / approvalStats.submitted) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-slate-500 mt-1">{approvalStats.rejected} rejected</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-lg">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Tax & Shipping</p>
                <p className="text-2xl font-bold mt-1">
                  ฿{(costBreakdown.tax + costBreakdown.shipping).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {totalSpent > 0
                    ? (((costBreakdown.tax + costBreakdown.shipping) / totalSpent) * 100).toFixed(1)
                    : 0}
                  % of total
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Receipt className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Original KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Total Procurement</p>
                <p className="text-2xl font-bold mt-1">฿{totalSpent.toLocaleString()}</p>
                <div
                  className={`flex items-center text-xs mt-1 ${spendTrend >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                >
                  {spendTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(spendTrend)}% vs last month
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Avg Order Value</p>
                <p className="text-2xl font-bold mt-1">฿{avgOrderValue.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">{purchaseOrders.length} total orders</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Active Vendors</p>
                <p className="text-2xl font-bold mt-1">
                  {vendors.filter((v) => v.status === 'active').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">{vendors.length} total vendors</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Pending Orders</p>
                <p className="text-2xl font-bold mt-1">{pendingOrders}</p>
                <p className="text-xs text-slate-500 mt-1">Avg {avgLeadTime} days lead time</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Procurement</CardTitle>
            <CardDescription>Spending trend over last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => [`฿${v.toLocaleString()}`, 'Amount']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spending by Vendor Type */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Spending by Category</CardTitle>
            <CardDescription>Distribution by vendor type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={vendorTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {vendorTypeData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `฿${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Analytics Sections */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" className="gap-1">
            <TrendingUp className="w-4 h-4" /> Trends
          </TabsTrigger>
          <TabsTrigger value="vendors" className="gap-1">
            <Truck className="w-4 h-4" /> Vendors
          </TabsTrigger>
          <TabsTrigger value="cycle" className="gap-1">
            <Timer className="w-4 h-4" /> Cycle Time
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-1">
            <Receipt className="w-4 h-4" /> Costs
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Spending Trend */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Vendor Spending Trend</CardTitle>
                <CardDescription>Top 5 vendors over last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={vendorTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => `฿${v.toLocaleString()}`} />
                    <Legend />
                    {vendors.slice(0, 5).map((vendor, idx) => (
                      <Area
                        key={vendor.id}
                        type="monotone"
                        dataKey={vendor.name}
                        stackId="1"
                        stroke={COLORS[idx % COLORS.length]}
                        fill={COLORS[idx % COLORS.length]}
                        fillOpacity={0.6}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Spending Trend */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Procurement</CardTitle>
                <CardDescription>Spending trend over last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={monthlySpending}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(v, name) => [
                        name === 'count' ? v : `฿${v.toLocaleString()}`,
                        name === 'count' ? 'Orders' : 'Amount',
                      ]}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="amount"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      name="Spend"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Orders"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="mt-6 space-y-6">
          {/* Vendor Performance Metrics */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Vendor Performance Scorecard</CardTitle>
              <CardDescription>Quality, delivery, and overall performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendorPerformance.map((vendor, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-xs text-slate-500">
                            {vendor.totalOrders} orders • ฿{vendor.totalSpent.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="font-bold">{vendor.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-500">On-Time Delivery</span>
                          <span
                            className={
                              vendor.onTimeRate >= 90
                                ? 'text-emerald-600'
                                : vendor.onTimeRate >= 70
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                            }
                          >
                            {vendor.onTimeRate}%
                          </span>
                        </div>
                        <Progress value={vendor.onTimeRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-500">Quality Score</span>
                          <span
                            className={
                              vendor.qualityRate >= 90
                                ? 'text-emerald-600'
                                : vendor.qualityRate >= 70
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                            }
                          >
                            {vendor.qualityRate}%
                          </span>
                        </div>
                        <Progress value={vendor.qualityRate} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
                {vendorPerformance.length === 0 && (
                  <p className="text-center text-slate-500 py-8">
                    No vendor performance data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spending by Category */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Spending by Category</CardTitle>
              <CardDescription>Distribution by vendor type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={vendorTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {vendorTypeData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `฿${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cycle Time Tab */}
        <TabsContent value="cycle" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cycle Time Distribution */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Approval Cycle Time</CardTitle>
                <CardDescription>Distribution of PO approval times</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={cycleTimeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="POs" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Approver Workload */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Approver Workload</CardTitle>
                <CardDescription>Approval actions by team member</CardDescription>
              </CardHeader>
              <CardContent>
                {approverWorkload.length > 0 ? (
                  <div className="space-y-3">
                    {approverWorkload.map((approver, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {approver.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{approver.name}</span>
                            <span className="text-sm text-slate-500">{approver.count} actions</span>
                          </div>
                          <Progress
                            value={(approver.count / (approverWorkload[0]?.count || 1)) * 100}
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">No approval data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Approval Funnel */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Approval Funnel</CardTitle>
              <CardDescription>PO progression through approval stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{approvalStats.submitted}</p>
                  <p className="text-sm text-blue-600">Submitted</p>
                </div>
                <div className="text-slate-300">→</div>
                <div className="flex-1 text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600">{approvalStats.autoApproved}</p>
                  <p className="text-sm text-amber-600">Auto-Approved</p>
                </div>
                <div className="text-slate-300">→</div>
                <div className="flex-1 text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-3xl font-bold text-emerald-600">{approvalStats.approved}</p>
                  <p className="text-sm text-emerald-600">Manually Approved</p>
                </div>
                <div className="text-slate-300">→</div>
                <div className="flex-1 text-center p-4 bg-rose-50 rounded-lg">
                  <p className="text-3xl font-bold text-rose-600">{approvalStats.rejected}</p>
                  <p className="text-sm text-rose-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Breakdown Pie */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                <CardDescription>Base cost vs tax vs shipping</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {costBreakdownData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `฿${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  {costBreakdownData.map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className="w-3 h-3 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: item.color }}
                      />
                      <p className="text-xs text-slate-500">{item.name}</p>
                      <p className="font-bold">฿{item.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Expenditure Summary</CardTitle>
                <CardDescription>Detailed cost analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Base Costs</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">
                        ฿{costBreakdown.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1 ml-8">
                      {totalSpent > 0
                        ? ((costBreakdown.subtotal / totalSpent) * 100).toFixed(1)
                        : 0}
                      % of total
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Receipt className="w-5 h-5 text-amber-600" />
                        <span className="font-medium">Tax Amount</span>
                      </div>
                      <span className="text-xl font-bold text-amber-600">
                        ฿{costBreakdown.tax.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1 ml-8">
                      {totalSpent > 0 ? ((costBreakdown.tax / totalSpent) * 100).toFixed(1) : 0}% of
                      total
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium">Shipping Costs</span>
                      </div>
                      <span className="text-xl font-bold text-emerald-600">
                        ฿{costBreakdown.shipping.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1 ml-8">
                      {totalSpent > 0
                        ? ((costBreakdown.shipping / totalSpent) * 100).toFixed(1)
                        : 0}
                      % of total
                    </p>
                  </div>
                  <div className="p-4 bg-slate-100 rounded-lg border-2 border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Total Expenditure</span>
                      <span className="text-2xl font-bold">฿{totalSpent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
