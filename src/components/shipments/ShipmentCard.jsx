import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Calendar, Weight } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-purple-100 text-purple-800',
  customs: 'bg-orange-100 text-orange-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-800',
};

const paymentColors = {
  unpaid: 'bg-rose-100 text-rose-800',
  partial: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
};

export default function ShipmentCard({ shipment, onClick }) {
  return (
    <Card
      className="p-4 hover:shadow-md transition-all cursor-pointer border-0 shadow-sm"
      onClick={() => onClick?.(shipment)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Package className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{shipment.tracking_number || 'Pending'}</p>
            <p className="text-sm text-slate-500">{shipment.customer_name}</p>
          </div>
        </div>
        <Badge className={statusColors[shipment.status]}>
          {shipment.status?.replace('_', ' ')}
        </Badge>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Weight className="w-4 h-4" />
          <span>
            {shipment.weight_kg} kg • {shipment.service_type?.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{shipment.delivery_address || 'Yangon'}</span>
        </div>
        {shipment.pickup_date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(shipment.pickup_date), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <Badge className={paymentColors[shipment.payment_status]}>{shipment.payment_status}</Badge>
        <p className="font-bold text-slate-900">฿{shipment.total_amount?.toLocaleString() || 0}</p>
      </div>
    </Card>
  );
}
