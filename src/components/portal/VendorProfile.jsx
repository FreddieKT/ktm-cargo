import React, { useState } from 'react';
import { db } from '@/api/db';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Phone, Mail, CreditCard, Save, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function VendorProfile({ vendor, onUpdate }) {
  const [form, setForm] = useState({
    name: vendor?.name || '',
    vendor_type: vendor?.vendor_type || 'supplier',
    contact_name: vendor?.contact_name || '',
    phone: vendor?.phone || '',
    email: vendor?.email || '',
    address: vendor?.address || '',
    tax_id: vendor?.tax_id || '',
    bank_name: vendor?.bank_name || '',
    bank_account_number: vendor?.bank_account_number || '',
    bank_account_name: vendor?.bank_account_name || '',
    services: vendor?.services || '',
    payment_terms: vendor?.payment_terms || 'net_30',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => db.vendors.update(vendor.id, data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      onUpdate?.();
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (!vendor?.id) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="font-medium text-slate-900 mb-2">Profile Not Available</h3>
            <p className="text-slate-500">Your vendor profile is being set up.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{vendor?.name}</p>
                <p className="text-sm text-slate-500">{vendor?.vendor_type?.replace('_', ' ')}</p>
              </div>
            </div>
            <Badge
              className={
                vendor?.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : vendor?.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
              }
            >
              {vendor?.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label>Vendor Type</Label>
                <Select
                  value={form.vendor_type}
                  onValueChange={(v) => updateField('vendor_type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cargo_carrier">Cargo Carrier</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="customs_broker">Customs Broker</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Business Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Tax ID</Label>
              <Input value={form.tax_id} onChange={(e) => updateField('tax_id', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input
                value={form.contact_name}
                onChange={(e) => updateField('contact_name', e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Phone
                </Label>
                <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Banking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={form.bank_name}
                onChange={(e) => updateField('bank_name', e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={form.bank_account_number}
                  onChange={(e) => updateField('bank_account_number', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  value={form.bank_account_name}
                  onChange={(e) => updateField('bank_account_name', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select
                value={form.payment_terms}
                onValueChange={(v) => updateField('payment_terms', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="net_15">Net 15 Days</SelectItem>
                  <SelectItem value="net_30">Net 30 Days</SelectItem>
                  <SelectItem value="net_60">Net 60 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.services}
              onChange={(e) => updateField('services', e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
