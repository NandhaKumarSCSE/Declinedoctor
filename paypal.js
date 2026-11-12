const BASE = "https://api-m.sandbox.paypal.com";

async function getToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString("base64");
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await r.json();
  if (!data.access_token) throw new Error("PayPal auth failed: check CLIENT_ID / SECRET");
  return data.access_token;
}

async function createOrder(amount, currency = "USD") {
  const token = await getToken();
  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: currency, value: String(amount) } }],
    }),
  });
  return r.json();
}

// mockCode enables PayPal sandbox negative testing, e.g. INSTRUMENT_DECLINED
async function captureOrder(orderId, mockCode) {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (mockCode) {
    headers["PayPal-Mock-Response"] = JSON.stringify({ mock_application_codes: mockCode });
  }
  const r = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers,
  });
  return { status: r.status, body: await r.json() };
}

async function verifyWebhook(headers, event) {
  const token = await getToken();
  const r = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: event,
    }),
  });
  return (await r.json()).verification_status === "SUCCESS";
}

module.exports = { createOrder, captureOrder, verifyWebhook };
