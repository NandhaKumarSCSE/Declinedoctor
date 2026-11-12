// Uses Google Gemini (free tier) via its REST API, with retries.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(model, payload) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  return { ok: r.ok, status: r.status, data };
}

async function explainEvent(event, history) {
  const signals = riskSignals(event, history);
  const payload = {
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
  };

  const models = [process.env.GEMINI_MODEL || "gemini-3.8-flash"];
  if (process.env.GEMINI_FALLBACK_MODEL) models.push(process.env.GEMINI_FALLBACK_MODEL);

  let result;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      result = await callGemini(model, payload);
      if (result.ok) break;
      if (![429, 500, 503].includes(result.status)) break; // not retryable
      await sleep(1500 * (attempt + 1));
    }
    if (result.ok) break;
  }
  if (!result.ok) {
    throw new Error(result.data.error?.message || "Gemini request failed");
  }

  const text = (result.data.candidates?.[0]?.content?.parts || [])
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
