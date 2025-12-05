import React, { useState } from 'react';
import { db } from '@/api/db';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Eye,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export default function CustomerInvoices({ customer }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Get shipments as proxy for invoices
  const { data: shipments = [] } = useQuery({
    queryKey: ['customer-invoices', customer?.id, customer?.name],
    queryFn: async () => {
      if (customer?.id) {
        return db.shipments.filter({ customer_id: customer.id }, '-created_date');
      } else if (customer?.name) {
        return db.shipments.filter({ customer_name: customer.name }, '-created_date');
      }
      return [];
    },
    enabled: !!(customer?.id || customer?.name),
  });

  // Convert shipments to invoice-like objects
  const invoices = shipments.map((s) => ({
    id: s.id,
    invoice_number: `INV-${s.id?.slice(-8).toUpperCase()}`,
    date: s.created_date,
    due_date: s.estimated_delivery,
    amount: s.total_amount || 0,
    status:
      s.payment_status === 'paid'
        ? 'paid'
        : new Date(s.estimated_delivery) < new Date() && s.payment_status !== 'paid'
          ? 'overdue'
          : 'pending',
    shipment: s,
  }));

  const pendingTotal = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const paidTotal = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const handleDownload = (invoice) => {
    // Generate simple invoice text
    const content = `
INVOICE: ${invoice.invoice_number}
Date: ${format(new Date(invoice.date), 'MMMM d, yyyy')}
---
Tracking: ${invoice.shipment?.tracking_number || 'N/A'}
Items: ${invoice.shipment?.items_description || 'Package'}
Weight: ${invoice.shipment?.weight_kg || 0} kg
---
Amount: ฿${invoice.amount.toLocaleString()}
Status: ${invoice.status.toUpperCase()}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoice_number}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">฿{pendingTotal.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Pending Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">฿{paidTotal.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-xs text-slate-500">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => {
                const status = STATUS_CONFIG[invoice.status];
                const StatusIcon = status.icon;
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${status.color}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-mono font-medium">{invoice.invoice_number}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(invoice.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">฿{invoice.amount.toLocaleString()}</p>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(invoice)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No invoices yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="font-mono text-xl font-bold">{selectedInvoice.invoice_number}</p>
                <Badge className={STATUS_CONFIG[selectedInvoice.status]?.color}>
                  {STATUS_CONFIG[selectedInvoice.status]?.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Invoice Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedInvoice.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Due Date</p>
                  <p className="font-medium">
                    {selectedInvoice.due_date &&
                      format(new Date(selectedInvoice.due_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tracking</span>
                  <span className="font-mono">{selectedInvoice.shipment?.tracking_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Items</span>
                  <span>{selectedInvoice.shipment?.items_description?.slice(0, 30)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Weight</span>
                  <span>{selectedInvoice.shipment?.weight_kg} kg</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ฿{selectedInvoice.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedInvoice.status !== 'paid' && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800 mb-2">Payment Methods</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• PromptPay: 0812345678</li>
                    <li>• Bank Transfer: Bangkok Bank 123-4-56789-0</li>
                    <li>• Cash on pickup</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDownload(selectedInvoice)}
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
