import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import ShipmentForm from '@/components/shipments/ShipmentForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Package,
  Filter,
  X,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { sendFeedbackRequest } from '@/components/feedback/FeedbackRequestService';
import {
  triggerDeliveryFeedbackAlert,
  triggerShipmentCreatedAlert,
  triggerShipmentStatusAlert,
  triggerPaymentReceivedAlert,
} from '@/components/notifications/NotificationService';
import { updateVendorOnDelivery } from '@/components/vendors/VendorPerformanceService';
import { processShipmentForInvoicing } from '@/components/invoices/InvoiceGenerationService';

export default function Shipments() {
  const [showForm, setShowForm] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => base44.entities.Shipment.list('-created_date'),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
  });

  const { data: vendorOrders = [] } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: () => base44.entities.VendorOrder.list(),
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => base44.entities.PurchaseOrder.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const shipment = await base44.entities.Shipment.create(data);

      // Update PO allocated weight if linked to a PO
      if (data.vendor_po_id && data.weight_kg) {
        const po = purchaseOrders.find((p) => p.id === data.vendor_po_id);
        if (po) {
          const newAllocated = (po.allocated_weight_kg || 0) + parseFloat(data.weight_kg);
          const remaining = (po.total_weight_kg || 0) - newAllocated;
          await base44.entities.PurchaseOrder.update(data.vendor_po_id, {
            allocated_weight_kg: newAllocated,
            remaining_weight_kg: Math.max(0, remaining),
          });
        }
      }
      return shipment;
    },
    onSuccess: (newShipment) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setShowForm(false);
      // Trigger notification for new shipment
      triggerShipmentCreatedAlert(newShipment).catch(console.error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shipment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      setShowForm(false);
      setEditingShipment(null);
      setSelectedShipment(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingShipment) {
      updateMutation.mutate({ id: editingShipment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (shipment) => {
    setEditingShipment(shipment);
    setShowForm(true);
    setSelectedShipment(null);
  };

  const handleStatusChange = async (shipment, newStatus) => {
    const oldStatus = shipment.status;
    const updatedShipment = { ...shipment, status: newStatus };

    // Update shipment first
    await base44.entities.Shipment.update(shipment.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['shipments'] });

    // Trigger status change notification
    if (oldStatus !== newStatus) {
      triggerShipmentStatusAlert(shipment, oldStatus, newStatus).catch(console.error);
    }

    // Send feedback request when marked as delivered
    if (newStatus === 'delivered' && shipment.status !== 'delivered') {
      const customer = customers.find(
        (c) => c.name === shipment.customer_name || c.phone === shipment.customer_phone
      );
      if (customer) {
        // Create in-app notification
        triggerDeliveryFeedbackAlert(shipment, customer);

        // Send feedback email if customer has email
        if (customer.email) {
          toast.promise(sendFeedbackRequest(shipment, customer), {
            loading: 'Sending feedback request...',
            success: 'Feedback request sent to customer',
            error: 'Could not send feedback request',
          });
        }
      }

      // Update vendor metrics when shipment is delivered
      updateVendorOnDelivery(shipment.id, vendorOrders, vendors).then((result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: ['vendors'] });
          queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
        }
      });

      // Generate invoice if shipment is paid
      if (shipment.payment_status === 'paid') {
        processShipmentForInvoicing(updatedShipment, customers, vendorOrders, vendors).then(
          (result) => {
            if (!result.skipped) {
              queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
              toast.success('Invoice and payout records generated');
            }
          }
        );
      }
    }
  };

  const handlePaymentChange = async (shipment, newPaymentStatus) => {
    const updatedShipment = { ...shipment, payment_status: newPaymentStatus };

    // Update shipment first
    await base44.entities.Shipment.update(shipment.id, { payment_status: newPaymentStatus });
    queryClient.invalidateQueries({ queryKey: ['shipments'] });

    // Trigger payment received notification
    if (newPaymentStatus === 'paid' && shipment.payment_status !== 'paid') {
      triggerPaymentReceivedAlert(shipment).catch(console.error);
    }

    // Generate invoice if shipment is delivered and now paid
    if (newPaymentStatus === 'paid' && shipment.status === 'delivered') {
      processShipmentForInvoicing(updatedShipment, customers, vendorOrders, vendors).then(
        (result) => {
          if (!result.skipped) {
            queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
            toast.success('Invoice and payout records generated');
          }
        }
      );
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      s.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer_phone?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: shipments.length,
    pending: shipments.filter((s) => s.status === 'pending').length,
    in_transit: shipments.filter((s) =>
      ['confirmed', 'picked_up', 'in_transit', 'customs'].includes(s.status)
    ).length,
    delivered: shipments.filter((s) => s.status === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">Shipments</h1>
            <p className="text-sm text-slate-500 mt-1">Manage cargo shipments to Yangon</p>
          </div>
          <Button
            onClick={() => {
              setEditingShipment(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New </span>Shipment
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, phone, or tracking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="flex-wrap h-auto p-1 gap-1">
                  <TabsTrigger value="all" className="gap-1 text-xs sm:text-sm">
                    All{' '}
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5">
                      {statusCounts.all}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="gap-1 text-xs sm:text-sm">
                    <Clock className="w-3 h-3" /> <span className="hidden sm:inline">Pending</span>{' '}
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5">
                      {statusCounts.pending}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="in_transit" className="gap-1 text-xs sm:text-sm">
                    <Truck className="w-3 h-3" /> <span className="hidden sm:inline">Transit</span>{' '}
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5">
                      {statusCounts.in_transit}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="delivered" className="gap-1 text-xs sm:text-sm">
                    <CheckCircle className="w-3 h-3" />{' '}
                    <span className="hidden sm:inline">Delivered</span>{' '}
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5">
                      {statusCounts.delivered}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Shipments Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
          </div>
        ) : filteredShipments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShipments.map((shipment) => (
              <ShipmentCard key={shipment.id} shipment={shipment} onClick={setSelectedShipment} />
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No shipments found</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first shipment to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Shipment
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* New/Edit Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-transparent border-0 shadow-none">
            <ShipmentForm
              shipment={editingShipment}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingShipment(null);
              }}
              purchaseOrders={purchaseOrders}
              vendors={vendors}
            />
          </DialogContent>
        </Dialog>

        {/* Shipment Details Dialog */}
        <Dialog open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
          <DialogContent className="max-w-lg">
            {selectedShipment && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedShipment.tracking_number || 'Pending'}
                    </h2>
                    <p className="text-slate-500">{selectedShipment.customer_name}</p>
                  </div>
                  <Badge
                    className={
                      selectedShipment.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedShipment.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {selectedShipment.status?.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Weight</p>
                    <p className="font-medium">{selectedShipment.weight_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Service</p>
                    <p className="font-medium">
                      {selectedShipment.service_type?.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Total Amount</p>
                    <p className="font-medium text-blue-600">
                      ฿{selectedShipment.total_amount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Payment</p>
                    <Badge
                      className={
                        selectedShipment.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }
                    >
                      {selectedShipment.payment_status}
                    </Badge>
                  </div>
                </div>

                {/* Vendor Cost Info */}
                {selectedShipment.vendor_po_id && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-2">Linked Vendor PO</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-500">PO Number</p>
                        <p className="font-medium">{selectedShipment.vendor_po_number}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Vendor</p>
                        <p className="font-medium">{selectedShipment.vendor_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Vendor Cost</p>
                        <p className="font-medium text-rose-600">
                          ฿{selectedShipment.vendor_total_cost?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Profit</p>
                        <p className="font-medium text-emerald-600">
                          ฿{selectedShipment.profit?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedShipment.items_description && (
                  <div>
                    <p className="text-slate-500 text-sm mb-1">Items</p>
                    <p className="text-sm">{selectedShipment.items_description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 text-sm mb-2">Update Status</p>
                    <Select
                      value={selectedShipment.status}
                      onValueChange={(v) => handleStatusChange(selectedShipment, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="picked_up">Picked Up</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="customs">At Customs</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm mb-2">Payment Status</p>
                    <Select
                      value={selectedShipment.payment_status}
                      onValueChange={(v) => handlePaymentChange(selectedShipment, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedShipment.status === 'delivered' && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      const customer = customers.find(
                        (c) =>
                          c.name === selectedShipment.customer_name ||
                          c.phone === selectedShipment.customer_phone
                      );
                      if (customer?.email) {
                        toast.promise(sendFeedbackRequest(selectedShipment, customer), {
                          loading: 'Sending...',
                          success: 'Feedback request sent!',
                          error: 'Failed to send',
                        });
                      } else {
                        toast.error('Customer email not found');
                      }
                    }}
                  >
                    <Star className="w-4 h-4" />
                    Request Feedback
                  </Button>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedShipment(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button onClick={() => handleEdit(selectedShipment)} className="flex-1">
                    Edit Shipment
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
