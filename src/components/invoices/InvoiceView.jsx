import { useRef } from 'react';
import DOMPurify from 'dompurify';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, Mail, Plane } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoiceView({ invoice, onClose }) {
  const printRef = useRef();

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const list = await db.companySettings.list();
      return list[0] || null;
    },
  });

  const company = {
    name: companySettings?.company_name || 'BKK-YGN Cargo',
    logo: companySettings?.logo_url,
    tagline: companySettings?.tagline || 'Bangkok to Yangon Cargo & Shopping Services',
    email: companySettings?.email || 'contact@bkk-ygn-cargo.com',
    phone: companySettings?.phone || '+66 XX XXX XXXX',
    address: companySettings?.address || 'Bangkok, Thailand',
    taxId: companySettings?.tax_id || '',
    bankName: companySettings?.bank_name || '',
    bankAccount: companySettings?.bank_account || '',
    bankAccountName: companySettings?.bank_account_name || '',
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '', 'width=800,height=600');
    // NOTE: document.write() is safe here - writing to a new controlled window for printing
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .logo-section { display: flex; align-items: center; gap: 16px; }
            .logo { width: 60px; height: 60px; object-fit: contain; }
            .company-name { font-size: 24px; font-weight: 700; color: #1e40af; }
            .tagline { font-size: 12px; color: #64748b; }
            .invoice-title { text-align: right; }
            .invoice-title h1 { font-size: 32px; font-weight: 700; color: #1e40af; }
            .invoice-number { font-size: 14px; color: #64748b; margin-top: 4px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .status-issued { background: #dbeafe; color: #1e40af; }
            .status-paid { background: #d1fae5; color: #065f46; }
            .details-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .detail-block h3 { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }
            .detail-block p { font-size: 14px; line-height: 1.6; }
            .detail-block .name { font-weight: 600; font-size: 16px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 12px; text-transform: uppercase; color: #64748b; }
            .items-table td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; }
            .items-table .text-right { text-align: right; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .total-row.grand { border-top: 2px solid #1e40af; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 700; color: #1e40af; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .footer h4 { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
            .footer p { font-size: 13px; color: #475569; line-height: 1.6; }
            .thank-you { text-align: center; margin-top: 40px; font-size: 14px; color: #64748b; }
          </style>
        </head>
        <body>
          ${DOMPurify.sanitize(printContent.innerHTML)}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const serviceTypeLabels = {
    cargo_small: 'Cargo (1-5kg)',
    cargo_medium: 'Cargo (6-15kg)',
    cargo_large: 'Cargo (16-30kg)',
    shopping_small: 'Shopping + Small Items',
    shopping_fashion: 'Shopping + Fashion/Electronics',
    shopping_bulk: 'Shopping + Bulk Order',
    express: 'Express Delivery',
    standard: 'Standard Delivery',
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
        <Button variant="outline" size="sm">
          <Mail className="w-4 h-4 mr-2" /> Send Email
        </Button>
      </div>

      {/* Invoice Preview */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div ref={printRef} className="invoice-container">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt="Logo"
                      className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                      <Plane className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{company.name}</h2>
                    <p className="text-blue-100 text-sm">{company.tagline}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-bold tracking-tight">INVOICE</h1>
                  <p className="text-blue-100 mt-1">{invoice.invoice_number}</p>
                  <Badge
                    className={`mt-2 ${invoice.status === 'issued' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}
                  >
                    {invoice.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              {/* Dates & Details */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Bill To</h3>
                  <p className="font-semibold text-lg text-slate-900">{invoice.customer_name}</p>
                  {invoice.customer_email && (
                    <p className="text-slate-600">{invoice.customer_email}</p>
                  )}
                  {invoice.customer_phone && (
                    <p className="text-slate-600">{invoice.customer_phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="inline-block text-left">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <span className="text-slate-500">Invoice Date:</span>
                      <span className="font-medium">
                        {invoice.invoice_date
                          ? format(new Date(invoice.invoice_date), 'MMM dd, yyyy')
                          : '-'}
                      </span>
                      <span className="text-slate-500">Payment Date:</span>
                      <span className="font-medium">
                        {invoice.payment_date
                          ? format(new Date(invoice.payment_date), 'MMM dd, yyyy')
                          : '-'}
                      </span>
                      <span className="text-slate-500">Tracking No:</span>
                      <span className="font-medium text-blue-600">
                        {invoice.tracking_number || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Items Table */}
              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 text-xs uppercase tracking-wider text-slate-500">
                      Description
                    </th>
                    <th className="text-right py-3 text-xs uppercase tracking-wider text-slate-500">
                      Qty/Weight
                    </th>
                    <th className="text-right py-3 text-xs uppercase tracking-wider text-slate-500">
                      Rate
                    </th>
                    <th className="text-right py-3 text-xs uppercase tracking-wider text-slate-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-4">
                      <p className="font-medium">
                        {serviceTypeLabels[invoice.service_type] || invoice.service_type}
                      </p>
                      {invoice.notes && (
                        <p className="text-sm text-slate-500 mt-1">{invoice.notes}</p>
                      )}
                    </td>
                    <td className="py-4 text-right">{invoice.weight_kg} kg</td>
                    <td className="py-4 text-right">
                      ฿{invoice.price_per_kg?.toLocaleString()}/kg
                    </td>
                    <td className="py-4 text-right font-medium">
                      ฿{invoice.shipping_amount?.toLocaleString()}
                    </td>
                  </tr>
                  {invoice.insurance_amount > 0 && (
                    <tr className="border-b border-slate-100">
                      <td className="py-4">Insurance (3%)</td>
                      <td className="py-4 text-right">-</td>
                      <td className="py-4 text-right">3%</td>
                      <td className="py-4 text-right font-medium">
                        ฿{invoice.insurance_amount?.toLocaleString()}
                      </td>
                    </tr>
                  )}
                  {invoice.packaging_fee > 0 && (
                    <tr className="border-b border-slate-100">
                      <td className="py-4">Packaging Fee</td>
                      <td className="py-4 text-right">-</td>
                      <td className="py-4 text-right">-</td>
                      <td className="py-4 text-right font-medium">
                        ฿{invoice.packaging_fee?.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72">
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span>฿{invoice.subtotal?.toLocaleString()}</span>
                  </div>
                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-slate-500">Tax</span>
                      <span>฿{invoice.tax_amount?.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between py-3">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ฿{invoice.total_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Footer */}
              <div className="grid md:grid-cols-2 gap-8 text-sm">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                    Payment Information
                  </h4>
                  {company.bankName && <p className="text-slate-600">Bank: {company.bankName}</p>}
                  {company.bankAccount && (
                    <p className="text-slate-600">Account: {company.bankAccount}</p>
                  )}
                  {company.bankAccountName && (
                    <p className="text-slate-600">Name: {company.bankAccountName}</p>
                  )}
                  <p className="text-slate-600 mt-2">
                    Method: {invoice.payment_method || 'PromptPay'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                    Company Details
                  </h4>
                  <p className="text-slate-600">{company.name}</p>
                  {company.address && <p className="text-slate-600">{company.address}</p>}
                  {company.email && <p className="text-slate-600">{company.email}</p>}
                  {company.taxId && <p className="text-slate-600">Tax ID: {company.taxId}</p>}
                </div>
              </div>

              <div className="text-center mt-8 pt-6 border-t border-slate-100">
                <p className="text-slate-500">Thank you for choosing {company.name}!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
