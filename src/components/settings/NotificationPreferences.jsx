import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, Save, Loader2, Package, CreditCard, FileText, 
  Truck, ClipboardList, Users, AlertTriangle, DollarSign, PlusCircle
} from 'lucide-react';
import { toast } from 'sonner';

const NOTIFICATION_TYPES = [
  {
    key: 'shipment_created',
    label: 'New Shipment Created',
    description: 'When a new shipment is created in the system',
    icon: PlusCircle,
    color: 'text-emerald-600'
  },
  {
    key: 'shipment_status',
    label: 'Shipment Status Updates',
    description: 'When shipment status changes (picked up, in transit, delivered)',
    icon: Truck,
    color: 'text-blue-600'
  },
  {
    key: 'payment_received',
    label: 'Payment Received',
    description: 'When a payment is received for a shipment',
    icon: CreditCard,
    color: 'text-green-600'
  },
  {
    key: 'invoice_generated',
    label: 'Invoice Generated',
    description: 'When an invoice is automatically generated',
    icon: FileText,
    color: 'text-indigo-600'
  },
  {
    key: 'low_stock',
    label: 'Low Stock Alerts',
    description: 'When inventory items fall below reorder point',
    icon: AlertTriangle,
    color: 'text-amber-600'
  },
  {
    key: 'task_assigned',
    label: 'Task Assignments',
    description: 'When a task is assigned to you',
    icon: ClipboardList,
    color: 'text-purple-600'
  },
  {
    key: 'vendor_payment',
    label: 'Vendor Payouts',
    description: 'When vendor payout records are created',
    icon: DollarSign,
    color: 'text-orange-600'
  },
  {
    key: 'segment_alert',
    label: 'Customer Segment Alerts',
    description: 'Alerts about at-risk or lapsed customers',
    icon: Users,
    color: 'text-rose-600'
  }
];

export default function NotificationPreferences({ user }) {
  const queryClient = useQueryClient();
  
  const defaultPrefs = NOTIFICATION_TYPES.reduce((acc, type) => {
    acc[type.key] = { inApp: true, email: false };
    return acc;
  }, {});

  const [preferences, setPreferences] = useState(defaultPrefs);
  const [globalInApp, setGlobalInApp] = useState(true);
  const [globalEmail, setGlobalEmail] = useState(false);

  useEffect(() => {
    if (user?.notification_preferences) {
      setPreferences({ ...defaultPrefs, ...user.notification_preferences });
    }
    if (user?.notification_settings) {
      setGlobalInApp(user.notification_settings.in_app_enabled !== false);
      setGlobalEmail(user.notification_settings.email_enabled || false);
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Notification preferences saved');
    },
    onError: () => toast.error('Failed to save preferences')
  });

  const handleToggle = (key, channel) => {
    setPreferences(prev => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] }
    }));
  };

  const handleSave = () => {
    saveMutation.mutate({
      notification_preferences: preferences,
      notification_settings: {
        ...user?.notification_settings,
        in_app_enabled: globalInApp,
        email_enabled: globalEmail
      }
    });
  };

  const enableAll = (channel) => {
    const updated = { ...preferences };
    NOTIFICATION_TYPES.forEach(type => {
      updated[type.key] = { ...updated[type.key], [channel]: true };
    });
    setPreferences(updated);
  };

  const disableAll = (channel) => {
    const updated = { ...preferences };
    NOTIFICATION_TYPES.forEach(type => {
      updated[type.key] = { ...updated[type.key], [channel]: false };
    });
    setPreferences(updated);
  };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Global Notification Settings
          </CardTitle>
          <CardDescription>Master controls for all notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label className="font-medium">In-App Notifications</Label>
              <p className="text-sm text-slate-500">Show notifications in the bell icon</p>
            </div>
            <Switch checked={globalInApp} onCheckedChange={setGlobalInApp} />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label className="font-medium">Email Notifications</Label>
              <p className="text-sm text-slate-500">Send important alerts to your email</p>
            </div>
            <Switch checked={globalEmail} onCheckedChange={setGlobalEmail} />
          </div>
        </CardContent>
      </Card>

      {/* Individual Notification Types */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Notification Types</CardTitle>
              <CardDescription>Choose which events trigger notifications</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => enableAll('inApp')}>
                Enable All In-App
              </Button>
              <Button variant="outline" size="sm" onClick={() => disableAll('email')}>
                Disable All Email
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {NOTIFICATION_TYPES.map((type, idx) => {
            const Icon = type.icon;
            const prefs = preferences[type.key] || { inApp: true, email: false };
            
            return (
              <div key={type.key}>
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-100`}>
                      <Icon className={`w-5 h-5 ${type.color}`} />
                    </div>
                    <div>
                      <Label className="font-medium">{type.label}</Label>
                      <p className="text-sm text-slate-500">{type.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">In-App</span>
                      <Switch 
                        checked={prefs.inApp} 
                        onCheckedChange={() => handleToggle(type.key, 'inApp')}
                        disabled={!globalInApp}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Email</span>
                      <Switch 
                        checked={prefs.email} 
                        onCheckedChange={() => handleToggle(type.key, 'email')}
                        disabled={!globalEmail}
                      />
                    </div>
                  </div>
                </div>
                {idx < NOTIFICATION_TYPES.length - 1 && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saveMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}