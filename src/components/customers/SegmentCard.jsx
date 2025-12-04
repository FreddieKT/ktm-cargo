import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Package, DollarSign, ArrowRight } from 'lucide-react';

const segmentConfig = {
  individual: {
    label: 'Individuals',
    description: 'Personal shipments to family',
    color: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
    icon: Users,
  },
  online_shopper: {
    label: 'Online Shoppers',
    description: 'Shopping service customers',
    color: 'bg-purple-500',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-700',
    icon: Package,
  },
  sme_importer: {
    label: 'SME Importers',
    description: 'Business customers',
    color: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    icon: TrendingUp,
  },
};

export default function SegmentCard({ segment, customers, shipments, onClick, selected }) {
  const config = segmentConfig[segment];
  if (!config) return null;

  const Icon = config.icon;
  const segmentCustomers = customers.filter((c) => c.customer_type === segment);
  const customerIds = segmentCustomers.map((c) => c.id);

  const segmentShipments = shipments.filter((s) =>
    segmentCustomers.some((c) => c.name === s.customer_name || c.phone === s.customer_phone)
  );

  const totalRevenue = segmentShipments.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const avgOrderValue = segmentShipments.length > 0 ? totalRevenue / segmentShipments.length : 0;

  return (
    <Card
      className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
        selected ? `border-${config.color.replace('bg-', '')} shadow-lg` : 'border-transparent'
      }`}
      onClick={() => onClick?.(segment)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${config.bgLight}`}>
            <Icon className={`w-6 h-6 ${config.textColor}`} />
          </div>
          <Badge className={`${config.bgLight} ${config.textColor} border-0`}>
            {segmentCustomers.length} customers
          </Badge>
        </div>

        <h3 className="font-bold text-slate-900 text-lg">{config.label}</h3>
        <p className="text-sm text-slate-500 mb-4">{config.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className={`p-3 rounded-lg ${config.bgLight}`}>
            <p className="text-slate-500 text-xs">Total Revenue</p>
            <p className={`font-bold ${config.textColor}`}>฿{totalRevenue.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-lg ${config.bgLight}`}>
            <p className="text-slate-500 text-xs">Avg. Order</p>
            <p className={`font-bold ${config.textColor}`}>฿{avgOrderValue.toFixed(0)}</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">{segmentShipments.length} shipments</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>
      </CardContent>
    </Card>
  );
}
