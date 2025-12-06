import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shoppingOrderSchema } from '@/lib/schemas';
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
import { ChevronsUpDown, Check, Truck, Package, AlertTriangle } from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ShoppingOrderForm({
    order,
    onSubmit,
    onCancel,
    customers = [],
    purchaseOrders = [],
}) {
    const [openCombobox, setOpenCombobox] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(shoppingOrderSchema),
        defaultValues: {
            customer_name: '',
            customer_phone: '',
            customer_id: '',
            product_links: '',
            product_details: '',
            estimated_product_cost: '',
            actual_product_cost: '',
            estimated_weight: '',
            actual_weight: '',
            commission_rate: 10,
            delivery_address: '',
            notes: '',
            status: 'pending',
            payment_status: 'unpaid',
            vendor_po_id: '',
            vendor_po_number: '',
            vendor_id: '',
            vendor_name: '',
            vendor_cost_per_kg: 0,
            vendor_cost: 0,
            ...order,
        },
    });

    const watchedValues = watch();

    // Calculation Logic
    const [calculated, setCalculated] = useState({
        productCost: 0,
        commission: 0,
        shippingCost: 0,
        total: 0,
        vendorCost: 0,
    });

    useEffect(() => {
        const productCost =
            parseFloat(watchedValues.actual_product_cost || watchedValues.estimated_product_cost) || 0;
        const weight = parseFloat(watchedValues.actual_weight || watchedValues.estimated_weight) || 0;
        const commissionRate = parseFloat(watchedValues.commission_rate) || 0;

        // Default shipping rate for shopping orders if not linked to PO
        const shippingRate = 110;

        const commission = productCost * (commissionRate / 100);
        const shippingCost = weight * shippingRate;
        const total = productCost + commission + shippingCost;

        // Vendor Cost Calculation
        let vendorCost = 0;
        if (watchedValues.vendor_po_id && watchedValues.vendor_cost_per_kg) {
            vendorCost = weight * parseFloat(watchedValues.vendor_cost_per_kg);
        }

        setCalculated({
            productCost,
            commission,
            shippingCost,
            total,
            vendorCost,
        });
    }, [
        watchedValues.actual_product_cost,
        watchedValues.estimated_product_cost,
        watchedValues.actual_weight,
        watchedValues.estimated_weight,
        watchedValues.commission_rate,
        watchedValues.vendor_po_id,
        watchedValues.vendor_cost_per_kg,
    ]);


    // Filter POs
    const availablePOs = purchaseOrders.filter(
        (po) =>
            ['approved', 'sent', 'partial_received', 'received'].includes(po.status) &&
            (po.remaining_weight_kg > 0 || !po.total_weight_kg)
    );

    const handleCustomerSelect = (customerName) => {
        const customer = customers.find((c) => c.name === customerName);
        if (customer) {
            setValue('customer_name', customer.name);
            setValue('customer_phone', customer.phone || '');
            setValue('delivery_address', customer.address_yangon || '');
            setValue('customer_id', customer.id);
        } else {
            setValue('customer_name', customerName);
            setValue('customer_id', '');
        }
        setOpenCombobox(false);
    };

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

    const onFormSubmit = (data) => {
        const formattedData = {
            ...data,
            commission_amount: calculated.commission,
            shipping_cost: calculated.shippingCost,
            total_amount: calculated.total,
            vendor_cost: calculated.vendorCost,
        };
        onSubmit(formattedData);
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
                <CardTitle>{order ? 'Edit Shopping Order' : 'New Shopping Order'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    {/* Customer Section */}
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

                    <div className="space-y-2">
                        <Label>Delivery Address (Yangon)</Label>
                        <Input
                            {...register('delivery_address')}
                            placeholder="Yangon address"
                        />
                    </div>

                    {/* Product Details */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label>Product Links</Label>
                            <Textarea
                                {...register('product_links')}
                                placeholder="Paste links here..."
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Product Details *</Label>
                            <Textarea
                                {...register('product_details')}
                                placeholder="Size, color, quantity..."
                                rows={3}
                                className={cn(errors.product_details && "border-red-500")}
                            />
                            {errors.product_details && <p className="text-xs text-red-500">{errors.product_details.message}</p>}
                        </div>
                    </div>

                    {/* Costs & Weights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="space-y-2">
                            <Label>Estimated Product Cost (THB)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                {...register('estimated_product_cost')}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Actual Product Cost (THB)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                {...register('actual_product_cost')}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Estimated Weight (kg)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                {...register('estimated_weight')}
                                placeholder="0.0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Actual Weight (kg)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                {...register('actual_weight')}
                                placeholder="0.0"
                            />
                        </div>
                    </div>

                    {/* PO Linkage */}
                    {availablePOs.length > 0 && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-blue-600" />
                                <Label className="text-blue-800 font-medium">Link to Vendor Purchase Order (Optional)</Label>
                            </div>
                            <Controller
                                name="vendor_po_id"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value || 'none'} onValueChange={handlePOChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select vendor PO" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No PO Linked</SelectItem>
                                            {availablePOs.map((po) => (
                                                <SelectItem key={po.id} value={po.id}>
                                                    {po.po_number} - {po.vendor_name}
                                                    {po.remaining_weight_kg ? ` (${po.remaining_weight_kg}kg left)` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    )}

                    {/* Status & Commission */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="purchasing">Purchasing</SelectItem>
                                            <SelectItem value="purchased">Purchased</SelectItem>
                                            <SelectItem value="received">Received</SelectItem>
                                            <SelectItem value="shipping">Shipping</SelectItem>
                                            <SelectItem value="delivered">Delivered</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Commission Rate (%)</Label>
                            <Input
                                type="number"
                                {...register('commission_rate')}
                                placeholder="10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Status</Label>
                            <Controller
                                name="payment_status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Payment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unpaid">Unpaid</SelectItem>
                                            <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Internal Notes</Label>
                        <Textarea
                            {...register('notes')}
                            rows={2}
                        />
                    </div>

                    {/* Calculations Review */}
                    <div className="bg-slate-100 p-4 rounded-lg space-y-2">
                        <h4 className="font-medium text-slate-700 mb-2">Cost Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Product Cost</p>
                                <p className="font-semibold">฿{calculated.productCost.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Commission</p>
                                <p className="font-semibold text-emerald-600">฿{calculated.commission.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Shipping Estimate</p>
                                <p className="font-semibold">฿{calculated.shippingCost.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Total to Collect</p>
                                <p className="font-bold text-lg text-blue-600">฿{calculated.total.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                            {order ? 'Update Order' : 'Create Order'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
