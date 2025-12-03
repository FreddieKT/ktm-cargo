import React from 'react';
import { format } from 'date-fns';

export default function InvoiceTemplate({ data, settings }) {
    const { invoice, customer } = data;
    const companyName = settings?.company_name || 'BKK-YGN Cargo';
    const companyAddress = settings?.address || 'Bangkok, Thailand';
    const companyPhone = settings?.phone || '';
    const companyEmail = settings?.email || '';
    const logoUrl = settings?.logo_url;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="max-w-[210mm] mx-auto bg-white text-slate-900 text-sm leading-relaxed">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                <div className="flex gap-4 items-center">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
                    ) : (
                        <div className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center text-2xl font-bold rounded">
                            BY
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{companyName}</h1>
                        <p className="text-slate-600 max-w-xs text-xs mt-1">{companyAddress}</p>
                        <div className="flex gap-3 text-xs text-slate-500 mt-2">
                            {companyPhone && <span>{companyPhone}</span>}
                            {companyEmail && <span>{companyEmail}</span>}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-bold text-slate-200 tracking-widest uppercase">Invoice</h2>
                    <p className="text-lg font-bold text-slate-900 mt-2">{invoice.invoice_number}</p>
                    <div className="mt-4 space-y-1 text-xs">
                        <div className="flex justify-end gap-4">
                            <span className="text-slate-500">Date:</span>
                            <span className="font-medium">{formatDate(invoice.invoice_date)}</span>
                        </div>
                        <div className="flex justify-end gap-4">
                            <span className="text-slate-500">Due Date:</span>
                            <span className="font-medium">{formatDate(invoice.due_date)}</span>
                        </div>
                        <div className="flex justify-end gap-4">
                            <span className="text-slate-500">Status:</span>
                            <span className={`font-bold uppercase ${invoice.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {invoice.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bill To */}
            <div className="flex justify-between mb-12">
                <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Bill To</h3>
                    <p className="font-bold text-lg">{invoice.customer_name}</p>
                    <div className="text-slate-600 mt-1 space-y-0.5">
                        {invoice.customer_email && <p>{invoice.customer_email}</p>}
                        {invoice.customer_phone && <p>{invoice.customer_phone}</p>}
                        {customer?.address && <p className="max-w-xs">{customer.address}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Shipment Details</h3>
                    <div className="space-y-1 text-slate-600">
                        {invoice.tracking_number && (
                            <p>Tracking #: <span className="font-medium text-slate-900">{invoice.tracking_number}</span></p>
                        )}
                        {invoice.order_number && (
                            <p>Order #: <span className="font-medium text-slate-900">{invoice.order_number}</span></p>
                        )}
                        <p>Service: <span className="font-medium text-slate-900 capitalize">{invoice.service_type?.replace(/_/g, ' ')}</span></p>
                        {invoice.weight_kg > 0 && (
                            <p>Weight: <span className="font-medium text-slate-900">{invoice.weight_kg} kg</span></p>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-slate-900">
                        <th className="text-left py-3 font-bold text-xs uppercase tracking-wider">Description</th>
                        <th className="text-right py-3 font-bold text-xs uppercase tracking-wider w-32">Amount</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700">
                    {invoice.product_cost > 0 && (
                        <tr className="border-b border-slate-100">
                            <td className="py-4">
                                <p className="font-medium text-slate-900">Product Cost</p>
                                <p className="text-xs text-slate-500">Cost of goods purchased</p>
                            </td>
                            <td className="py-4 text-right">฿{invoice.product_cost.toLocaleString()}</td>
                        </tr>
                    )}
                    {invoice.shipping_amount > 0 && (
                        <tr className="border-b border-slate-100">
                            <td className="py-4">
                                <p className="font-medium text-slate-900">Shipping Charges</p>
                                {invoice.weight_kg > 0 && invoice.price_per_kg > 0 && (
                                    <p className="text-xs text-slate-500">{invoice.weight_kg} kg × ฿{invoice.price_per_kg}/kg</p>
                                )}
                            </td>
                            <td className="py-4 text-right">฿{invoice.shipping_amount.toLocaleString()}</td>
                        </tr>
                    )}
                    {invoice.commission_amount > 0 && (
                        <tr className="border-b border-slate-100">
                            <td className="py-4">
                                <p className="font-medium text-slate-900">Service Commission</p>
                            </td>
                            <td className="py-4 text-right">฿{invoice.commission_amount.toLocaleString()}</td>
                        </tr>
                    )}
                    {invoice.insurance_amount > 0 && (
                        <tr className="border-b border-slate-100">
                            <td className="py-4">
                                <p className="font-medium text-slate-900">Insurance</p>
                                <p className="text-xs text-slate-500">Shipping insurance coverage</p>
                            </td>
                            <td className="py-4 text-right">฿{invoice.insurance_amount.toLocaleString()}</td>
                        </tr>
                    )}
                    {invoice.packaging_fee > 0 && (
                        <tr className="border-b border-slate-100">
                            <td className="py-4">
                                <p className="font-medium text-slate-900">Packaging Fee</p>
                            </td>
                            <td className="py-4 text-right">฿{invoice.packaging_fee.toLocaleString()}</td>
                        </tr>
                    )}
                    {invoice.tax_amount > 0 && (
                        <tr className="border-b border-slate-100">
                            <td className="py-4">
                                <p className="font-medium text-slate-900">Tax / VAT</p>
                            </td>
                            <td className="py-4 text-right">฿{invoice.tax_amount.toLocaleString()}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-2">
                        <span>Subtotal</span>
                        <span>฿{(invoice.subtotal || invoice.total_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-bold text-2xl text-blue-600">฿{(invoice.total_amount || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Notes & Footer */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-8">
                <div>
                    <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">Payment Info</h4>
                    <p className="text-sm font-medium">Bank Transfer / PromptPay</p>
                    <p className="text-sm text-slate-600 mt-1">Please include invoice number in transfer details.</p>
                </div>
                {invoice.notes && (
                    <div>
                        <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">Notes</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                )}
            </div>

            <div className="mt-16 text-center text-xs text-slate-400">
                <p>Thank you for your business!</p>
                <p className="mt-1">{companyName} • {companyAddress}</p>
            </div>
        </div>
    );
}
