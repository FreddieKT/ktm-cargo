import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shipmentSchema } from '@/lib/schemas';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Package, Truck, Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const serviceTypes = [
  { value: 'cargo_small', label: 'Cargo (1-5kg)', costBasis: 90, price: 120 },
  { value: 'cargo_medium', label: 'Cargo (6-15kg)', costBasis: 75, price: 95 },
  { value: 'cargo_large', label: 'Cargo (16-30kg)', costBasis: 55, price: 70 },
  { value: 'shopping_small', label: 'Shopping + Small Items', costBasis: 80, price: 110 },
  { value: 'shopping_fashion', label: 'Shopping + Fashion/Electronics', costBasis: 85, price: 115 },
  { value: 'shopping_bulk', label: 'Shopping + Bulk Order', costBasis: 70, price: 90 },
  { value: 'express', label: 'Express (1-2 days)', costBasis: 100, price: 150 },
  { value: 'standard', label: 'Standard (3-5 days)', costBasis: 75, price: 95 },
];

export default function ShipmentForm({
  shipment,
  onSubmit,
  onCancel,
  purchaseOrders = [],
  vendors = [],
  customers = [],
}) {
  const [openCombobox, setOpenCombobox] = useState(false);
  const [poWeightStatus, setPoWeightStatus] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      service_type: 'cargo_medium',
      weight_kg: '',
      items_description: '',
      pickup_address: '',
      delivery_address: '',
      estimated_delivery: '', // pickup_date in original form was mapped here implicitly or separately? Let's assume estimated_delivery for simplicity or fix field name
      insurance_opted: false,
      packaging_fee: 0,
      notes: '',
      vendor_po_id: '',
      vendor_po_number: '',
      vendor_id: '',
      vendor_name: '',
      vendor_cost_per_kg: 0,
      customer_id: '',
      ...shipment,
    },
  });

  const watchedValues = watch();

  // Filter POs that are approved/received and have remaining weight
  const availablePOs = purchaseOrders.filter(
    (po) =>
      ['approved', 'sent', 'partial_received', 'received'].includes(po.status) &&
      (po.remaining_weight_kg > 0 || !po.total_weight_kg)
  );

  // Calculation Logic
  const [calculated, setCalculated] = useState({
    cost: 0,
    price: 0,
    profit: 0,
    total: 0,
    vendorCost: 0,
    insurance: 0,
  });

  useEffect(() => {
    const service = serviceTypes.find((s) => s.value === watchedValues.service_type);
    const weight = parseFloat(watchedValues.weight_kg) || 0;
    const packaging = parseFloat(watchedValues.packaging_fee) || 0;

    if (service && weight > 0) {
      // Use vendor cost from PO if linked, otherwise use default service cost
      const vendorCostPerKg = parseFloat(watchedValues.vendor_cost_per_kg) || service.costBasis;
      const vendorCost = vendorCostPerKg * weight;

      const price = service.price * weight;
      const insurance = watchedValues.insurance_opted ? price * 0.03 : 0;
      const total = price + insurance + packaging;
      const profit = total - vendorCost - insurance;

      setCalculated({
        cost: vendorCost,
        price,
        profit,
        total,
        insurance,
        vendorCost,
        vendorCostPerKg,
      });

      // Update PO weight status
      if (watchedValues.vendor_po_id) {
        const po = purchaseOrders.find((p) => p.id === watchedValues.vendor_po_id);
        if (po && po.total_weight_kg) {
          const remaining = po.remaining_weight_kg || 0;
          const isOverLimit = weight > remaining;
          const percentUsed = Math.min(
            100,
            (((po.allocated_weight_kg || 0) + weight) / po.total_weight_kg) * 100
          );

          setPoWeightStatus({
            remaining,
            isOverLimit,
            percentUsed,
            total: po.total_weight_kg,
          });
        } else {
          setPoWeightStatus(null);
        }
      } else {
        setPoWeightStatus(null);
      }
    } else {
      setPoWeightStatus(null);
      setCalculated({
        cost: 0,
        price: 0,
        profit: 0,
        total: 0,
        insurance: 0,
        vendorCost: 0,
      });
    }
  }, [
    watchedValues.service_type,
    watchedValues.weight_kg,
    watchedValues.insurance_opted,
    watchedValues.packaging_fee,
    watchedValues.vendor_cost_per_kg,
    watchedValues.vendor_po_id,
  ]);

  const handlePOChange = (poId) => {
    if (!poId || poId === 'none') {
      setValue('vendor_po_id', '');
      setValue('vendor_po_number', '');
      setValue('vendor_id', '');
      setValue('vendor_name', '');
      setValue('vendor_cost_per_kg', 0);
      return;
    }

    const selectedPO = purchaseOrders.find((po) => po.id === poId);
    if (selectedPO) {
      setValue('vendor_po_id', selectedPO.id);
      setValue('vendor_po_number', selectedPO.po_number);
      setValue('vendor_id', selectedPO.vendor_id);
      setValue('vendor_name', selectedPO.vendor_name);
      setValue('vendor_cost_per_kg', selectedPO.cost_per_kg || 0);
    }
  };

  const handleCustomerSelect = (customerName) => {
    const customer = customers.find((c) => c.name === customerName);
    if (customer) {
      setValue('customer_name', customer.name);
      setValue('customer_phone', customer.phone || '');
      setValue('delivery_address', customer.address_yangon || customer.address || ''); // Prefer Yangon address
      setValue('customer_id', customer.id);
    } else {
      setValue('customer_name', customerName);
      setValue('customer_id', '');
    }
    setOpenCombobox(false);
  };

  const onFormSubmit = (data) => {
    if (poWeightStatus?.isOverLimit) {
      toast.error('Weight exceeds available PO capacity!');
      return;
    }

    const service = serviceTypes.find((s) => s.value === data.service_type);

    const enhancedData = {
      ...data,
      cost_basis: data.vendor_cost_per_kg || service?.costBasis,
      price_per_kg: service?.price,
      vendor_total_cost: calculated.vendorCost || 0,
      total_amount: calculated.total,
      profit: calculated.profit,
      insurance_amount: calculated.insurance || 0,
      tracking_number: data.tracking_number || shipment?.tracking_number || `BKK${Date.now().toString(36).toUpperCase()}`,
      origin: 'Bangkok',
      destination: 'Yangon',
    };

    onSubmit(enhancedData);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>{shipment ? 'Edit Shipment' : 'New Shipment'}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
              <Label>Customer Name *</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className={cn("w-full justify-between", errors.customer_name && "border-red-500")}
                  >
                    {watchedValues.customer_name || 'Select customer...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={handleCustomerSelect}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                watchedValues.customer_name === customer.name ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.customer_name && <p className="text-xs text-red-500">{errors.customer_name.message}</p>}
              <input type="hidden" {...register('customer_name')} />
            </div>

            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                {...register('customer_phone')}
                placeholder="+66 or +95"
                className={cn(errors.customer_phone && "border-red-500")}
              />
              {errors.customer_phone && <p className="text-xs text-red-500">{errors.customer_phone.message}</p>}
            </div>
          </div>

          {/* Vendor PO Linkage */}
          {availablePOs.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <Label className="text-blue-800 font-medium">Link to Vendor Purchase Order</Label>
              </div>
              <Controller
                name="vendor_po_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || 'none'} onValueChange={handlePOChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor PO (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No PO Linked (use default pricing)</SelectItem>
                      {availablePOs.map((po) => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.po_number} - {po.vendor_name}
                          {po.cost_per_kg ? ` (฿${po.cost_per_kg}/kg)` : ''}
                          {po.remaining_weight_kg ? ` - ${po.remaining_weight_kg}kg available` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {watchedValues.vendor_po_id && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        <Package className="w-3 h-3 mr-1" />
                        {watchedValues.vendor_name}
                      </Badge>
                      <span className="text-blue-600">Cost: ฿{watchedValues.vendor_cost_per_kg}/kg</span>
                    </div>
                    {poWeightStatus && (
                      <span className={cn('font-medium', poWeightStatus.isOverLimit ? 'text-rose-600' : 'text-slate-600')}>
                        {poWeightStatus.remaining}kg remaining
                      </span>
                    )}
                  </div>

                  {poWeightStatus && (
                    <div className="space-y-1">
                      <Progress
                        value={poWeightStatus.percentUsed}
                        className={cn('h-2', poWeightStatus.isOverLimit ? 'bg-rose-100' : '')}
                        indicatorClassName={poWeightStatus.isOverLimit ? 'bg-rose-500' : 'bg-blue-500'}
                      />
                      {poWeightStatus.isOverLimit && (
                        <div className="flex items-center gap-1 text-xs text-rose-600 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Weight exceeds available capacity!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Controller
                name="service_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger className={cn(errors.service_type && "border-red-500")}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label} - ฿{s.price}/kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.service_type && <p className="text-xs text-red-500">{errors.service_type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Weight (kg) *</Label>
              <Input
                type="number"
                step="0.1"
                {...register('weight_kg')}
                placeholder="Enter weight"
                className={cn(
                  poWeightStatus?.isOverLimit && 'border-rose-500 focus-visible:ring-rose-500',
                  errors.weight_kg && "border-red-500"
                )}
              />
              {errors.weight_kg && <p className="text-xs text-red-500">{errors.weight_kg.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Items Description *</Label>
            <Textarea
              {...register('items_description')}
              placeholder="Describe the items being shipped..."
              rows={2}
              className={cn(errors.items_description && "border-red-500")}
            />
            {errors.items_description && <p className="text-xs text-red-500">{errors.items_description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pickup Address (Bangkok)</Label>
              <Input
                {...register('pickup_address')}
                placeholder="Bangkok address"
              />
            </div>
            <div className="space-y-2">
              <Label>Delivery Address (Yangon)</Label>
              <Input
                {...register('delivery_address')}
                placeholder="Yangon address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Estimated Date</Label>
              <Input
                type="date"
                {...register('estimated_delivery')}
              />
            </div>
            <div className="space-y-2">
              <Label>Packaging Fee (THB)</Label>
              <Input
                type="number"
                min="0"
                {...register('packaging_fee')}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Insurance (3%)</Label>
              <div className="flex items-center gap-2 h-10">
                <Controller
                  control={control}
                  name="insurance_opted"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <span className="text-sm text-slate-600">
                  {watchedValues.insurance_opted
                    ? `฿${calculated.insurance?.toFixed(0) || 0}`
                    : 'Not included'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Pricing Summary */}
          {watchedValues.weight_kg > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">Price Calculation</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Vendor Cost</p>
                  <p className="font-semibold text-rose-600">
                    ฿{calculated.vendorCost?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">
                    {watchedValues.vendor_po_id
                      ? `(PO: ฿${watchedValues.vendor_cost_per_kg}/kg)`
                      : `(Default: ฿${calculated.vendorCostPerKg}/kg)`}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Customer Price</p>
                  <p className="font-semibold">฿{calculated.price?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Insurance</p>
                  <p className="font-semibold">฿{(calculated.insurance || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Packaging</p>
                  <p className="font-semibold">
                    ฿{parseFloat(watchedValues.packaging_fee || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Total</p>
                  <p className="font-bold text-lg text-blue-600">
                    ฿{calculated.total?.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 mt-2 flex items-center justify-between">
                <p className="text-sm text-emerald-600 font-medium">
                  Est. Profit: ฿{calculated.profit?.toLocaleString()}
                </p>
                {watchedValues.vendor_po_id && (
                  <Badge className="bg-blue-100 text-blue-700">
                    Linked to {watchedValues.vendor_po_number}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={poWeightStatus?.isOverLimit}
            >
              {shipment ? 'Update Shipment' : 'Create Shipment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
