import { format } from 'date-fns';

export default function AWBTemplate({ data, settings }) {
  const { shipment } = data;
  const companyName = settings?.company_name || 'BKK-YGN Cargo';
  const companyAddress = settings?.address || 'Bangkok, Thailand';
  const companyPhone = settings?.phone || '';

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (_e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-[210mm] mx-auto bg-white text-slate-900 text-sm border-4 border-slate-900 p-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">AIR WAYBILL</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
            Non-Negotiable
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 uppercase tracking-wider">Tracking Number</p>
          <p className="text-3xl font-mono font-bold text-slate-900">{shipment.tracking_number}</p>
        </div>
      </div>

      {/* Shipper & Consignee Grid */}
      <div className="grid grid-cols-2 gap-0 border-2 border-slate-900 mb-6">
        <div className="p-4 border-r-2 border-slate-900">
          <h3 className="text-xs font-bold uppercase bg-slate-100 inline-block px-2 py-1 mb-3">
            Shipper
          </h3>
          <p className="font-bold text-lg">{companyName}</p>
          <p className="whitespace-pre-wrap text-slate-700 mt-1">{companyAddress}</p>
          <p className="text-slate-700 mt-2">{companyPhone}</p>
        </div>
        <div className="p-4">
          <h3 className="text-xs font-bold uppercase bg-slate-100 inline-block px-2 py-1 mb-3">
            Consignee
          </h3>
          <p className="font-bold text-lg">{shipment.customer_name}</p>
          <p className="whitespace-pre-wrap text-slate-700 mt-1">
            {shipment.delivery_address || 'Yangon, Myanmar'}
          </p>
          <p className="text-slate-700 mt-2">{shipment.customer_phone}</p>
        </div>
      </div>

      {/* Routing Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-slate-900 p-4 text-center bg-slate-50">
          <p className="text-xs font-bold uppercase text-slate-500 mb-1">Origin</p>
          <p className="text-4xl font-black text-slate-900">BKK</p>
          <p className="text-xs font-medium">Bangkok</p>
        </div>
        <div className="flex items-center justify-center">
          <div className="h-1 bg-slate-300 w-full relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
              ✈
            </div>
          </div>
        </div>
        <div className="border-2 border-slate-900 p-4 text-center bg-slate-50">
          <p className="text-xs font-bold uppercase text-slate-500 mb-1">Destination</p>
          <p className="text-4xl font-black text-slate-900">RGN</p>
          <p className="text-xs font-medium">Yangon</p>
        </div>
      </div>

      {/* Shipment Details Table */}
      <table className="w-full border-2 border-slate-900 mb-6">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-slate-900 text-xs uppercase">
            <th className="py-2 px-4 text-center border-r border-slate-300">Pieces</th>
            <th className="py-2 px-4 text-center border-r border-slate-300">Gross Weight</th>
            <th className="py-2 px-4 text-left border-r border-slate-300">Description of Goods</th>
            <th className="py-2 px-4 text-center">Service Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-4 px-4 text-center border-r border-slate-300 font-medium">1</td>
            <td className="py-4 px-4 text-center border-r border-slate-300 font-bold">
              {shipment.weight_kg} kg
            </td>
            <td className="py-4 px-4 border-r border-slate-300">
              <p className="font-medium">{shipment.items_description || 'General Cargo'}</p>
              {shipment.notes && (
                <p className="text-xs text-slate-500 mt-1 italic">{shipment.notes}</p>
              )}
            </td>
            <td className="py-4 px-4 text-center font-medium uppercase">
              {shipment.service_type?.replace(/_/g, ' ')}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between border-b border-slate-200 py-1">
            <span className="text-slate-500">Date Received:</span>
            <span className="font-medium">{formatDate(shipment.created_date)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 py-1">
            <span className="text-slate-500">Est. Delivery:</span>
            <span className="font-medium">{formatDate(shipment.estimated_delivery)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 py-1">
            <span className="text-slate-500">Insurance:</span>
            <span className="font-medium">{shipment.insurance_opted ? 'Yes' : 'No'}</span>
          </div>
        </div>
        <div className="bg-slate-50 p-4 border border-slate-200 rounded">
          <p className="text-xs font-bold uppercase text-slate-500 mb-2">Declared Value</p>
          <p className="text-xl font-bold">฿{(shipment.total_amount || 0).toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">For customs purposes only</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-12 pt-6 border-t-2 border-slate-900">
        <div className="grid grid-cols-2 gap-12">
          <div>
            <p className="text-xs font-bold uppercase mb-12">Shipper's Signature</p>
            <div className="border-b border-slate-900"></div>
            <p className="text-xs text-slate-500 mt-1">
              I certify that the particulars on the face hereof are correct and that insofar as any
              part of the consignment contains dangerous goods, such part is properly described by
              name and is in proper condition for carriage by air according to the applicable
              Dangerous Goods Regulations.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase mb-12">Carrier's Signature</p>
            <div className="border-b border-slate-900"></div>
            <p className="text-xs text-slate-500 mt-1">
              Executed on {format(new Date(), 'dd MMM yyyy')} at Bangkok, Thailand
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
