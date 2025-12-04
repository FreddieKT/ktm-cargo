import React from 'react';
import { Card } from '@/components/ui/card';

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  bgColor = 'bg-blue-500',
}) {
  return (
    <Card className="relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {trend && (
              <p
                className={`text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {trendUp ? '↑' : '↓'} {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${bgColor} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${bgColor.replace('bg-', 'text-')}`} />
          </div>
        </div>
      </div>
    </Card>
  );
}
