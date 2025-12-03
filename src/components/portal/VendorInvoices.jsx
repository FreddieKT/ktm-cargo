import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, Download, Clock, CheckCircle, AlertTriangle,
  Calendar, DollarSign
} from 'lucide-react';
import { format, isPast } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
};

export default function VendorInvoices({ vendor }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['vendor-payments-list', vendor?.id],
    queryFn: async () => {
      if (vendor?.id) {
        return base44.entities.VendorPayment.filter({ vendor_id: vendor.id }, '-created_date');
      }
      return [];
    },
    enabled: !!vendor?.id
  });

  // Enrich with overdue status
  const enrichedPayments = payments.map(p => ({
    ...p,
    status: p.status === 'pending' && p.due_date && isPast(new Date(p.due_date)) ? 'overdue' : p.status
  }));

  const pendingAmount = enrichedPayments.filter(p => ['pending', 'scheduled'].includes(p.status))
    .reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const paidAmount = enrichedPayments.filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const overdueAmount = enrichedPayments.filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + (p.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">฿{pendingAmount.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Pending</p>
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
                <p className="text-2xl font-bold">฿{paidAmount.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">฿{overdueAmount.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {enrichedPayments.length > 0 ? (
            <div className="space-y-3">
              {enrichedPayments.map(payment => {
                const status = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;
                return (
                  <div 
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${status.color}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.reference_number || `PAY-${payment.id?.slice(-6)}`}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          {payment.due_date && (
                            <span>Due: {format(new Date(payment.due_date), 'MMM d, yyyy')}</span>
                          )}
                          {payment.payment_date && (
                            <span className="text-emerald-600">
                              Paid: {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">฿{payment.total_amount?.toLocaleString()}</p>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No payment history</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Your Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Bank Name</p>
              <p className="font-medium">{vendor?.bank_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-slate-500">Account Number</p>
              <p className="font-medium">{vendor?.bank_account_number || 'Not set'}</p>
            </div>
            <div>
              <p className="text-slate-500">Account Name</p>
              <p className="font-medium">{vendor?.bank_account_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-slate-500">Payment Terms</p>
              <p className="font-medium">{vendor?.payment_terms?.replace('_', ' ') || 'Net 30'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}