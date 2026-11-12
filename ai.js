const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// Heuristic risk signals computed in code, so the AI explains grounded data.
function riskSignals(event, history) {
  const signals = [];
  const amt = parseFloat(event.amount || 0);
  if (amt > 500) signals.push("High amount (over 500)");
  const recentFails = history.filter((e) => e.status === "FAILED").length;
  if (recentFails >= 3) {
    signals.push(`${recentFails} failed payments recorded recently (possible card testing)`);
  }
  if (event.status === "DISPUTE") signals.push("Customer opened a dispute");
  return signals;
}

async function explainEvent(event, history) {
  const signals = riskSignals(event, history);
  const msg = await client.messages.create({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-5-5",
    max_tokens: 700,
    system:
      "You are a payments support analyst. Reply ONLY with JSON, no markdown: " +
      '{"summary": string, "likely_cause": string, "recommended_actions": string[], ' +
      '"risk_level": "low"|"medium"|"high", "customer_message": string}. ' +
      "Use only the data given. Do not invent facts. Fraud signals are heuristic.",
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          event,
          risk_signals: signals,
          recent_history: history.slice(0, 5),
        }),
      },
    ],
  });
  const text = msg.content
    .map((b) => b.text || "")
    .join("")
    .replace(/```json|```/g, "")
    .trim();
  try {
    return { ...JSON.parse(text), risk_signals: signals };
  } catch {
    return {
      summary: text.slice(0, 300),
      likely_cause: "Could not parse structured output",
      recommended_actions: [],
      risk_level: "medium",
      customer_message: "",
      risk_signals: signals,
    };
  }
}

module.exports = { explainEvent };
