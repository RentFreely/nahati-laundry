/** Matches `orders.status` check constraint in Supabase migration. */
export const ORDER_STATUSES = [
  'pickup_pending',
  'at_shop',
  'processing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
]

export const ORDER_STATUS_LABEL = {
  pickup_pending: 'Pickup pending',
  at_shop: 'At shop',
  processing: 'Processing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
