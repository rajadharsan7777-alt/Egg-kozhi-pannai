import QRCode from 'qrcode';
import { OrderRecord, FarmSettings } from '../types/eggFarm';

/**
 * Builds standard NPCI UPI URI scheme compatible with Google Pay, PhonePe, Paytm, CRED, etc.
 */
export function buildUpiUri(params: {
  payeeVpa: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
}): string {
  const vpa = params.payeeVpa.trim();
  const name = encodeURIComponent(params.payeeName.trim());
  const formattedAmount = params.amount.toFixed(2);
  const note = encodeURIComponent(params.transactionNote.trim());

  return `upi://pay?pa=${vpa}&pn=${name}&am=${formattedAmount}&cu=INR&tn=${note}`;
}

/**
 * Generates an SVG or PNG data URL for the UPI payment QR code.
 */
export async function generateUpiQrDataUrl(upiUri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(upiUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}

/**
 * Creates a pre-filled WhatsApp message for notifying the farm owner about a new order.
 */
export function buildOwnerWhatsAppAlert(order: OrderRecord, settings: FarmSettings): string {
  const itemsText = order.items
    .map(i => `• ${i.quantity}x ${i.packName} (${i.quantity * i.eggCount} eggs) - ₹${i.quantity * i.unitPrice}`)
    .join('\n');

  const text = `🥚 *NEW NATTU KOZHI EGG ORDER!* (${order.id})
-----------------------------------
*Customer:* ${order.customer.fullName}
*Mobile:* ${order.customer.phone}
*Address:* ${order.customer.address}, ${order.customer.landmark ? 'Near ' + order.customer.landmark + ', ' : ''}${order.customer.area} - ${order.customer.pincode}
*Slot:* ${order.customer.deliverySlot}

*Items:*
${itemsText}

*Total Eggs:* ${order.totalEggs} Nattu Kozhi Eggs
*Subtotal:* ₹${order.subtotal}
*Delivery Fee:* ₹${order.deliveryFee === 0 ? 'FREE' : '₹' + order.deliveryFee}
*TOTAL AMOUNT:* ₹${order.totalAmount}
*Payment Method:* Direct GPay / UPI
*UPI Ref/UTR:* ${order.upiReferenceId || 'Pending verification'}

*Customer Note:* ${order.customer.specialInstructions || 'None'}
-----------------------------------
Please verify GPay payment and start fresh egg packing!`;

  const cleanPhone = settings.ownerPhone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Creates a pre-filled WhatsApp message for the customer with live tracking link and order receipt.
 */
export function buildCustomerOrderShare(order: OrderRecord, settings: FarmSettings): string {
  const itemsText = order.items
    .map(i => `• ${i.quantity}x ${i.packName} (₹${i.quantity * i.unitPrice})`)
    .join('\n');

  const text = `🥚 *${settings.farmName} - ORDER CONFIRMED!*
-----------------------------------
Hello ${order.customer.fullName}! Thank you for supporting our poultry farm.
*Order ID:* ${order.id}
*Status:* ${order.status.replace('_', ' ').toUpperCase()}

*Your Fresh Eggs:*
${itemsText}
*Total Eggs:* ${order.totalEggs} eggs
*Amount Paid:* ₹${order.totalAmount}
*Delivery Address:* ${order.customer.address}, ${order.customer.area}
*Delivery Slot:* ${order.customer.deliverySlot}

Farm Helpline / WhatsApp: +91 ${settings.ownerPhone}
Fresh morning eggs are candled & packed safely in paper-pulp trays!`;

  const cleanPhone = order.customer.phone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}
