import React, { useState, useMemo } from 'react';
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
import { Plus, Trash2, FileText, X, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseOrderForm({ vendors = [], existingPO, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    vendor_id: existingPO?.vendor_id || '',
    vendor_name: existingPO?.vendor_name || '',
    order_date: existingPO?.order_date || new Date().toISOString().split('T')[0],
    expected_delivery: existingPO?.expected_delivery || '',
    notes: existingPO?.notes || '',
    tax_amount: existingPO?.tax_amount || 0,
    shipping_cost: existingPO?.shipping_cost || 0,
    total_weight_kg: existingPO?.total_weight_kg || 0,
    cost_per_kg: existingPO?.cost_per_kg || 0,
  });

  const [items, setItems] = useState(() => {
    if (existingPO?.items) {
      try {
        return JSON.parse(existingPO.items);
      } catch {
        return [];
      }
    }
    return [{ name: '', quantity: 1, unit_price: 0, total: 0 }];
  });

  // Get recommended vendors (cargo carriers sorted by score)
  const recommendedVendors = useMemo(() => {
    return vendors
      .filter((v) => v.status === 'active' && v.vendor_type === 'cargo_carrier')
      .map((v) => {
        // Simple scoring based on: preferred status, pricing, on-time rate
        let score = 0;
        if (v.is_preferred) score += 30;
        score += (v.on_time_rate || 100) * 0.4;
        score += (v.rating || 5) * 6;
        if (v.cost_per_kg > 0) score += Math.max(0, 30 - v.cost_per_kg * 0.3);
        return { ...v, score: Math.min(100, score).toFixed(0) };
      })
      .sort((a, b) => b.score - a.score);
  }, [vendors]);

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total =
        (parseFloat(updated[index].quantity) || 0) * (parseFloat(updated[index].unit_price) || 0);
    }
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const total =
    subtotal + (parseFloat(formData.tax_amount) || 0) + (parseFloat(formData.shipping_cost) || 0);

  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    // Auto-fill cost per kg from vendor if available
    const suggestedCostPerKg = vendor?.cost_per_kg || formData.cost_per_kg;
    setFormData({
      ...formData,
      vendor_id: vendorId,
      vendor_name: vendor?.name || '',
      cost_per_kg: suggestedCostPerKg,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.vendor_id || items.every((i) => !i.name)) {
      toast.error('Please select a vendor and add at least one item');
      return;
    }

    const poNumber = existingPO?.po_number || `PO-${Date.now().toString(36).toUpperCase()}`;

    onSubmit({
      ...formData,
      po_number: poNumber,
      items: JSON.stringify(items),
      subtotal,
      total_amount: total,
      total_weight_kg: parseFloat(formData.total_weight_kg) || 0,
      cost_per_kg: parseFloat(formData.cost_per_kg) || 0,
      remaining_weight_kg: parseFloat(formData.total_weight_kg) || 0,
      allocated_weight_kg: existingPO?.allocated_weight_kg || 0,
      status: existingPO?.status || 'draft',
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          {existingPO ? 'Edit Purchase Order' : 'New Purchase Order'}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Vendor *</Label>
              <Select value={formData.vendor_id} onValueChange={handleVendorChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {recommendedVendors.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-slate-500 bg-slate-50">
                        <Zap className="w-3 h-3 inline mr-1" />
                        Recommended Carriers
                      </div>
                      {recommendedVendors.slice(0, 3).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <div className="flex items-center gap-2">
                            {v.is_preferred && <Star className="w-3 h-3 text-amber-500" />}
                            <span>{v.name}</span>
                            {v.cost_per_kg > 0 && (
                              <span className="text-xs text-slate-400">฿{v.cost_per_kg}/kg</span>
                            )}
                            <span className="text-xs text-emerald-600">({v.score} pts)</span>
                          </div>
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-medium text-slate-500 bg-slate-50">
                        All Vendors
                      </div>
                    </>
                  )}
                  {vendors
                    .filter((v) => !recommendedVendors.slice(0, 3).find((r) => r.id === v.id))
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex items-center gap-2">
                          {v.is_preferred && <Star className="w-3 h-3 text-amber-500" />}
                          <span>{v.name}</span>
                          {v.cost_per_kg > 0 && (
                            <span className="text-xs text-slate-400">฿{v.cost_per_kg}/kg</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formData.vendor_id &&
                (() => {
                  const selectedVendor = vendors.find((v) => v.id === formData.vendor_id);
                  if (selectedVendor?.is_preferred) {
                    return (
                      <Badge className="bg-amber-100 text-amber-800 text-xs">
                        <Star className="w-3 h-3 mr-1" /> Preferred Vendor
                      </Badge>
                    );
                  }
                  return null;
                })()}
            </div>
            <div className="space-y-2">
              <Label>Order Date</Label>
              <Input
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Delivery</Label>
              <Input
                type="date"
                value={formData.expected_delivery}
                onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
              />
            </div>
          </div>

          {/* Cargo Weight & Cost per KG */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label className="text-blue-800 font-medium mb-3 block">Cargo Weight & Pricing</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Cargo Weight (kg)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.total_weight_kg}
                  onChange={(e) =>
                    setFormData({ ...formData, total_weight_kg: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Total weight in kg"
                />
              </div>
              <div className="space-y-2">
                <Label>Cost per kg (฿)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_per_kg}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_per_kg: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Vendor cost per kg"
                />
              </div>
            </div>
            {formData.total_weight_kg > 0 && formData.cost_per_kg > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center text-sm">
                <span className="text-blue-700">Estimated Cargo Cost:</span>
                <span className="font-bold text-blue-800">
                  ฿{(formData.total_weight_kg * formData.cost_per_kg).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <Label>Order Items</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Item Description</th>
                    <th className="text-center p-3 text-sm font-medium w-24">Qty</th>
                    <th className="text-center p-3 text-sm font-medium w-32">Unit Price</th>
                    <th className="text-right p-3 text-sm font-medium w-32">Total</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          placeholder="Item name or description"
                          className="border-0 bg-transparent"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, 'quantity', parseInt(e.target.value) || 0)
                          }
                          className="text-center border-0 bg-transparent"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)
                          }
                          className="text-center border-0 bg-transparent"
                        />
                      </td>
                      <td className="p-2 text-right font-medium">฿{item.total.toLocaleString()}</td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal:</span>
                <span>฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Tax:</span>
                <Input
                  type="number"
                  min="0"
                  value={formData.tax_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-28 text-right"
                />
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Shipping:</span>
                <Input
                  type="number"
                  min="0"
                  value={formData.shipping_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })
                  }
                  className="w-28 text-right"
                />
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span className="text-blue-600">฿{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or instructions..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {existingPO ? 'Update Order' : 'Create Order'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
