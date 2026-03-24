-- Prevent duplicate invoices for the same order or shipment
-- NULL values are treated as distinct by PostgreSQL UNIQUE, so
-- rows with NULL order_id/shipment_id are not affected.

ALTER TABLE customer_invoices
  ADD CONSTRAINT unique_invoice_per_order
    UNIQUE (order_id),
  ADD CONSTRAINT unique_invoice_per_shipment
    UNIQUE (shipment_id);
