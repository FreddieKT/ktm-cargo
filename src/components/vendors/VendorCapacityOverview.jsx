import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Scale, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function VendorCapacityOverview({ vendors = [], purchaseOrders = [] }) {
  // Filter cargo carriers with capacity set
  const cargoVendors = vendors.filter(
    (v) => v.vendor_type === 'cargo_carrier' && v.status === 'active'
  );

  // Calculate total capacity stats
  const totalCapacity = cargoVendors.reduce((sum, v) => sum + (v.monthly_capacity_kg || 0), 0);
  const totalAllocated = cargoVendors.reduce(
    (sum, v) => sum + (v.current_month_allocated_kg || 0),
    0
  );
  const totalAvailable = totalCapacity - totalAllocated;
  const overallUsagePercent = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

  // Vendors with low capacity
  const lowCapacityVendors = cargoVendors.filter((v) => {
    if (!v.monthly_capacity_kg) return false;
    const usage = ((v.current_month_allocated_kg || 0) / v.monthly_capacity_kg) * 100;
    return usage > 80;
  });

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            Vendor Capacity Overview
          </CardTitle>
          <CardDescription>Monthly capacity across all cargo carriers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{cargoVendors.length}</p>
              <p className="text-xs text-slate-500">Active Carriers</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold">{totalCapacity.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Total Capacity (kg)</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">
                {totalAvailable.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Available (kg)</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{overallUsagePercent.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Utilization</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Overall Capacity Usage</span>
              <span className="font-medium">
                {totalAllocated.toLocaleString()} / {totalCapacity.toLocaleString()} kg
              </span>
            </div>
            <Progress value={overallUsagePercent} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Low Capacity Alert */}
      {lowCapacityVendors.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-medium">Capacity Alerts</h3>
            </div>
            <div className="space-y-2">
              {lowCapacityVendors.map((vendor) => {
                const usage =
                  ((vendor.current_month_allocated_kg || 0) / vendor.monthly_capacity_kg) * 100;
                const remaining =
                  vendor.monthly_capacity_kg - (vendor.current_month_allocated_kg || 0);
                return (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between p-2 bg-amber-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-xs text-slate-500">
                        Only {remaining.toLocaleString()} kg remaining
                      </p>
                    </div>
                    <Badge
                      className={
                        usage >= 100 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }
                    >
                      {usage.toFixed(0)}% used
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Vendor Capacity */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Vendor Capacity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cargoVendors.map((vendor) => {
              const capacity = vendor.monthly_capacity_kg || 0;
              const allocated = vendor.current_month_allocated_kg || 0;
              const available = capacity - allocated;
              const usagePercent = capacity > 0 ? (allocated / capacity) * 100 : 0;

              return (
                <div key={vendor.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{vendor.name}</h3>
                        {vendor.is_preferred && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">Preferred</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        ฿{vendor.cost_per_kg || 0}/kg standard • {vendor.lead_time_days || 3}d lead
                        time
                      </p>
                    </div>
                    <Badge
                      className={
                        usagePercent >= 100
                          ? 'bg-rose-100 text-rose-800'
                          : usagePercent >= 80
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }
                    >
                      {available.toLocaleString()} kg available
                    </Badge>
                  </div>

                  {capacity > 0 ? (
                    <>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Capacity Usage</span>
                        <span>
                          {allocated.toLocaleString()} / {capacity.toLocaleString()} kg
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            usagePercent >= 100
                              ? 'bg-rose-500'
                              : usagePercent >= 80
                                ? 'bg-amber-500'
                                : usagePercent >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, usagePercent)}%` }}
                        />
                      </div>

                      {/* Pricing Tiers */}
                      <div className="flex gap-4 mt-3 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Standard:</span>
                          <span className="font-medium">฿{vendor.cost_per_kg || 0}/kg</span>
                        </div>
                        {vendor.cost_per_kg_express > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Express:</span>
                            <span className="font-medium text-amber-600">
                              ฿{vendor.cost_per_kg_express}/kg
                            </span>
                          </div>
                        )}
                        {vendor.cost_per_kg_bulk > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">
                              Bulk ({vendor.bulk_threshold_kg}+ kg):
                            </span>
                            <span className="font-medium text-emerald-600">
                              ฿{vendor.cost_per_kg_bulk}/kg
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No capacity limit set</p>
                  )}
                </div>
              );
            })}

            {cargoVendors.length === 0 && (
              <div className="text-center py-8">
                <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No cargo carriers found</p>
                <p className="text-sm text-slate-400">
                  Add vendors with cargo carrier type to track capacity
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
