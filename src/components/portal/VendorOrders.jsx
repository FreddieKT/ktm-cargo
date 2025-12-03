import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, Search, Filter, Eye, CheckCircle, Truck,
  Calendar, Clock, AlertTriangle, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  pending_approval: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700' },
  sent: { label: 'Sent', color: 'bg-indigo-100 text-indigo-700' },
  partial_received: { label: 'Partial', color: 'bg-purple-100 text-purple-700' },
  received: { label: 'Received', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' }
};

export default function VendorOrders({ vendor }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateNotes, setUpdateNotes] = useState('');

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['vendor-orders-list', vendor?.id, vendor?.name],
    queryFn: async () => {
      if (vendor?.id) {
        return base44.entities.PurchaseOrder.filter({ vendor_id: vendor.id }, '-created_date');
      } else if (vendor?.name) {
        return base44.entities.PurchaseOrder.filter({ vendor_name: vendor.name }, '-created_date');
      }
      return [];
    },
    enabled: !!(vendor?.id || vendor?.name)
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      await base44.entities.PurchaseOrder.update(orderId, { 
        status,
        notes: updateNotes ? `${selectedOrder?.notes || ''}\n[Vendor] ${updateNotes}` : selectedOrder?.notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders-list'] });
      toast.success('Order status updated');
      setSelectedOrder(null);
      setUpdateNotes('');
    }
  });

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = !search || 
      po.po_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConfirmOrder = () => {
    updateOrderMutation.mutate({ orderId: selectedOrder.id, status: 'sent' });
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
                placeholder="Search by PO number..."
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="sent">In Progress</SelectItem>
                <SelectItem value="received">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Purchase Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length > 0 ? (
            <div className="space-y-3">
              {filteredOrders.map(po => {
                const status = STATUS_CONFIG[po.status] || STATUS_CONFIG.draft;
                return (
                  <div 
                    key={po.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-mono font-medium">{po.po_number}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {po.order_date && format(new Date(po.order_date), 'MMM d, yyyy')}
                          </span>
                          {po.expected_delivery && (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              Due: {format(new Date(po.expected_delivery), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">฿{po.total_amount?.toLocaleString()}</p>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(po)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-lg font-bold">{selectedOrder.po_number}</p>
                  <Badge className={STATUS_CONFIG[selectedOrder.status]?.color}>
                    {STATUS_CONFIG[selectedOrder.status]?.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Order Date</p>
                  <p className="font-medium">{format(new Date(selectedOrder.order_date || selectedOrder.created_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-slate-500">Expected Delivery</p>
                  <p className="font-medium">
                    {selectedOrder.expected_delivery && format(new Date(selectedOrder.expected_delivery), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm text-slate-500 mb-2">Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-2">Item</th>
                        <th className="text-center p-2">Qty</th>
                        <th className="text-right p-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        try {
                          const items = JSON.parse(selectedOrder.items || '[]');
                          return items.map((item, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">{item.name}</td>
                              <td className="text-center p-2">{item.quantity}</td>
                              <td className="text-right p-2">฿{(item.total || 0).toLocaleString()}</td>
                            </tr>
                          ));
                        } catch {
                          return <tr><td colSpan={3} className="p-2 text-center text-slate-400">No items</td></tr>;
                        }
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-bold text-blue-600">฿{selectedOrder.total_amount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions for approved orders */}
              {selectedOrder.status === 'approved' && (
                <div className="pt-4 border-t space-y-3">
                  <Textarea
                    placeholder="Add notes (optional)"
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    rows={2}
                  />
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleConfirmOrder}
                    disabled={updateOrderMutation.isPending}
                  >
                    {updateOrderMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Confirm & Start Processing
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}