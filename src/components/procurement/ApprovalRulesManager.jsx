import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Shield, Zap, Users, DollarSign, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const RULE_TYPES = {
  auto_approve: { label: 'Auto-Approve', icon: Zap, color: 'bg-emerald-100 text-emerald-800' },
  amount_threshold: {
    label: 'Amount Threshold',
    icon: DollarSign,
    color: 'bg-blue-100 text-blue-800',
  },
  vendor_tier: { label: 'Vendor Type', icon: Users, color: 'bg-purple-100 text-purple-800' },
};

export default function ApprovalRulesManager({ rules = [], onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, rule: null });
  const [editConfirm, setEditConfirm] = useState({ open: false, rule: null });
  const [formData, setFormData] = useState({
    name: '',
    rule_type: 'amount_threshold',
    min_amount: 0,
    max_amount: '',
    vendor_types: '',
    approver_email: '',
    approver_name: '',
    approval_level: 1,
    auto_approve: false,
    is_active: true,
    priority: 1,
  });

  const openForm = (rule = null) => {
    if (rule) {
      setFormData({ ...rule, max_amount: rule.max_amount || '' });
      setEditingRule(rule);
    } else {
      setFormData({
        name: '',
        rule_type: 'amount_threshold',
        min_amount: 0,
        max_amount: '',
        vendor_types: '',
        approver_email: '',
        approver_name: '',
        approval_level: 1,
        auto_approve: false,
        is_active: true,
        priority: 1,
      });
      setEditingRule(null);
    }
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
      min_amount: parseFloat(formData.min_amount) || 0,
    };

    if (editingRule) {
      onUpdate?.(editingRule.id, data);
    } else {
      onAdd?.(data);
    }
    setShowForm(false);
    toast.success(editingRule ? 'Rule updated' : 'Rule created');
  };

  const sortedRules = [...rules].sort((a, b) => (a.priority || 1) - (b.priority || 1));

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Approval Rules
            </CardTitle>
            <CardDescription>Configure automatic routing and approval thresholds</CardDescription>
          </div>
          <Button onClick={() => openForm()} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          {sortedRules.length > 0 ? (
            <div className="space-y-3">
              {sortedRules.map((rule, idx) => {
                const typeConfig = RULE_TYPES[rule.rule_type] || RULE_TYPES.amount_threshold;
                const TypeIcon = typeConfig.icon;

                return (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${rule.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                        {rule.priority || idx + 1}
                      </div>
                      <div className={`p-2 rounded-lg ${typeConfig.color.split(' ')[0]}`}>
                        <TypeIcon className={`w-5 h-5 ${typeConfig.color.split(' ')[1]}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{rule.name}</p>
                          <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                          {rule.auto_approve && (
                            <Badge className="bg-emerald-100 text-emerald-800">
                              <Zap className="w-3 h-3 mr-1" /> Auto
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                          {rule.rule_type === 'amount_threshold' && (
                            <span>
                              ฿{(rule.min_amount || 0).toLocaleString()}
                              {rule.max_amount ? ` - ฿${rule.max_amount.toLocaleString()}` : '+'}
                            </span>
                          )}
                          {rule.rule_type === 'vendor_tier' && (
                            <span className="capitalize">
                              {rule.vendor_types?.replace(/,/g, ', ')}
                            </span>
                          )}
                          {rule.rule_type === 'auto_approve' && (
                            <span>Up to ฿{(rule.max_amount || 0).toLocaleString()}</span>
                          )}
                          {!rule.auto_approve && rule.approver_name && (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <span>
                                Level {rule.approval_level}: {rule.approver_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          rule.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }
                      >
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditConfirm({ open: true, rule })}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-600"
                        onClick={() => setDeleteConfirm({ open: true, rule })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No approval rules configured</p>
              <p className="text-sm text-slate-400 mt-1">Add rules to automate PO approvals</p>
              <Button className="mt-4" onClick={() => openForm()}>
                <Plus className="w-4 h-4 mr-2" /> Create First Rule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'New Approval Rule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Small Orders Auto-Approve"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select
                value={formData.rule_type}
                onValueChange={(v) => setFormData({ ...formData, rule_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_approve">Auto-Approve (No approval needed)</SelectItem>
                  <SelectItem value="amount_threshold">Amount Threshold</SelectItem>
                  <SelectItem value="vendor_tier">Vendor Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.rule_type === 'amount_threshold' ||
              formData.rule_type === 'auto_approve') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Amount (฿)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Amount (฿)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.max_amount}
                    onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                    placeholder="No limit"
                  />
                </div>
              </div>
            )}

            {formData.rule_type === 'vendor_tier' && (
              <div className="space-y-2">
                <Label>Vendor Types (comma-separated)</Label>
                <Input
                  value={formData.vendor_types}
                  onChange={(e) => setFormData({ ...formData, vendor_types: e.target.value })}
                  placeholder="e.g., cargo_carrier, supplier"
                />
              </div>
            )}

            {formData.rule_type === 'auto_approve' && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div>
                  <Label className="text-emerald-800">Auto-Approve</Label>
                  <p className="text-sm text-emerald-600">
                    Orders matching this rule are approved instantly
                  </p>
                </div>
                <Switch
                  checked={formData.auto_approve}
                  onCheckedChange={(v) => setFormData({ ...formData, auto_approve: v })}
                />
              </div>
            )}

            {!formData.auto_approve && formData.rule_type !== 'auto_approve' && (
              <>
                <div className="space-y-2">
                  <Label>Approval Level</Label>
                  <Select
                    value={String(formData.approval_level)}
                    onValueChange={(v) => setFormData({ ...formData, approval_level: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 (First Approval)</SelectItem>
                      <SelectItem value="2">Level 2 (Second Approval)</SelectItem>
                      <SelectItem value="3">Level 3 (Final Approval)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Approver Name</Label>
                    <Input
                      value={formData.approver_name}
                      onChange={(e) => setFormData({ ...formData, approver_name: e.target.value })}
                      placeholder="Manager name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Approver Email</Label>
                    <Input
                      type="email"
                      value={formData.approver_email}
                      onChange={(e) => setFormData({ ...formData, approver_email: e.target.value })}
                      placeholder="approver@company.com"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label>Rule Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {editingRule ? 'Update' : 'Create'} Rule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, rule: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              Delete Approval Rule
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete rule{' '}
              <span className="font-semibold">{deleteConfirm.rule?.name}</span>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                onDelete?.(deleteConfirm.rule?.id);
                setDeleteConfirm({ open: false, rule: null });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Confirmation Dialog */}
      <AlertDialog
        open={editConfirm.open}
        onOpenChange={(open) => setEditConfirm({ open, rule: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
              <Pencil className="w-5 h-5" />
              Edit Approval Rule
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to edit rule{' '}
              <span className="font-semibold">{editConfirm.rule?.name}</span>. Do you want to
              proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                openForm(editConfirm.rule);
                setEditConfirm({ open: false, rule: null });
              }}
            >
              Edit Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
