import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Phone, Mail, Package, TrendingUp, Star } from 'lucide-react';
import { format } from 'date-fns';

const typeConfig = {
  individual: { label: 'Individual', color: 'bg-blue-100 text-blue-800' },
  online_shopper: { label: 'Online Shopper', color: 'bg-purple-100 text-purple-800' },
  sme_importer: { label: 'SME Importer', color: 'bg-amber-100 text-amber-800' },
};

const valueLabels = {
  high: { label: 'High Value', color: 'bg-emerald-100 text-emerald-800' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  low: { label: 'New/Low', color: 'bg-slate-100 text-slate-800' },
};

export default function CustomerSegmentTable({
  customers,
  shipments,
  selectedCustomers,
  onSelectCustomer,
  onSelectAll,
}) {
  // Calculate customer metrics
  const customersWithMetrics = customers.map((customer) => {
    const customerShipments = shipments.filter(
      (s) => s.customer_name === customer.name || s.customer_phone === customer.phone
    );
    const totalSpent = customerShipments.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const shipmentCount = customerShipments.length;
    const lastShipment =
      customerShipments.length > 0
        ? customerShipments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0]
        : null;

    // Determine value tier
    let valueTier = 'low';
    if (totalSpent > 50000 || shipmentCount > 10) valueTier = 'high';
    else if (totalSpent > 10000 || shipmentCount > 3) valueTier = 'medium';

    return {
      ...customer,
      totalSpent,
      shipmentCount,
      lastShipment,
      valueTier,
    };
  });

  const allSelected = customers.length > 0 && selectedCustomers.length === customers.length;

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-12">
              <Checkbox checked={allSelected} onCheckedChange={(checked) => onSelectAll(checked)} />
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Segment</TableHead>
            <TableHead>Value Tier</TableHead>
            <TableHead className="text-right">Shipments</TableHead>
            <TableHead className="text-right">Total Spent</TableHead>
            <TableHead>Last Activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customersWithMetrics.map((customer) => {
            const typeConf = typeConfig[customer.customer_type] || typeConfig.individual;
            const valueConf = valueLabels[customer.valueTier];
            const isSelected = selectedCustomers.includes(customer.id);

            return (
              <TableRow
                key={customer.id}
                className={`hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}`}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectCustomer(customer.id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="font-semibold text-slate-600 text-sm">
                        {customer.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{customer.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={typeConf.color}>{typeConf.label}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={valueConf.color}>
                    {customer.valueTier === 'high' && <Star className="w-3 h-3 mr-1" />}
                    {valueConf.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{customer.shipmentCount}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-emerald-600">
                    ฿{customer.totalSpent.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  {customer.lastShipment ? (
                    <span className="text-sm text-slate-500">
                      {format(new Date(customer.lastShipment.created_date), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">No activity</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {customers.length === 0 && (
        <div className="text-center py-12 text-slate-500">No customers in this segment</div>
      )}
    </div>
  );
}
