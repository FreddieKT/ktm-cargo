import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, Mail, MapPin, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerProfile({ customer, onUpdate }) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address_bangkok: customer?.address_bangkok || '',
    address_yangon: customer?.address_yangon || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      if (!customer?.id) {
        toast.error('No customer profile found');
        return Promise.reject('No customer ID');
      }
      return base44.entities.Customer.update(customer.id, data);
    },
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

  if (!customer?.id) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="font-medium text-slate-900 mb-2">Profile Not Available</h3>
            <p className="text-slate-500">Your profile is being set up. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            My Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Phone Number
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+66..."
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Default Pickup Address (Bangkok)
              </Label>
              <Textarea
                value={form.address_bangkok}
                onChange={(e) => setForm({ ...form, address_bangkok: e.target.value })}
                placeholder="Your Bangkok address for pickups"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Default Delivery Address (Yangon)
              </Label>
              <Textarea
                value={form.address_yangon}
                onChange={(e) => setForm({ ...form, address_yangon: e.target.value })}
                placeholder="Your Yangon address for deliveries"
                rows={2}
              />
            </div>

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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
