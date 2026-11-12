export const notificationSections: Record<string, string[]> = {
  orders: ['order_created', 'adopt', 'record_payment', 'reserve_stock', 'assign', 'accept', 'decline', 'pickup', 'dispatch', 'signed', 'completed', 'disputed', 'refund', 'cancel', 'archive'],
  drivers: ['driver_pending', 'driver_approved', 'driver_rejected', 'driver_suspended'],
  reviews: ['review_pending'],
  security: ['security_alert'],
};

export function notificationSection(kind: string) {
  return Object.entries(notificationSections).find(([, kinds]) => kinds.includes(kind))?.[0];
}
