import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Filter } from 'lucide-react';

const CRITERIA_TYPES = [
  { value: 'total_spent', label: 'Total Spent (฿)', type: 'number' },
  { value: 'shipment_count', label: 'Number of Shipments', type: 'number' },
  { value: 'days_since_last_order', label: 'Days Since Last Order', type: 'number' },
  {
    value: 'customer_type',
    label: 'Customer Type',
    type: 'select',
    options: ['individual', 'online_shopper', 'sme_importer'],
  },
  { value: 'avg_order_value', label: 'Average Order Value (฿)', type: 'number' },
  { value: 'customer_age_days', label: 'Customer Age (Days)', type: 'number' },
  { value: 'has_email', label: 'Has Email', type: 'boolean' },
];

const OPERATORS = {
  number: [
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'eq', label: '=' },
  ],
  select: [
    { value: 'eq', label: 'Is' },
    { value: 'neq', label: 'Is Not' },
  ],
  boolean: [{ value: 'eq', label: 'Is' }],
};

const COLORS = ['blue', 'purple', 'emerald', 'amber', 'rose', 'cyan', 'pink'];

export default function SegmentBuilder({ segment, onSubmit, onCancel, previewCount }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: 'blue',
    is_active: true,
    auto_refresh: true,
  });

  const [criteria, setCriteria] = useState([]);

  useEffect(() => {
    if (segment) {
      setForm({
        name: segment.name || '',
        description: segment.description || '',
        color: segment.color || 'blue',
        is_active: segment.is_active !== false,
        auto_refresh: segment.auto_refresh !== false,
      });
      if (segment.criteria) {
        try {
          setCriteria(JSON.parse(segment.criteria));
        } catch (_e) {
          setCriteria([]);
        }
      }
    }
  }, [segment]);

  const addCriterion = () => {
    setCriteria([...criteria, { field: 'total_spent', operator: 'gte', value: '' }]);
  };

  const updateCriterion = (index, updates) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    setCriteria(newCriteria);
  };

  const removeCriterion = (index) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      criteria: JSON.stringify(criteria),
      customer_count: previewCount || 0,
    });
  };

  const getCriteriaType = (field) => {
    return CRITERIA_TYPES.find((c) => c.value === field)?.type || 'number';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          {segment ? 'Edit Segment' : 'Create Custom Segment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Segment Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. High Spenders"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this segment..."
              rows={2}
            />
          </div>

          {/* Criteria Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Segment Criteria</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                <Plus className="w-4 h-4 mr-1" /> Add Rule
              </Button>
            </div>

            {criteria.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-lg text-center text-slate-500">
                <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No criteria added. Add rules to define this segment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {criteria.map((criterion, index) => {
                  const criteriaType = getCriteriaType(criterion.field);
                  const criteriaConfig = CRITERIA_TYPES.find((c) => c.value === criterion.field);

                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      {index > 0 && (
                        <Badge variant="outline" className="text-xs">
                          AND
                        </Badge>
                      )}

                      <Select
                        value={criterion.field}
                        onValueChange={(v) =>
                          updateCriterion(index, { field: v, operator: 'gte', value: '' })
                        }
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CRITERIA_TYPES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={criterion.operator}
                        onValueChange={(v) => updateCriterion(index, { operator: v })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS[criteriaType]?.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {criteriaType === 'number' && (
                        <Input
                          type="number"
                          value={criterion.value}
                          onChange={(e) => updateCriterion(index, { value: e.target.value })}
                          className="w-32"
                          placeholder="Value"
                        />
                      )}

                      {criteriaType === 'select' && (
                        <Select
                          value={criterion.value}
                          onValueChange={(v) => updateCriterion(index, { value: v })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {criteriaConfig?.options?.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt.replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {criteriaType === 'boolean' && (
                        <Select
                          value={criterion.value}
                          onValueChange={(v) => updateCriterion(index, { value: v })}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCriterion(index)}
                        className="text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview */}
          {previewCount !== undefined && (
            <div className="p-4 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-blue-700">Matching customers:</span>
              <Badge className="bg-blue-600 text-white text-lg px-4 py-1">{previewCount}</Badge>
            </div>
          )}

          {/* Options */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <Label>Auto-refresh</Label>
              <p className="text-xs text-slate-500">Automatically update customer count</p>
            </div>
            <Switch
              checked={form.auto_refresh}
              onCheckedChange={(v) => setForm({ ...form, auto_refresh: v })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              {segment ? 'Update Segment' : 'Create Segment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Helper function to evaluate criteria against a customer
export function evaluateCustomerCriteria(customer, criteria) {
  if (!criteria || criteria.length === 0) return true;

  return criteria.every((criterion) => {
    let customerValue;

    switch (criterion.field) {
      case 'total_spent':
        customerValue = customer.totalSpent || 0;
        break;
      case 'shipment_count':
        customerValue = customer.shipmentCount || 0;
        break;
      case 'days_since_last_order':
        customerValue = customer.daysSinceLastOrder || 999;
        break;
      case 'customer_type':
        customerValue = customer.customer_type || 'individual';
        break;
      case 'avg_order_value':
        customerValue = customer.avgOrderValue || 0;
        break;
      case 'customer_age_days':
        customerValue = customer.customerAgeDays || 0;
        break;
      case 'has_email':
        customerValue = !!customer.email;
        break;
      default:
        return true;
    }

    const targetValue =
      criterion.field === 'has_email'
        ? criterion.value === 'true'
        : criterion.type === 'number'
          ? parseFloat(criterion.value)
          : criterion.value;

    switch (criterion.operator) {
      case 'gte':
        return customerValue >= targetValue;
      case 'lte':
        return customerValue <= targetValue;
      case 'gt':
        return customerValue > targetValue;
      case 'lt':
        return customerValue < targetValue;
      case 'eq':
        return customerValue == targetValue;
      case 'neq':
        return customerValue != targetValue;
      default:
        return true;
    }
  });
}
