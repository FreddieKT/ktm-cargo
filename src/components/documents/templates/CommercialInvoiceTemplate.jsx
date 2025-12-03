import React from 'react';
import { format } from 'date-fns';

export default function CommercialInvoiceTemplate({ data, settings }) {
    const { shipment } = data;
    const companyName = settings?.company_name || 'BKK-YGN Cargo';
    const companyAddress = settings?.address || 'Bangkok, Thailand';
    const companyPhone = settings?.phone || '';

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'dd MMM yyyy');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="max-w-[210mm] mx-auto bg-white text-slate-900 text-sm p-8 font-serif">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">Commercial Invoice</h1>
                <p className="text-slate-600 font-medium">{companyName}</p>
                <p className="text-slate-500 text-xs">{companyAddress}</p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                    <div className="border p-4 rounded bg-slate-50">
                        <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Exporter</h3>
                        <p className="font-bold">{companyName}</p>
                        <p className="text-slate-600 whitespace-pre-wrap">{companyAddress}</p>
                        <p className="text-slate-600">{companyPhone}</p>
                    </div>
                    <div className="border p-4 rounded bg-slate-50">
                        <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Consignee</h3>
                        <p className="font-bold">{shipment.customer_name}</p>
                        <p className="text-slate-600 whitespace-pre-wrap">{shipment.delivery_address || 'Yangon, Myanmar'}</p>
                        <p className="text-slate-600">{shipment.customer_phone}</p>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="border p-4 rounded">
                        <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Invoice Details</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-slate-600">Invoice No:</span>
                            <span className="font-bold font-mono">INV-{shipment.tracking_number}</span>
                            <span className="text-slate-600">Date:</span>
                            <span className="font-medium">{format(new Date(), 'dd MMM yyyy')}</span>
                            <span className="text-slate-600">AWB No:</span>
                            <span className="font-medium">{shipment.tracking_number}</span>
                            <span className="text-slate-600">Terms:</span>
                            <span className="font-medium">DDP (Delivered Duty Paid)</span>
                        </div>
                    </div>
                    <div className="border p-4 rounded">
                        <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Shipment Info</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-slate-600">Origin:</span>
                            <span className="font-medium">Bangkok, Thailand</span>
                            <span className="text-slate-600">Destination:</span>
                            <span className="font-medium">Yangon, Myanmar</span>
                            <span className="text-slate-600">Total Weight:</span>
                            <span className="font-medium">{shipment.weight_kg} kg</span>
                            <span className="text-slate-600">Packages:</span>
                            <span className="font-medium">1</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse mb-8">
                <thead>
                    <tr className="bg-slate-900 text-white">
                        <th className="py-2 px-4 text-left font-medium text-xs uppercase">Item / Description</th>
                        <th className="py-2 px-4 text-center font-medium text-xs uppercase">HS Code</th>
                        <th className="py-2 px-4 text-center font-medium text-xs uppercase">Qty</th>
                        <th className="py-2 px-4 text-right font-medium text-xs uppercase">Unit Value</th>
                        <th className="py-2 px-4 text-right font-medium text-xs uppercase">Total Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b">
                        <td className="py-4 px-4">
                            <p className="font-bold">{shipment.items_description || 'General Cargo'}</p>
                            <p className="text-xs text-slate-500">Personal Effects / Commercial Goods</p>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-500">-</td>
                        <td className="py-4 px-4 text-center">1</td>
                        <td className="py-4 px-4 text-right">฿{(shipment.total_amount || 0).toLocaleString()}</td>
                        <td className="py-4 px-4 text-right font-medium">฿{(shipment.total_amount || 0).toLocaleString()}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr className="bg-slate-50">
                        <td colSpan="4" className="py-3 px-4 text-right font-bold uppercase">Total Invoice Value</td>
                        <td className="py-3 px-4 text-right font-bold text-lg">฿{(shipment.total_amount || 0).toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Declaration */}
            <div className="mb-12">
                <h4 className="font-bold uppercase text-xs mb-2">Declaration</h4>
                <p className="text-slate-600 text-xs leading-relaxed border p-4 rounded bg-slate-50">
                    We hereby certify that this invoice shows the full value of the goods mentioned above and that such value is true and correct.
                    We further certify that the goods are of Thailand origin.
                </p>
            </div>

            {/* Signatures */}
            <div className="flex justify-between mt-16 px-8">
                <div className="text-center">
                    <div className="border-b border-slate-900 w-48 mb-2"></div>
                    <p className="text-xs font-bold uppercase">Authorized Signature</p>
                    <p className="text-xs text-slate-500">{companyName}</p>
                </div>
                <div className="text-center">
                    <div className="border-b border-slate-900 w-48 mb-2"></div>
                    <p className="text-xs font-bold uppercase">Date</p>
                </div>
            </div>
        </div>
    );
}
