import type { Order } from '../types';

export interface DeliveryOrder extends Order {
  fulfilmentStatus: string;
  assignedDriverId?: string;
  workflowVersion: number;
  archivedAt?: string;
  recipientRating?: number;
}
export type ReceiptSignature = { strokes: { points: { x: number; y: number }[] }[] };
export const receiptAgreement = {
  FR: 'Je confirme la remise des articles de cette commande. Je décris ci-dessous leur état et toute réserve éventuelle. Ma signature atteste cette remise, sans renoncer à mes droits ni m’obliger à déclarer une satisfaction totale. Une confirmation distincte est disponible dans mon compte.',
  EN: 'I acknowledge receipt of the items in this order. I describe their condition and any concerns below. My signature records this handover without waiving my rights or requiring me to declare full satisfaction. A separate confirmation is available in my account.',
};
const labels: Record<string, [string, string]> = {
  legacy: ['Commande historique — état initial conservé', 'Historical order — original status retained'],
  adopt: ['Reprise contrôlée de la commande', 'Order adopted into the new workflow'],
  review_pending: ['Nouvel avis à modérer', 'New review awaiting moderation'],
  security_alert: ['Événement de sécurité à examiner', 'Security event to review'],
  awaiting_payment: ['Paiement à vérifier', 'Payment awaiting verification'], preparing: ['En préparation', 'Preparing'], stock_issue: ['Paiement reçu, stock à vérifier', 'Payment recorded, stock needs attention'],
  assigned: ['Livreur affecté', 'Driver assigned'], accepted: ['Mission acceptée', 'Assignment accepted'], collected: ['Colis récupéré', 'Parcel collected'], out_for_delivery: ['En livraison', 'Out for delivery'],
  signed: ['Remise signée, confirmation attendue', 'Handover signed, awaiting confirmation'], completed: ['Livraison confirmée', 'Delivery confirmed'], disputed: ['Réclamation ouverte', 'Delivery disputed'],
  cancelled: ['Annulée', 'Cancelled'], refunded: ['Remboursement enregistré', 'Refund recorded'], pending: ['En attente de validation', 'Pending approval'], approved: ['Approuvé', 'Approved'], rejected: ['Refusé', 'Rejected'], suspended: ['Suspendu', 'Suspended'],
  order_created: ['Nouvelle commande', 'New order'], record_payment: ['Paiement vérifié', 'Payment verified'], reserve_stock: ['Réservation du stock', 'Stock allocation'], assign: ['Affectation d’un livreur', 'Driver assignment'],
  accept: ['Mission acceptée', 'Assignment accepted'], decline: ['Mission refusée', 'Assignment declined'], pickup: ['Colis récupéré', 'Parcel collected'], dispatch: ['Départ en livraison', 'Out for delivery'], sign: ['Accusé de réception signé', 'Signed receipt'],
  confirm: ['Réception confirmée par le client', 'Customer confirmed receipt'], dispute: ['Réclamation du client', 'Customer dispute'], refund: ['Remboursement enregistré', 'Refund recorded'], cancel: ['Commande annulée', 'Order cancelled'], archive: ['Commande archivée', 'Order archived'],
  driver_pending: ['Nouvelle candidature livreur', 'New driver application'], driver_approved: ['Votre candidature livreur est approuvée', 'Your driver application is approved'], driver_rejected: ['Votre candidature livreur a été refusée', 'Your driver application was declined'], driver_suspended: ['Votre accès livreur est suspendu', 'Your driver access is suspended'],
  access_denied: ['Vous ne pouvez pas effectuer cette action.', 'You cannot perform this action.'], version_conflict: ['Cette commande a changé. Actualisez avant de réessayer.', 'This order changed. Refresh before retrying.'],
  driver_unavailable: ['Ce livreur n’est pas disponible.', 'This driver is not available.'], payment_required: ['Vérifiez le paiement avant l’affectation.', 'Verify payment before assigning a driver.'], stock_required: ['Le stock doit être réservé avant l’affectation.', 'Stock must be allocated before assignment.'],
  invalid_transition: ['Cette étape n’est pas disponible pour cette commande.', 'This step is not available for this order.'], invalid_payment: ['Vérifiez le montant, la devise et la référence du paiement.', 'Check the payment amount, currency and reference.'],
  invalid_receipt: ['Complétez le prénom, l’accord et la signature.', 'Complete the first name, agreement and signature.'], invalid_signature: ['La signature est vide ou invalide.', 'The signature is empty or invalid.'], note_required: ['Précisez le motif de votre demande.', 'Provide a reason for your request.'],
};
export function deliveryLabel(key: string, language: 'FR' | 'EN') {
  return labels[key]?.[language === 'FR' ? 0 : 1] || (language === 'FR' ? 'Événement de commande' : 'Order event');
}
export function workflowError(key: string, language: 'FR' | 'EN') {
  return labels[key]?.[language === 'FR' ? 0 : 1] || (language === 'FR' ? 'Action impossible. Actualisez puis réessayez.' : 'Unable to complete the action. Refresh and retry.');
}
export function orderMoney(amount: number, currency: string, language: 'FR' | 'EN') {
  return new Intl.NumberFormat(language === 'FR' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: currency === 'CFA' ? 'XOF' : currency }).format(amount);
}
