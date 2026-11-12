require("dotenv").config();
const express = require("express");
const path = require("path");
const { createOrder, captureOrder, verifyWebhook } = require("./paypal");
const { explainEvent } = require("./ai");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

const events = []; // in-memory store: fine for a prototype (resets on restart)

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  });

// Public client id for the PayPal JS SDK (never expose the secret)
app.get("/api/config", (_, res) => res.json({ clientId: process.env.PAYPAL_CLIENT_ID }));

app.post("/api/orders", wrap(async (req, res) => {
  const order = await createOrder(req.body.amount || "10.00");
  res.json(order);
}));

app.post("/api/orders/:id/capture", wrap(async (req, res) => {
  const { status, body } = await captureOrder(req.params.id, req.body.mockCode);
  const failed = status >= 400;
  const evt = {
    id: req.params.id,
    time: new Date().toISOString(),
    source: "api",
    status: failed ? "FAILED" : "COMPLETED",
    amount: req.body.amount,
    errorName: body.name,
    errorMessage: body.message,
    errorDetails: body.details,
    raw: body,
  };
  events.unshift(evt);
  res.json(evt);
}));

app.post("/webhook", wrap(async (req, res) => {
  if (!(await verifyWebhook(req.headers, req.body))) return res.sendStatus(400);
  const e = req.body;
  let status = e.event_type;
  if (e.event_type.includes("DENIED")) status = "FAILED";
  else if (e.event_type.includes("COMPLETED")) status = "COMPLETED";
  else if (e.event_type.includes("DISPUTE")) status = "DISPUTE";
  events.unshift({
    id: e.id,
    time: e.create_time,
    source: "webhook",
    status,
    eventType: e.event_type,
    amount: e.resource?.amount?.value || e.resource?.disputed_transactions?.[0]?.gross_amount?.value,
    raw: e,
  });
  res.sendStatus(200);
}));

app.get("/api/events", (_, res) => res.json(events));

app.post("/api/explain/:id", wrap(async (req, res) => {
  const evt = events.find((e) => e.id === req.params.id);
  if (!evt) return res.sendStatus(404);
  res.json(await explainEvent(evt, events));
}));

app.listen(process.env.PORT || 3000, () =>
  console.log("DeclineDoctor running on port " + (process.env.PORT || 3000))
);
