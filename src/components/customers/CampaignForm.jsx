import React, { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Megaphone, Users, Gift, Mail, MessageSquare } from 'lucide-react';

const segmentOptions = [
  { value: 'all', label: 'All Customers', description: 'Target everyone' },
  { value: 'individual', label: 'Individuals', description: 'Personal shippers' },
  { value: 'online_shopper', label: 'Online Shoppers', description: 'Shopping service users' },
  { value: 'sme_importer', label: 'SME Importers', description: 'Business customers' },
  { value: 'high_value', label: 'High Value', description: 'Top spending customers' },
  { value: 'inactive', label: 'Inactive', description: 'No orders in 30+ days' },
  { value: 'new_customers', label: 'New Customers', description: 'First-time users' },
];

const campaignTypes = [
  { value: 'discount', label: 'Discount Offer', icon: Gift },
  { value: 'referral', label: 'Referral Program', icon: Users },
  { value: 'promotion', label: 'General Promotion', icon: Megaphone },
  { value: 'announcement', label: 'Announcement', icon: MessageSquare },
  { value: 'loyalty', label: 'Loyalty Reward', icon: Gift },
];

const channels = [
  { value: 'all', label: 'All Channels' },
  { value: 'email', label: 'Email' },
  { value: 'line', label: 'LINE' },
  { value: 'facebook', label: 'Facebook Messenger' },
  { value: 'sms', label: 'SMS' },
];

const messageTemplates = {
  discount: `🎉 Special Offer for You!

Get {discount}% OFF your next shipment!
Use code: {code}

Valid until {end_date}

Book now: [link]`,
  referral: `📦 Share & Earn!

Refer a friend and BOTH get ฿50 off!
Your referral code: {code}

Share with friends today!`,
  promotion: `✨ Bangkok-Yangon Cargo

Fast & reliable shipping from Bangkok to Yangon.
Starting at just ฿95/kg!

📱 Contact us: [phone]`,
  announcement: `📢 Important Update

Dear valued customer,

{message}

Thank you for choosing us!`,
  loyalty: `⭐ Thank You for Being Loyal!

As one of our top customers, enjoy:
- {discount}% off all shipments
- Priority handling
- Free packaging

Code: {code}`,
};

export default function CampaignForm({ campaign, targetCount, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    target_segment: 'all',
    campaign_type: 'promotion',
    discount_percentage: 10,
    discount_code: '',
    message_template: messageTemplates.promotion,
    channel: 'all',
    start_date: '',
    end_date: '',
    budget: 0,
    ...campaign,
  });

  const handleTypeChange = (type) => {
    setForm({
      ...form,
      campaign_type: type,
      message_template: messageTemplates[type] || form.message_template,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      target_count: targetCount,
      discount_code: form.discount_code || `PROMO${Date.now().toString(36).toUpperCase()}`,
    });
  };

  const selectedSegment = segmentOptions.find((s) => s.value === form.target_segment);

  return (
    <Card className="border-0 shadow-xl max-h-[90vh] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between border-b sticky top-0 bg-white z-10">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-600" />
          {campaign ? 'Edit Campaign' : 'Create Campaign'}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name & Description */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., New Year Promotion"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the campaign"
              />
            </div>
          </div>

          {/* Target Segment */}
          <div className="space-y-3">
            <Label>Target Segment</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {segmentOptions.map((segment) => (
                <button
                  key={segment.value}
                  type="button"
                  onClick={() => setForm({ ...form, target_segment: segment.value })}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.target_segment === segment.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <p className="font-medium text-sm">{segment.label}</p>
                  <p className="text-xs text-slate-500">{segment.description}</p>
                </button>
              ))}
            </div>
            {targetCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  <strong>{targetCount}</strong> customers will receive this campaign
                </span>
              </div>
            )}
          </div>

          {/* Campaign Type */}
          <div className="space-y-3">
            <Label>Campaign Type</Label>
            <div className="flex flex-wrap gap-2">
              {campaignTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      form.campaign_type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-blue-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discount Settings */}
          {(form.campaign_type === 'discount' || form.campaign_type === 'loyalty') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Percentage</Label>
                <Select
                  value={form.discount_percentage.toString()}
                  onValueChange={(v) => setForm({ ...form, discount_percentage: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Code</Label>
                <Input
                  value={form.discount_code}
                  onChange={(e) =>
                    setForm({ ...form, discount_code: e.target.value.toUpperCase() })
                  }
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>
          )}

          {/* Channel */}
          <div className="space-y-2">
            <Label>Distribution Channel</Label>
            <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channels.map((ch) => (
                  <SelectItem key={ch.value} value={ch.value}>
                    {ch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* Message Template */}
          <div className="space-y-2">
            <Label>Message Template</Label>
            <Textarea
              value={form.message_template}
              onChange={(e) => setForm({ ...form, message_template: e.target.value })}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              Use {'{discount}'}, {'{code}'}, {'{end_date}'} as placeholders
            </p>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label>Budget (THB)</Label>
            <Input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })}
              placeholder="Optional"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              {campaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
