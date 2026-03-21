import { db } from '@/api/db';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { format, isPast } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

function parseBillItems(items) {
  if (Array.isArray(items)) return items;
  if (!items) return [];

  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function openPrintableInvoice(bill, companySettings) {
  const popup = window.open('', '_blank');
  if (!popup) return;

  const companyName = companySettings?.company_name || 'KTM Cargo Express';
  const companyAddress = companySettings?.address || 'Bangkok, Thailand';
  const companyPhone = companySettings?.phone || '';
  const companyEmail = companySettings?.email || '';
  const items = parseBillItems(bill.items);

  const itemsHtml =
    items.length > 0
      ? items
          .map(
            (item) => `
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">${item.description || item.name || 'Invoice item'}</td>
                <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">฿${Number(item.amount ?? item.total ?? 0).toLocaleString()}</td>
              </tr>
            `
          )
          .join('')
      : `
          <tr>
            <td colspan="2" style="padding:8px 0;color:#94a3b8;text-align:center;">No line items</td>
          </tr>
        `;

  popup.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${bill.invoice_number || bill.id}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1e293b; padding: 32px; max-width: 760px; margin: 0 auto; }
          h1, h2, p { margin: 0; }
          .muted { color: #64748b; }
          .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
          .company { max-width: 420px; }
          .invoice-no { font-family: monospace; font-size: 16px; margin-top: 6px; }
          .section { margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          thead th { text-align: left; font-size: 12px; color: #64748b; padding-bottom: 8px; border-bottom: 2px solid #cbd5e1; }
          tfoot td { padding-top: 12px; border-top: 2px solid #cbd5e1; font-weight: 700; }
          .actions { margin-top: 24px; text-align: center; }
          .actions button {
            padding: 10px 20px;
            border: 0;
            border-radius: 10px;
            background: #2563eb;
            color: white;
            font-weight: 600;
            cursor: pointer;
          }
          @media print {
            .actions { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
            <h1>${companyName}</h1>
            ${companyAddress ? `<p class="muted" style="margin-top:4px;">${companyAddress}</p>` : ''}
            ${companyPhone ? `<p class="muted" style="margin-top:4px;">${companyPhone}</p>` : ''}
            ${companyEmail ? `<p class="muted" style="margin-top:4px;">${companyEmail}</p>` : ''}
          </div>
          <div style="text-align:right;">
            <h2 style="font-size: 28px; color: #2563eb;">INVOICE</h2>
            <div class="invoice-no">${bill.invoice_number || bill.id}</div>
            <p class="muted" style="margin-top:8px;">${bill.status || 'pending'}</p>
          </div>
        </div>

        <div class="section">
          <p class="muted">Vendor</p>
          <p style="font-size: 18px; font-weight: 700; margin-top: 4px;">${bill.vendor_name || 'Vendor'}</p>
          <p class="muted" style="margin-top:4px;">PO: ${bill.po_number || '-'}</p>
          <p class="muted" style="margin-top:4px;">Due: ${bill.due_date ? format(new Date(bill.due_date), 'MMM d, yyyy') : '-'}</p>
        </div>

        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td style="text-align:right;">฿${Number(bill.total_amount || 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="actions">
          <button onclick="window.print()">Print / Save PDF</button>
        </div>
      </body>
    </html>
  `);
  popup.document.close();
}

export default function VendorInvoices({ vendor }) {
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const list = await db.companySettings.list();
      return list[0] || null;
    },
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['vendor-bills-list', vendor?.id],
    queryFn: async () => {
      if (vendor?.id) {
        return db.customerInvoices.filter(
          { vendor_id: vendor.id, invoice_type: 'vendor_bill' },
          '-created_date'
        );
      }
      return [];
    },
    enabled: !!vendor?.id,
  });

  // Enrich with overdue status
  const enrichedBills = bills.map((bill) => ({
    ...bill,
    status:
      bill.status === 'pending' && bill.due_date && isPast(new Date(bill.due_date))
        ? 'overdue'
        : bill.status,
  }));

  const pendingAmount = enrichedBills
    .filter((p) => ['pending', 'scheduled'].includes(p.status))
    .reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const paidAmount = enrichedBills
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const overdueAmount = enrichedBills
    .filter((p) => p.status === 'overdue')
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

      {/* Bills List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Vendor Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {enrichedBills.length > 0 ? (
            <div className="space-y-3">
              {enrichedBills.map((bill) => {
                const status = STATUS_CONFIG[bill.status] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;
                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4 border rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${status.color}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {bill.invoice_number || `BILL-${bill.id?.slice(-6)}`}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          {bill.po_number && <span>PO: {bill.po_number}</span>}
                          {bill.due_date && (
                            <span>Due: {format(new Date(bill.due_date), 'MMM d, yyyy')}</span>
                          )}
                          {bill.payment_date && (
                            <span className="text-emerald-600">
                              Paid: {format(new Date(bill.payment_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">฿{bill.total_amount?.toLocaleString()}</p>
                      <Badge className={status.color}>{status.label}</Badge>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPrintableInvoice(bill, companySettings)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No vendor bills</p>
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
