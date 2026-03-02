import { format } from 'date-fns';

export default function CustomsDeclarationTemplate({ data, settings }) {
  const { shipment } = data;
  const companyName = settings?.company_name || 'BKK-YGN Cargo';
  const companyAddress = settings?.address || 'Bangkok, Thailand';

  return (
    <div className="max-w-[210mm] mx-auto bg-white text-slate-900 text-sm p-8 font-sans">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
        <h1 className="text-2xl font-bold uppercase">Customs Declaration</h1>
        <p className="text-slate-600">Export / Import Manifest</p>
      </div>

      {/* Reference Box */}
      <div className="flex justify-between bg-slate-100 p-4 rounded mb-8 border border-slate-200">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Declaration Reference</p>
          <p className="font-mono font-bold text-lg">CD-{shipment.tracking_number}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase text-slate-500">Date</p>
          <p className="font-medium">{format(new Date(), 'dd MMM yyyy')}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="border p-4 rounded">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 border-b pb-1">
            Exporter
          </h3>
          <p className="font-bold">{companyName}</p>
          <p className="text-sm text-slate-600">{companyAddress}</p>
        </div>
        <div className="border p-4 rounded">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 border-b pb-1">
            Importer / Consignee
          </h3>
          <p className="font-bold">{shipment.customer_name}</p>
          <p className="text-sm text-slate-600">{shipment.delivery_address || 'Yangon, Myanmar'}</p>
        </div>
      </div>

      {/* Goods Details */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase mb-2">Description of Goods</h3>
        <table className="w-full border-collapse border border-slate-300">
          <thead className="bg-slate-50">
            <tr>
              <th className="border border-slate-300 py-2 px-3 text-left text-xs uppercase">
                Description
              </th>
              <th className="border border-slate-300 py-2 px-3 text-center text-xs uppercase w-24">
                HS Code
              </th>
              <th className="border border-slate-300 py-2 px-3 text-center text-xs uppercase w-20">
                Qty
              </th>
              <th className="border border-slate-300 py-2 px-3 text-right text-xs uppercase w-24">
                Weight
              </th>
              <th className="border border-slate-300 py-2 px-3 text-right text-xs uppercase w-32">
                Value (THB)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 py-3 px-3">
                <p className="font-medium">{shipment.items_description || 'General Cargo'}</p>
              </td>
              <td className="border border-slate-300 py-3 px-3 text-center text-slate-500">-</td>
              <td className="border border-slate-300 py-3 px-3 text-center">1</td>
              <td className="border border-slate-300 py-3 px-3 text-right">
                {shipment.weight_kg} kg
              </td>
              <td className="border border-slate-300 py-3 px-3 text-right">
                ฿{(shipment.total_amount || 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold">
              <td
                colSpan="4"
                className="border border-slate-300 py-2 px-3 text-right uppercase text-xs"
              >
                Total Declared Value
              </td>
              <td className="border border-slate-300 py-2 px-3 text-right">
                ฿{(shipment.total_amount || 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legal Declaration */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded mb-12 text-sm text-amber-900">
        <p className="font-bold mb-1">I hereby declare that:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>The information provided in this declaration is true and correct.</li>
          <li>
            The goods described above comply with all applicable export regulations of Thailand.
          </li>
          <li>The goods do not contain any prohibited or restricted items.</li>
        </ol>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 mt-8">
        <div>
          <div className="border-b border-slate-400 h-24 mb-2"></div>
          <p className="text-xs font-bold uppercase text-center">Signature of Declarant</p>
        </div>
        <div>
          <div className="border-b border-slate-400 h-24 mb-2"></div>
          <p className="text-xs font-bold uppercase text-center">Customs Officer Stamp</p>
        </div>
      </div>
    </div>
  );
}
