# DeclineDoctor: AI Payment Failure Explainer

DeclineDoctor turns cryptic PayPal payment errors into plain-English diagnoses, recommended fixes,
a risk level, and a ready-to-send customer reply, powered by Claude.

## What it does
- Simulates PayPal **sandbox** payments, including failures (INSTRUMENT_DECLINED, TRANSACTION_REFUSED, PAYER_ACTION_REQUIRED)
- Captures events via the **PayPal Orders API** and **signature-verified webhooks**
- Shows a live event feed with Completed / Failed / Dispute badges
- **Claude** returns a structured diagnosis: summary, likely cause, recommended actions, risk level, customer reply
- Computes heuristic risk signals in code (high amount, repeated failures) and gives them to Claude

## How PayPal is used
Orders v2 API (create and capture), sandbox negative testing via the `PayPal-Mock-Response` header,
JS SDK Buttons for real sandbox payments, and Webhooks (`PAYMENT.CAPTURE.COMPLETED`,
`PAYMENT.CAPTURE.DENIED`, `CUSTOMER.DISPUTE.CREATED`) verified with PayPal's signature API.

## How AI is used
Claude (model set by `CLAUDE_MODEL`) receives the event, code-computed risk signals, and recent history,
and replies with strict JSON. The AI is an **explainer, not the decision-maker**; fraud signals are heuristic.

## Run locally
Requires Node.js 18+.
```bash
git clone https://github.com/YOUR-USERNAME/declinedoctor.git
cd declinedoctor
npm install
cp .env.example .env     # then fill in your keys
npm start                # http://localhost:3000
```

## Required setup
1. Create a PayPal developer account at https://developer.paypal.com and open **Sandbox > Apps & Credentials**.
2. Create an app and copy the **Client ID** and **Secret** into `.env`.
3. Use the default sandbox **Personal (buyer)** account to approve test payments.
4. Add an Anthropic API key as `ANTHROPIC_API_KEY`.
5. (Optional) Webhooks: in your sandbox app add `https://YOUR-URL/webhook` with the three events above
   and copy the **Webhook ID** into `PAYPAL_WEBHOOK_ID`. For local testing, expose localhost with ngrok.

## Try it
1. Open the app, pick `INSTRUMENT_DECLINED`, click **Run simulated failure**.
2. Click **Explain with AI** on the new event.
3. Or choose the first option and pay with the PayPal button using a sandbox buyer account.

## Tech stack
Node.js, Express, PayPal REST API and JS SDK (sandbox), Anthropic Claude API, plain HTML/JS, Render.

## Notes
- Events are stored in memory and reset on restart (prototype).
- Sandbox only. No real money moves. Never commit real keys.

## License
MIT
