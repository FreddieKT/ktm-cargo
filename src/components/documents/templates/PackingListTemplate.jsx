import React from 'react';
import { format } from 'date-fns';

export default function PackingListTemplate({ data, settings }) {
  const { shipment } = data;
  const companyName = settings?.company_name || 'BKK-YGN Cargo';

  return (
    <div className="max-w-[210mm] mx-auto bg-white text-slate-900 text-sm p-8">
      {/* Header */}
      <div className="flex justify-between items-end border-b-4 border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">PACKING LIST</h1>
          <p className="text-slate-500 mt-2 font-medium">{companyName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Date</p>
          <p className="font-medium">{format(new Date(), 'dd MMMM yyyy')}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
            Shipment Reference
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-600">Tracking Number</span>
              <span className="font-bold font-mono">{shipment.tracking_number}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-600">Service Type</span>
              <span className="font-medium capitalize">
                {shipment.service_type?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-600">Total Packages</span>
              <span className="font-medium">1</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
            Consignee
          </h3>
          <div className="bg-slate-50 p-4 rounded border border-slate-100">
            <p className="font-bold text-lg mb-1">{shipment.customer_name}</p>
            <p className="text-slate-600 whitespace-pre-wrap text-sm">
              {shipment.delivery_address || 'Yangon, Myanmar'}
            </p>
            <p className="text-slate-600 text-sm mt-2">{shipment.customer_phone}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="bg-slate-100 text-slate-600 text-xs uppercase">
            <th className="py-3 px-4 text-left font-bold rounded-l">Pkg #</th>
            <th className="py-3 px-4 text-left font-bold">Description of Goods</th>
            <th className="py-3 px-4 text-center font-bold">Quantity</th>
            <th className="py-3 px-4 text-right font-bold rounded-r">Net Weight</th>
          </tr>
        </thead>
        <tbody className="text-slate-700">
          <tr className="border-b border-slate-100">
            <td className="py-4 px-4 font-mono">001</td>
            <td className="py-4 px-4">
              <p className="font-medium text-slate-900">
                {shipment.items_description || 'General Cargo'}
              </p>
              {shipment.packaging_fee > 0 && (
                <p className="text-xs text-slate-500 mt-1">Professionally Packed</p>
              )}
            </td>
            <td className="py-4 px-4 text-center">1</td>
            <td className="py-4 px-4 text-right font-medium">{shipment.weight_kg} kg</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-slate-50">
            <td colSpan="3" className="py-3 px-4 text-right font-bold uppercase text-slate-600">
              Total Gross Weight
            </td>
            <td className="py-3 px-4 text-right font-bold text-lg text-slate-900">
              {shipment.weight_kg} kg
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer Info */}
      <div className="grid grid-cols-3 gap-6 mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500">
        <div>
          <p className="font-bold uppercase mb-1">Marks & Numbers</p>
          <p>Addressed to Consignee</p>
        </div>
        <div>
          <p className="font-bold uppercase mb-1">Place of Receipt</p>
          <p>Bangkok, Thailand</p>
        </div>
        <div>
          <p className="font-bold uppercase mb-1">Place of Delivery</p>
          <p>Yangon, Myanmar</p>
        </div>
      </div>
    </div>
  );
}
