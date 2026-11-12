// Uses Google Gemini (free tier) via its REST API. No SDK needed.
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

const SYSTEM =
  "You are a payments support analyst. Reply ONLY with JSON: " +
  '{"summary": string, "likely_cause": string, "recommended_actions": string[], ' +
  '"risk_level": "low"|"medium"|"high", "customer_message": string}. ' +
  "Use only the data given. Do not invent facts. Fraud signals are heuristic.";

async function explainEvent(event, history) {
  const signals = riskSignals(event, history);
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: JSON.stringify({
                event,
                risk_signals: signals,
                recent_history: history.slice(0, 5),
              }),
            },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
    }),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "Gemini request failed");

  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
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
