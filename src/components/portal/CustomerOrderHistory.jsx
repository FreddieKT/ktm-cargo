import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  Package,
  Filter,
  Download,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-700' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  picked_up: { label: 'Picked Up', color: 'bg-indigo-100 text-indigo-700' },
  in_transit: { label: 'In Transit', color: 'bg-amber-100 text-amber-700' },
  customs: { label: 'Customs', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function CustomerOrderHistory({ customer }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: shipments = [] } = useQuery({
    queryKey: ['customer-order-history', customer?.id, customer?.name],
    queryFn: async () => {
      if (customer?.id) {
        return base44.entities.Shipment.filter({ customer_id: customer.id }, '-created_date');
      } else if (customer?.name) {
        return base44.entities.Shipment.filter({ customer_name: customer.name }, '-created_date');
      }
      return [];
    },
    enabled: !!(customer?.id || customer?.name),
  });

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      !search ||
      s.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.items_description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const csv = [
      ['Tracking', 'Date', 'Items', 'Weight', 'Amount', 'Status'].join(','),
      ...filteredShipments.map((s) =>
        [
          s.tracking_number || s.id,
          format(new Date(s.created_date), 'yyyy-MM-dd'),
          `"${s.items_description || ''}"`,
          s.weight_kg,
          s.total_amount,
          s.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by tracking number or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Order History ({filteredShipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredShipments.length > 0 ? (
            <div className="space-y-3">
              {filteredShipments.map((shipment) => {
                const status = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={shipment.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Package className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {shipment.tracking_number || `SHP-${shipment.id?.slice(-6)}`}
                        </p>
                        <p className="text-sm text-slate-500">
                          {shipment.items_description?.slice(0, 40) || 'Package'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(shipment.created_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">฿{shipment.total_amount?.toLocaleString()}</p>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedOrder(shipment)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-mono text-lg font-bold">
                  {selectedOrder.tracking_number || `SHP-${selectedOrder.id?.slice(-6)}`}
                </p>
                <Badge className={STATUS_CONFIG[selectedOrder.status]?.color}>
                  {STATUS_CONFIG[selectedOrder.status]?.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Order Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.created_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Service</p>
                  <p className="font-medium">{selectedOrder.service_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-500">Weight</p>
                  <p className="font-medium">{selectedOrder.weight_kg} kg</p>
                </div>
                <div>
                  <p className="text-slate-500">Payment</p>
                  <p className="font-medium">{selectedOrder.payment_status}</p>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-slate-500">Items</p>
                <p className="font-medium">{selectedOrder.items_description}</p>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-slate-500">Total Amount</span>
                <span className="text-2xl font-bold">
                  ฿{selectedOrder.total_amount?.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
