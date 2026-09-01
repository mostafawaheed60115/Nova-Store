const TO = 'mostafawaheed@nova-solution.net';
const FROM = 'Nova Store <sales@nova-solution.net>';
const TEMPLATE_ID = 'nova-store-new-order';

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

function money(value) {
  return `${Number(value || 0).toLocaleString('en-EG')} EGP`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const orderId = Number(req.body?.orderId);
  const order = req.body?.order;
  if (!Number.isInteger(orderId) || orderId <= 0 || !order) {
    return json(res, 400, { error: 'A valid order summary is required.' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return json(res, 500, { error: 'Server email configuration is incomplete.' });
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const itemDetails = items.length
    ? items
        .map((item, index) => {
          const name = item.product?.name || item.name || 'Nova item';
          const quantity = Number(item.quantity) || 1;
          const total = (Number(item.price || item.product?.price) || 0) * quantity;
          return `${index + 1}. ${name} × ${quantity} — ${money(total)}`;
        })
        .join('\n')
    : 'No line items recorded';
  const orderDetails = [
    `Order code: ${order.orderCode || '—'}`,
    `Items:\n${itemDetails}`,
    `Subtotal: ${money(order.subtotalPrice)}`,
    `Discount: ${money(order.totalDiscount)}`,
    `Shipping: ${money(order.totalShippingFee)}`,
    `Total: ${money(order.finalPrice)}`,
    `Payment: ${order.paymentMethod || '—'}`,
  ].join('\n');

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `nova-store-order-${orderId}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      template: {
        id: TEMPLATE_ID,
        variables: {
          NAME: order.customerName || '—',
          PHONE: [order.customerPhone, order.customerPhoneSecondary].filter(Boolean).join(' / ') || '—',
          ADDRESS: order.shippingAddress || '—',
          NOTES: order.notes || 'لا توجد ملاحظات',
          ORDER_DETAILS: orderDetails,
        },
      },
    }),
  });

  if (!resendResponse.ok) {
    console.error('Resend order notification failed:', await resendResponse.text());
    return json(res, 502, { error: 'Order saved, but notification delivery failed.' });
  }

  return json(res, 200, { success: true, orderId });
}
