import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  Scale,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Zap,
} from 'lucide-react';

import { useErrorHandler } from '@/hooks/useErrorHandler';
/**
 * Calculates vendor score for selection based on multiple factors
 */
function calculateVendorScore(vendor, weightKg, isExpress = false) {
  let score = 0;
  const breakdown = {};

  // 1. Pricing Score (40 points max)
  const applicableRate = isExpress
    ? vendor.cost_per_kg_express || vendor.cost_per_kg || 999
    : weightKg >= (vendor.bulk_threshold_kg || 100)
      ? vendor.cost_per_kg_bulk || vendor.cost_per_kg || 999
      : vendor.cost_per_kg || 999;

  // Lower price = higher score (assuming market avg is ~80/kg)
  const pricingScore = Math.max(0, 40 - (applicableRate - 50) * 0.5);
  score += pricingScore;
  breakdown.pricing = { score: pricingScore.toFixed(1), rate: applicableRate };

  // 2. Capacity Score (20 points max)
  const capacityAvailable =
    (vendor.monthly_capacity_kg || 0) - (vendor.current_month_allocated_kg || 0);
  const hasCapacity = vendor.monthly_capacity_kg === 0 || capacityAvailable >= weightKg;
  const capacityScore = hasCapacity ? 20 : 0;
  score += capacityScore;
  breakdown.capacity = { score: capacityScore, available: capacityAvailable, hasCapacity };

  // 3. Performance Score (25 points max)
  const onTimeRate = vendor.on_time_rate || 100;
  const rating = vendor.rating || 5;
  const performanceScore = (onTimeRate / 100) * 15 + (rating / 5) * 10;
  score += performanceScore;
  breakdown.performance = { score: performanceScore.toFixed(1), onTimeRate, rating };

  // 4. Preferred Vendor Bonus (10 points)
  const preferredBonus = vendor.is_preferred ? 10 : 0;
  score += preferredBonus;
  breakdown.preferred = { score: preferredBonus, isPreferred: vendor.is_preferred };

  // 5. Lead Time Score (5 points max)
  const leadTimeDays = vendor.lead_time_days || 3;
  const leadTimeScore = Math.max(0, 5 - leadTimeDays * 0.5);
  score += leadTimeScore;
  breakdown.leadTime = { score: leadTimeScore.toFixed(1), days: leadTimeDays };

  return {
    totalScore: Math.min(100, score).toFixed(1),
    breakdown,
    applicableRate,
    hasCapacity,
    meetsMinOrder: weightKg >= (vendor.min_order_kg || 0),
  };
}

export default function PreferredVendorSelector({
  vendors = [],
  weightKg = 0,
  isExpress = false,
  onSelect,
  selectedVendorId,
}) {
  // Filter and score vendors
  const scoredVendors = useMemo(() => {
    return vendors
      .filter((v) => v.status === 'active' && v.vendor_type === 'cargo_carrier')
      .map((vendor) => ({
        ...vendor,
        scoreData: calculateVendorScore(vendor, weightKg, isExpress),
      }))
      .sort((a, b) => parseFloat(b.scoreData.totalScore) - parseFloat(a.scoreData.totalScore));
  }, [vendors, weightKg, isExpress]);

  const topRecommendation = scoredVendors[0];

  if (scoredVendors.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-slate-600">No active cargo carriers found</p>
          <p className="text-sm text-slate-500">
            Add vendors with cargo carrier type to enable recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Recommended Vendors
        </CardTitle>
        <CardDescription>
          Based on pricing, capacity, and performance for {weightKg} kg{' '}
          {isExpress ? '(Express)' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {scoredVendors.slice(0, 5).map((vendor, index) => {
          const { scoreData } = vendor;
          const isTop = index === 0;
          const isSelected = vendor.id === selectedVendorId;
          const canSelect = scoreData.hasCapacity && scoreData.meetsMinOrder;

          return (
            <div
              key={vendor.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : isTop
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
              } ${!canSelect ? 'opacity-60' : 'cursor-pointer'}`}
              onClick={() => canSelect && onSelect?.(vendor)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isTop ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{vendor.name}</h3>
                      {vendor.is_preferred && (
                        <Badge className="bg-amber-100 text-amber-800">
                          <Star className="w-3 h-3 mr-1" /> Preferred
                        </Badge>
                      )}
                      {isTop && (
                        <Badge className="bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 mr-1" /> Best Match
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{vendor.contact_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{scoreData.totalScore}</p>
                  <p className="text-xs text-slate-500">score</p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-5 gap-2 text-xs mb-3">
                <div className="text-center p-2 bg-white rounded">
                  <DollarSign className="w-3 h-3 mx-auto text-blue-500 mb-1" />
                  <p className="font-medium">฿{scoreData.applicableRate}</p>
                  <p className="text-slate-400">/kg</p>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <Scale className="w-3 h-3 mx-auto text-emerald-500 mb-1" />
                  <p className="font-medium">{scoreData.breakdown.capacity.available}</p>
                  <p className="text-slate-400">kg avail</p>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <TrendingUp className="w-3 h-3 mx-auto text-purple-500 mb-1" />
                  <p className="font-medium">{scoreData.breakdown.performance.onTimeRate}%</p>
                  <p className="text-slate-400">on-time</p>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <Star className="w-3 h-3 mx-auto text-amber-500 mb-1" />
                  <p className="font-medium">{scoreData.breakdown.performance.rating}</p>
                  <p className="text-slate-400">rating</p>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <Clock className="w-3 h-3 mx-auto text-slate-500 mb-1" />
                  <p className="font-medium">{scoreData.breakdown.leadTime.days}d</p>
                  <p className="text-slate-400">lead</p>
                </div>
              </div>

              {/* Alerts */}
              {!scoreData.hasCapacity && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  Insufficient capacity for this order
                </div>
              )}
              {!scoreData.meetsMinOrder && vendor.min_order_kg > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  Below minimum order ({vendor.min_order_kg} kg)
                </div>
              )}

              {/* Select Button */}
              {canSelect && (
                <Button
                  size="sm"
                  className={`w-full mt-2 ${isSelected ? 'bg-blue-600' : isTop ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  variant={isSelected || isTop ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(vendor);
                  }}
                >
                  {isSelected ? 'Selected' : 'Select Vendor'}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Export the scoring function for use elsewhere
export { calculateVendorScore };
