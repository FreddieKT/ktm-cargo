import React, { useState, useMemo } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/api/integrations/storage';
import {
  FileText,
  Plus,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pencil,
  Trash2,
  Upload,
  Download,
  FileUp,
  Eye,
  Scale,
  Target,
  Bell,
  Search,
  Filter,
} from 'lucide-react';
import { differenceInDays, format, addDays } from 'date-fns';
import { toast } from 'sonner';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-800', icon: FileText },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  expiring_soon: { label: 'Expiring Soon', color: 'bg-amber-100 text-amber-800', icon: Clock },
  expired: { label: 'Expired', color: 'bg-rose-100 text-rose-800', icon: AlertTriangle },
  terminated: { label: 'Terminated', color: 'bg-gray-100 text-gray-800', icon: FileText },
};

const CONTRACT_TYPES = {
  service: { label: 'Service Agreement', description: 'General service terms' },
  supply: { label: 'Supply Contract', description: 'Material/goods supply' },
  framework: { label: 'Framework Agreement', description: 'Long-term partnership' },
  one_time: { label: 'One-Time Contract', description: 'Single project/delivery' },
  sla: { label: 'SLA Contract', description: 'Service Level Agreement' },
};

export default function ContractManager({
  contracts = [],
  vendors = [],
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, contract: null });
  const [editConfirm, setEditConfirm] = useState({ open: false, contract: null });
  const [formData, setFormData] = useState({
    vendor_id: '',
    vendor_name: '',
    contract_type: 'supply',
    start_date: '',
    end_date: '',
    total_value: 0,
    payment_terms: 'net_30',
    auto_renew: false,
    renewal_notice_days: 30,
    terms_conditions: '',
    pricing_agreement: '',
    agreed_rate_per_kg: 0,
    volume_commitment_kg: 0,
    sla_terms: '',
    sla_on_time_target: 95,
    sla_quality_target: 99,
    penalty_clause: '',
    document_url: '',
    document_name: '',
    notes: '',
  });

  const getContractStatus = (contract) => {
    if (contract.status === 'terminated') return 'terminated';
    if (contract.status === 'draft') return 'draft';
    const daysUntilEnd = differenceInDays(new Date(contract.end_date), new Date());
    if (daysUntilEnd < 0) return 'expired';
    if (daysUntilEnd <= (contract.renewal_notice_days || 30)) return 'expiring_soon';
    return 'active';
  };

  // Categorize contracts
  const categorizedContracts = useMemo(() => {
    const filtered = contracts.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contract_number?.toLowerCase().includes(searchQuery.toLowerCase());
      const status = getContractStatus(c);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return {
      all: filtered,
      active: filtered.filter((c) => getContractStatus(c) === 'active'),
      expiring: filtered.filter((c) => getContractStatus(c) === 'expiring_soon'),
      expired: filtered.filter((c) => getContractStatus(c) === 'expired'),
      draft: filtered.filter((c) => getContractStatus(c) === 'draft'),
    };
  }, [contracts, searchQuery, statusFilter]);

  const totalContractValue = contracts.reduce((sum, c) => sum + (c.total_value || 0), 0);

  const openForm = (contract = null) => {
    if (contract) {
      setFormData({ ...contract });
      setEditingContract(contract);
    } else {
      setFormData({
        vendor_id: '',
        vendor_name: '',
        contract_type: 'supply',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        total_value: 0,
        payment_terms: 'net_30',
        auto_renew: false,
        renewal_notice_days: 30,
        terms_conditions: '',
        pricing_agreement: '',
        agreed_rate_per_kg: 0,
        volume_commitment_kg: 0,
        sla_terms: '',
        sla_on_time_target: 95,
        sla_quality_target: 99,
        penalty_clause: '',
        document_url: '',
        document_name: '',
        notes: '',
      });
      setEditingContract(null);
    }
    setShowForm(true);
  };

  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    setFormData({
      ...formData,
      vendor_id: vendorId,
      vendor_name: vendor?.name || '',
      agreed_rate_per_kg: vendor?.cost_per_kg || formData.agreed_rate_per_kg,
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url, file_url } = await uploadFile(file, 'documents', 'contracts');
      setFormData({
        ...formData,
        document_url: url || file_url,
        document_name: file.name,
      });
      toast.success('Document uploaded');
    } catch (error) {
      handleError(error, 'Failed to upload document', {
        component: 'ContractManager',
        action: 'fileUpload',
      });
    } finally {
      setUploading(false);
    }
  };

  const { handleError, handleValidationError } = useErrorHandler();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { vendorContractSchema } = await import('@/lib/schemas');
      const contractNumber =
        editingContract?.contract_number || `CON-${Date.now().toString(36).toUpperCase()}`;
      const data = {
        ...formData,
        contract_number: contractNumber,
        status: formData.status || 'active',
        agreed_rate_per_kg: parseFloat(formData.agreed_rate_per_kg) || 0,
        volume_commitment_kg: parseFloat(formData.volume_commitment_kg) || 0,
        sla_on_time_target: parseFloat(formData.sla_on_time_target) || 95,
        sla_quality_target: parseFloat(formData.sla_quality_target) || 99,
        total_value: parseFloat(formData.total_value) || 0,
      };

      // Validate data
      const validatedData = vendorContractSchema.partial().parse(data);

      if (editingContract) {
        await onUpdate?.(editingContract.id, validatedData);
      } else {
        await onAdd?.(validatedData);
      }
      setShowForm(false);
      toast.success(editingContract ? 'Contract updated' : 'Contract created');
    } catch (error) {
      if (error.name === 'ZodError') {
        handleValidationError(error, 'Contract');
      } else {
        handleError(error, 'Failed to save contract', {
          component: 'ContractManager',
          action: 'submit',
        });
      }
    }
  };

  const ContractCard = ({ contract }) => {
    const status = getContractStatus(contract);
    const statusConfig = STATUS_CONFIG[status];
    const daysLeft = differenceInDays(new Date(contract.end_date), new Date());
    const StatusIcon = statusConfig.icon;

    return (
      <div
        className="p-4 bg-white border rounded-lg hover:shadow-md transition-all cursor-pointer"
        onClick={() => setSelectedContract(contract)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${statusConfig.color.replace('text-', 'bg-').split(' ')[0]}`}
            >
              <StatusIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium">{contract.vendor_name}</p>
              <p className="text-xs text-slate-500">{contract.contract_number}</p>
            </div>
          </div>
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Type</span>
            <span className="capitalize">
              {CONTRACT_TYPES[contract.contract_type]?.label || contract.contract_type}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Value</span>
            <span className="font-medium text-blue-600">
              ฿{contract.total_value?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Period</span>
            <span>
              {format(new Date(contract.start_date), 'MMM d')} -{' '}
              {format(new Date(contract.end_date), 'MMM d, yyyy')}
            </span>
          </div>
          {contract.agreed_rate_per_kg > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Agreed Rate</span>
              <span className="font-medium">฿{contract.agreed_rate_per_kg}/kg</span>
            </div>
          )}
        </div>

        {status === 'expiring_soon' && (
          <div className="mt-3 p-2 bg-amber-50 rounded-lg flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-amber-700">Expires in {daysLeft} days</span>
          </div>
        )}

        {contract.document_url && (
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
            <FileText className="w-3 h-3" />
            <span>Document attached</span>
          </div>
        )}

        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={async (e) => {
              try {
                e.stopPropagation();
                setEditConfirm({ open: true, contract });
              } catch (error) {
                handleError(error, 'Failed to open edit dialog', {
                  component: 'ContractManager',
                  action: 'openEdit',
                });
              }
            }}
          >
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-rose-600 hover:bg-rose-50"
            onClick={async (e) => {
              try {
                e.stopPropagation();
                setDeleteConfirm({ open: true, contract });
              } catch (error) {
                handleError(error, 'Failed to open delete dialog', {
                  component: 'ContractManager',
                  action: 'openDelete',
                });
              }
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contracts.length}</p>
              <p className="text-xs text-slate-500">Total Contracts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categorizedContracts.active.length}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">
                {categorizedContracts.expiring.length}
              </p>
              <p className="text-xs text-amber-700">Expiring Soon</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categorizedContracts.expired.length}</p>
              <p className="text-xs text-slate-500">Expired</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-200 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">
                ฿{(totalContractValue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-blue-600">Total Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon Alert */}
      {categorizedContracts.expiring.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-amber-600" />
              <h3 className="font-medium text-amber-800">Contracts Expiring Soon</h3>
            </div>
            <div className="space-y-2">
              {categorizedContracts.expiring.map((contract) => {
                const daysLeft = differenceInDays(new Date(contract.end_date), new Date());
                return (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{contract.vendor_name}</p>
                      <p className="text-xs text-slate-500">{contract.contract_number}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-amber-100 text-amber-800">{daysLeft} days left</Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        {contract.auto_renew ? 'Auto-renews' : 'Manual renewal required'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => openForm()} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> New Contract
          </Button>
        </CardContent>
      </Card>

      {/* Contracts Grid */}
      {categorizedContracts.all.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorizedContracts.all.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No contracts found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by adding your first vendor contract'}
            </p>
            <Button onClick={() => openForm()}>
              <Plus className="w-4 h-4 mr-2" /> Add Contract
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contract Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContract ? 'Edit Contract' : 'New Contract'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="sla">SLA Terms</TabsTrigger>
                <TabsTrigger value="document">Document</TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label>Vendor *</Label>
                  <Select value={formData.vendor_id} onValueChange={handleVendorChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contract Type</Label>
                    <Select
                      value={formData.contract_type}
                      onValueChange={(v) => setFormData({ ...formData, contract_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTRACT_TYPES).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Value (฿)</Label>
                    <Input
                      type="number"
                      value={formData.total_value}
                      onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select
                      value={formData.payment_terms}
                      onValueChange={(v) => setFormData({ ...formData, payment_terms: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="net_15">Net 15</SelectItem>
                        <SelectItem value="net_30">Net 30</SelectItem>
                        <SelectItem value="net_60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Renewal Notice (days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.renewal_notice_days}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          renewal_notice_days: parseInt(e.target.value) || 30,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <Label>Auto-renew Contract</Label>
                    <p className="text-xs text-slate-500">
                      Automatically renew when contract expires
                    </p>
                  </div>
                  <Switch
                    checked={formData.auto_renew}
                    onCheckedChange={(v) => setFormData({ ...formData, auto_renew: v })}
                  />
                </div>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-800">Pricing Agreement</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Agreed Rate per kg (฿)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.agreed_rate_per_kg}
                        onChange={(e) =>
                          setFormData({ ...formData, agreed_rate_per_kg: e.target.value })
                        }
                        placeholder="Contracted rate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Volume Commitment (kg/month)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.volume_commitment_kg}
                        onChange={(e) =>
                          setFormData({ ...formData, volume_commitment_kg: e.target.value })
                        }
                        placeholder="Monthly commitment"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pricing Terms & Conditions</Label>
                  <Textarea
                    value={formData.pricing_agreement}
                    onChange={(e) =>
                      setFormData({ ...formData, pricing_agreement: e.target.value })
                    }
                    placeholder="Describe pricing tiers, discounts, special rates..."
                    rows={4}
                  />
                </div>
              </TabsContent>

              {/* SLA Tab */}
              <TabsContent value="sla" className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium text-purple-800">Service Level Targets</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>On-Time Delivery Target (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.sla_on_time_target}
                        onChange={(e) =>
                          setFormData({ ...formData, sla_on_time_target: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quality/Damage-Free Target (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.sla_quality_target}
                        onChange={(e) =>
                          setFormData({ ...formData, sla_quality_target: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>SLA Terms</Label>
                  <Textarea
                    value={formData.sla_terms}
                    onChange={(e) => setFormData({ ...formData, sla_terms: e.target.value })}
                    placeholder="Describe service level expectations, response times, escalation procedures..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Penalty Clause</Label>
                  <Textarea
                    value={formData.penalty_clause}
                    onChange={(e) => setFormData({ ...formData, penalty_clause: e.target.value })}
                    placeholder="Penalties for SLA violations..."
                    rows={2}
                  />
                </div>
              </TabsContent>

              {/* Document Tab */}
              <TabsContent value="document" className="space-y-4">
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                  {formData.document_url ? (
                    <div className="space-y-3">
                      <FileText className="w-12 h-12 text-blue-500 mx-auto" />
                      <p className="font-medium">{formData.document_name || 'Contract Document'}</p>
                      <div className="flex justify-center gap-2">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <a href={formData.document_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4 mr-1" /> View
                          </a>
                        </Button>
                        <Button type="button" variant="outline" size="sm" asChild>
                          <a href={formData.document_url} download>
                            <Download className="w-4 h-4 mr-1" /> Download
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-rose-600"
                          onClick={() =>
                            setFormData({ ...formData, document_url: '', document_name: '' })
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                      <p className="text-slate-600">Upload contract document</p>
                      <p className="text-xs text-slate-400">PDF, DOC, or image files</p>
                      <label className="inline-block">
                        <Button type="button" variant="outline" disabled={uploading} asChild>
                          <span>
                            <FileUp className="w-4 h-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Choose File'}
                          </span>
                        </Button>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes about this contract..."
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {editingContract ? 'Update' : 'Create'} Contract
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contract Detail Dialog */}
      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedContract && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {selectedContract.contract_number}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {/* Header Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedContract.vendor_name}</h3>
                    <p className="text-slate-500 capitalize">
                      {CONTRACT_TYPES[selectedContract.contract_type]?.label}
                    </p>
                  </div>
                  <Badge className={STATUS_CONFIG[getContractStatus(selectedContract)].color}>
                    {STATUS_CONFIG[getContractStatus(selectedContract)].label}
                  </Badge>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Contract Value</p>
                    <p className="font-bold text-lg">
                      ฿{selectedContract.total_value?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Agreed Rate</p>
                    <p className="font-bold text-lg">
                      {selectedContract.agreed_rate_per_kg > 0
                        ? `฿${selectedContract.agreed_rate_per_kg}/kg`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Volume Commitment</p>
                    <p className="font-bold text-lg">
                      {selectedContract.volume_commitment_kg > 0
                        ? `${selectedContract.volume_commitment_kg} kg/mo`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Payment Terms</p>
                    <p className="font-bold text-lg capitalize">
                      {selectedContract.payment_terms?.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Contract Period</span>
                      <span className="font-medium">
                        {format(new Date(selectedContract.start_date), 'MMM d, yyyy')} -{' '}
                        {format(new Date(selectedContract.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-slate-600">Days Remaining</span>
                      <span
                        className={`font-medium ${differenceInDays(new Date(selectedContract.end_date), new Date()) < 30 ? 'text-amber-600' : 'text-emerald-600'}`}
                      >
                        {Math.max(
                          0,
                          differenceInDays(new Date(selectedContract.end_date), new Date())
                        )}{' '}
                        days
                      </span>
                    </div>
                    {selectedContract.auto_renew && (
                      <Badge className="mt-2 bg-emerald-100 text-emerald-800">
                        Auto-renewal enabled
                      </Badge>
                    )}
                  </div>
                </div>

                {/* SLA Targets */}
                {(selectedContract.sla_on_time_target || selectedContract.sla_quality_target) && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-purple-600" />
                      SLA Targets
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">On-Time Delivery</p>
                        <Progress value={selectedContract.sla_on_time_target} className="h-2" />
                        <p className="text-right text-sm font-medium mt-1">
                          {selectedContract.sla_on_time_target}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Quality Target</p>
                        <Progress value={selectedContract.sla_quality_target} className="h-2" />
                        <p className="text-right text-sm font-medium mt-1">
                          {selectedContract.sla_quality_target}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms */}
                {selectedContract.terms_conditions && (
                  <div>
                    <h4 className="font-medium mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                      {selectedContract.terms_conditions}
                    </p>
                  </div>
                )}

                {/* Document */}
                {selectedContract.document_url && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium">
                          {selectedContract.document_name || 'Contract Document'}
                        </p>
                        <p className="text-xs text-slate-500">Uploaded document</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={selectedContract.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedContract.document_url} download>
                          <Download className="w-4 h-4 mr-1" /> Download
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedContract(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        openForm(selectedContract);
                        setSelectedContract(null);
                      } catch (error) {
                        handleError(error, 'Failed to open edit form', {
                          component: 'ContractManager',
                          action: 'openEditFromDetail',
                        });
                      }
                    }}
                    className="flex-1"
                  >
                    <Pencil className="w-4 h-4 mr-2" /> Edit Contract
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, contract: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              Delete Contract
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete contract{' '}
              <span className="font-semibold">{deleteConfirm.contract?.contract_number}</span> for{' '}
              <span className="font-semibold">{deleteConfirm.contract?.vendor_name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={async () => {
                try {
                  await onDelete?.(deleteConfirm.contract?.id);
                  setDeleteConfirm({ open: false, contract: null });
                } catch (error) {
                  handleError(error, 'Failed to delete contract', {
                    component: 'ContractManager',
                    action: 'delete',
                  });
                }
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
        onOpenChange={(open) => setEditConfirm({ open, contract: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
              <Pencil className="w-5 h-5" />
              Edit Contract
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to edit contract{' '}
              <span className="font-semibold">{editConfirm.contract?.contract_number}</span> for{' '}
              <span className="font-semibold">{editConfirm.contract?.vendor_name}</span>. Do you
              want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700"
              onClick={async () => {
                try {
                  openForm(editConfirm.contract);
                  setEditConfirm({ open: false, contract: null });
                } catch (error) {
                  handleError(error, 'Failed to open edit form', {
                    component: 'ContractManager',
                    action: 'openEditForm',
                  });
                }
              }}
            >
              Edit Contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
