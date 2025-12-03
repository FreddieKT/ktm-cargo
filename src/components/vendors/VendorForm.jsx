import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Scale, Clock, Star } from 'lucide-react';

const vendorTypes = [
  { value: 'cargo_carrier', label: 'Cargo Carrier' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'customs_broker', label: 'Customs Broker' },
  { value: 'warehouse', label: 'Warehouse' },
];

export default function VendorForm({ vendor, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    vendor_type: 'supplier',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    services: '',
    contract_start: '',
    contract_end: '',
    payment_terms: 'net_30',
    status: 'active',
    notes: '',
    // Pricing tiers
    cost_per_kg: 0,
    cost_per_kg_express: 0,
    cost_per_kg_bulk: 0,
    bulk_threshold_kg: 100,
    // Capacity
    monthly_capacity_kg: 0,
    current_month_allocated_kg: 0,
    min_order_kg: 0,
    lead_time_days: 3,
    // Preferred status
    is_preferred: false,
    rating: 5
  });

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name || '',
        vendor_type: vendor.vendor_type || 'supplier',
        contact_name: vendor.contact_name || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        address: vendor.address || '',
        services: vendor.services || '',
        contract_start: vendor.contract_start || '',
        contract_end: vendor.contract_end || '',
        payment_terms: vendor.payment_terms || 'net_30',
        status: vendor.status || 'active',
        notes: vendor.notes || '',
        cost_per_kg: vendor.cost_per_kg || 0,
        cost_per_kg_express: vendor.cost_per_kg_express || 0,
        cost_per_kg_bulk: vendor.cost_per_kg_bulk || 0,
        bulk_threshold_kg: vendor.bulk_threshold_kg || 100,
        monthly_capacity_kg: vendor.monthly_capacity_kg || 0,
        current_month_allocated_kg: vendor.current_month_allocated_kg || 0,
        min_order_kg: vendor.min_order_kg || 0,
        lead_time_days: vendor.lead_time_days || 3,
        is_preferred: vendor.is_preferred || false,
        rating: vendor.rating || 5
      });
    }
  }, [vendor]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      cost_per_kg: parseFloat(form.cost_per_kg) || 0,
      cost_per_kg_express: parseFloat(form.cost_per_kg_express) || 0,
      cost_per_kg_bulk: parseFloat(form.cost_per_kg_bulk) || 0,
      bulk_threshold_kg: parseFloat(form.bulk_threshold_kg) || 100,
      monthly_capacity_kg: parseFloat(form.monthly_capacity_kg) || 0,
      min_order_kg: parseFloat(form.min_order_kg) || 0,
      lead_time_days: parseInt(form.lead_time_days) || 3,
      rating: parseFloat(form.rating) || 5
    });
  };

  const capacityUsedPercent = form.monthly_capacity_kg > 0 
    ? ((form.current_month_allocated_kg / form.monthly_capacity_kg) * 100).toFixed(1)
    : 0;

  return (
    <Card className="border-0 shadow-lg max-h-[85vh] overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{vendor ? 'Edit Vendor' : 'Add New Vendor'}</CardTitle>
          {vendor?.is_preferred && (
            <Badge className="bg-amber-100 text-amber-800">
              <Star className="w-3 h-3 mr-1" /> Preferred
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Tiers</TabsTrigger>
              <TabsTrigger value="capacity">Capacity</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vendor Type</Label>
                  <Select value={form.vendor_type} onValueChange={(v) => setForm({ ...form, vendor_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {vendorTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select value={form.payment_terms} onValueChange={(v) => setForm({ ...form, payment_terms: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="net_15">Net 15</SelectItem>
                      <SelectItem value="net_30">Net 30</SelectItem>
                      <SelectItem value="net_60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Start</Label>
                  <Input
                    type="date"
                    value={form.contract_start}
                    onChange={(e) => setForm({ ...form, contract_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract End</Label>
                  <Input
                    type="date"
                    value={form.contract_end}
                    onChange={(e) => setForm({ ...form, contract_end: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Services Provided</Label>
                  <Textarea
                    value={form.services}
                    onChange={(e) => setForm({ ...form, services: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-600" />
                    <Label className="text-amber-800 font-medium">Preferred Vendor</Label>
                  </div>
                  <Switch
                    checked={form.is_preferred}
                    onCheckedChange={(v) => setForm({ ...form, is_preferred: v })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Pricing Tiers Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-800">Pricing Tiers</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 p-3 bg-white rounded-lg">
                    <Label className="text-sm text-slate-600">Standard Rate</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">฿</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.cost_per_kg}
                        onChange={(e) => setForm({ ...form, cost_per_kg: e.target.value })}
                        placeholder="0.00"
                      />
                      <span className="text-slate-500">/kg</span>
                    </div>
                  </div>
                  <div className="space-y-2 p-3 bg-white rounded-lg">
                    <Label className="text-sm text-slate-600">Express Rate</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">฿</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.cost_per_kg_express}
                        onChange={(e) => setForm({ ...form, cost_per_kg_express: e.target.value })}
                        placeholder="0.00"
                      />
                      <span className="text-slate-500">/kg</span>
                    </div>
                  </div>
                  <div className="space-y-2 p-3 bg-white rounded-lg">
                    <Label className="text-sm text-slate-600">Bulk Rate</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">฿</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.cost_per_kg_bulk}
                        onChange={(e) => setForm({ ...form, cost_per_kg_bulk: e.target.value })}
                        placeholder="0.00"
                      />
                      <span className="text-slate-500">/kg</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label className="text-sm text-slate-600">Bulk Threshold (kg)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.bulk_threshold_kg}
                    onChange={(e) => setForm({ ...form, bulk_threshold_kg: e.target.value })}
                    placeholder="Minimum kg for bulk pricing"
                    className="max-w-xs"
                  />
                  <p className="text-xs text-slate-500">Orders above this weight qualify for bulk pricing</p>
                </div>
              </div>

              {/* Pricing Summary */}
              {(form.cost_per_kg > 0 || form.cost_per_kg_express > 0 || form.cost_per_kg_bulk > 0) && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-3">Pricing Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Standard</p>
                      <p className="font-bold text-lg">฿{parseFloat(form.cost_per_kg || 0).toFixed(2)}/kg</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Express</p>
                      <p className="font-bold text-lg text-amber-600">฿{parseFloat(form.cost_per_kg_express || 0).toFixed(2)}/kg</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Bulk ({form.bulk_threshold_kg}+ kg)</p>
                      <p className="font-bold text-lg text-emerald-600">฿{parseFloat(form.cost_per_kg_bulk || 0).toFixed(2)}/kg</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Capacity Tab */}
            <TabsContent value="capacity" className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-medium text-emerald-800">Capacity Management</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Capacity (kg)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.monthly_capacity_kg}
                      onChange={(e) => setForm({ ...form, monthly_capacity_kg: e.target.value })}
                      placeholder="Max kg per month"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Order (kg)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.min_order_kg}
                      onChange={(e) => setForm({ ...form, min_order_kg: e.target.value })}
                      placeholder="Minimum order weight"
                    />
                  </div>
                </div>

                {vendor && form.monthly_capacity_kg > 0 && (
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Current Month Usage</span>
                      <span className="font-medium">{form.current_month_allocated_kg} / {form.monthly_capacity_kg} kg</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${parseFloat(capacityUsedPercent) > 80 ? 'bg-rose-500' : parseFloat(capacityUsedPercent) > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, capacityUsedPercent)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {capacityUsedPercent}% capacity used • {Math.max(0, form.monthly_capacity_kg - form.current_month_allocated_kg)} kg available
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-purple-800">Lead Time & Performance</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lead Time (days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.lead_time_days}
                      onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })}
                      placeholder="Average days"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rating (1-5)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              {vendor ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}