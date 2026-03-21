import { supabase } from './supabaseClient';

function unwrapAllocationRpcResult(name, data, error, entityKey, responseKeys = [entityKey]) {
  if (error) {
    throw error;
  }

  if (!data || typeof data !== 'object') {
    throw new Error(`${name} returned an invalid response`);
  }

  const entity = responseKeys.reduce((value, key) => value || data[key], null);

  return {
    [entityKey]: entity || null,
    purchaseOrders: Array.isArray(data.purchase_orders) ? data.purchase_orders : [],
  };
}

export async function createShipmentWithPoRebalance(payload) {
  const { data, error } = await supabase.rpc('create_shipment_with_po_rebalance', {
    p_payload: payload,
  });
  return unwrapAllocationRpcResult('create_shipment_with_po_rebalance', data, error, 'shipment');
}

export async function updateShipmentWithPoRebalance(shipmentId, updates) {
  const { data, error } = await supabase.rpc('update_shipment_with_po_rebalance', {
    p_shipment_id: shipmentId,
    p_updates: updates,
  });
  return unwrapAllocationRpcResult('update_shipment_with_po_rebalance', data, error, 'shipment');
}

export async function deleteShipmentWithPoRebalance(shipmentId) {
  const { data, error } = await supabase.rpc('delete_shipment_with_po_rebalance', {
    p_shipment_id: shipmentId,
  });
  return unwrapAllocationRpcResult('delete_shipment_with_po_rebalance', data, error, 'shipment');
}

export async function updateShoppingOrderWithPoRebalance(orderId, updates) {
  const { data, error } = await supabase.rpc('update_shopping_order_with_po_rebalance', {
    p_shopping_order_id: orderId,
    p_updates: updates,
  });
  return unwrapAllocationRpcResult(
    'update_shopping_order_with_po_rebalance',
    data,
    error,
    'shoppingOrder',
    ['shopping_order', 'shoppingOrder']
  );
}
