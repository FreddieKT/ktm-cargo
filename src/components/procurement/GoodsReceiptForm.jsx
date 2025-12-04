import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PackageCheck, X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function GoodsReceiptForm({ purchaseOrder, onSubmit, onCancel }) {
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (purchaseOrder?.items) {
      try {
        const poItems = JSON.parse(purchaseOrder.items);
        setItems(
          poItems.map((item) => ({
            item_name: item.name,
            ordered_qty: item.quantity,
            received_qty: item.quantity,
            condition: 'good',
            unit_price: item.unit_price,
          }))
        );
      } catch {
        setItems([]);
      }
    }
  }, [purchaseOrder]);

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const totalValue = items.reduce(
    (sum, item) => sum + (item.received_qty || 0) * (item.unit_price || 0),
    0
  );

  const hasDiscrepancy = items.some(
    (item) => item.received_qty !== item.ordered_qty || item.condition !== 'good'
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    const receiptNumber = `GR-${Date.now().toString(36).toUpperCase()}`;
    const qualityStatus = items.every((i) => i.condition === 'good')
      ? 'passed'
      : items.every((i) => i.condition === 'rejected')
        ? 'rejected'
        : 'partial_reject';

    onSubmit({
      receipt_number: receiptNumber,
      po_id: purchaseOrder.id,
      po_number: purchaseOrder.po_number,
      vendor_id: purchaseOrder.vendor_id,
      vendor_name: purchaseOrder.vendor_name,
      received_date: new Date().toISOString().split('T')[0],
      received_by: receivedBy,
      items_received: JSON.stringify(items),
      total_value: totalValue,
      quality_status: qualityStatus,
      notes,
      discrepancy_notes: hasDiscrepancy ? discrepancyNotes : '',
    });
  };

  if (!purchaseOrder) return null;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            Receive Goods
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            PO: {purchaseOrder.po_number} • {purchaseOrder.vendor_name}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Received By</Label>
            <Input
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Item</th>
                  <th className="text-center p-3 text-sm font-medium w-24">Ordered</th>
                  <th className="text-center p-3 text-sm font-medium w-28">Received</th>
                  <th className="text-center p-3 text-sm font-medium w-32">Condition</th>
                  <th className="text-center p-3 text-sm font-medium w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const isMatch =
                    item.received_qty === item.ordered_qty && item.condition === 'good';
                  return (
                    <tr key={idx} className="border-t">
                      <td className="p-3 font-medium">{item.item_name}</td>
                      <td className="p-3 text-center text-slate-500">{item.ordered_qty}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          max={item.ordered_qty}
                          value={item.received_qty}
                          onChange={(e) =>
                            updateItem(idx, 'received_qty', parseInt(e.target.value) || 0)
                          }
                          className="text-center"
                        />
                      </td>
                      <td className="p-3">
                        <Select
                          value={item.condition}
                          onValueChange={(v) => updateItem(idx, 'condition', v)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-center">
                        {isMatch ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasDiscrepancy && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Discrepancy Detected</span>
              </div>
              <Textarea
                value={discrepancyNotes}
                onChange={(e) => setDiscrepancyNotes(e.target.value)}
                placeholder="Please describe any discrepancies..."
                rows={2}
                className="bg-white"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this receipt..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <span className="text-slate-500">Total Value:</span>
              <span className="ml-2 text-xl font-bold text-emerald-600">
                ฿{totalValue.toLocaleString()}
              </span>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <PackageCheck className="w-4 h-4 mr-2" />
                Confirm Receipt
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
