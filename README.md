# DeclineDoctor 🩺

### AI-Powered PayPal Payment Failure & Fraud Explainer

DeclineDoctor is an AI-powered payment monitoring and explanation platform that helps merchants understand failed PayPal transactions, identify suspicious payment patterns, and communicate better with customers.

It integrates the PayPal Developer Sandbox with Google Gemini AI to convert complex payment errors into simple, actionable explanations.

## 🚀 Features

- **PayPal Payment Simulator:** Simulate successful and failed payments using PayPal Sandbox.
- **Live Event Feed:** Monitor payment events, transaction IDs, amounts, and statuses.
- **AI Payment Explanation:** Uses Google Gemini API to explain why a payment failed.
- **Risk Assessment:** Identifies potential risks using heuristic-based signals.
- **Recommended Actions:** Provides practical suggestions to resolve payment failures.
- **Customer Reply Generator:** Generates ready-to-send customer support messages.
- **Pattern Detection:** Flags repeated payment failures that may indicate suspicious activity.
- **Webhook Integration:** Receives and verifies PayPal webhook events.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML, CSS, JavaScript | Frontend |
| Node.js | Backend runtime |
| Express.js | Backend framework |
| PayPal Developer Sandbox | Payment processing |
| PayPal Orders API | Order creation and capture |
| PayPal Webhooks | Payment event notifications |
| Google Gemini API | AI-powered explanations |
| Render | Application deployment |

## 🏗️ Architecture

1. The user initiates a payment through the dashboard.
2. The backend communicates with PayPal Sandbox.
3. Payment responses and webhook events are recorded.
4. Suspicious or failed events are sent to Google Gemini.
5. Gemini generates explanations, risk levels, recommended actions, and customer replies.
6. Results are displayed on the dashboard.

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/NandhaKumarSCSE/Declinedoctor.git
cd Declinedoctor
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model
```

Use your actual Gemini model configuration and variable names from the backend code.

### 4. Start the application

```bash
npm start
```

Open your browser and visit:

```text
http://localhost:3000
```

## 🔐 Security

- API keys are stored in environment variables.
- Never commit `.env` files or secret credentials.
- PayPal webhook signatures are verified.
- PayPal Sandbox is used for testing transactions.

## 🤖 How AI Is Used

DeclineDoctor integrates the Google Gemini API to analyse payment failure events.

The AI receives payment information, error details, heuristic risk signals, and recent event history.

It generates structured explanations containing:

- Payment failure summary
- Likely cause
- Recommended actions
- Risk level (Low, Medium, High)
- Suggested customer response

**Important:** Fraud signals are heuristic indicators, not confirmed fraud findings. Gemini acts as an explanation assistant and does not make final payment or fraud decisions.

## 🌐 Deployment

The application is deployed using Render.

Add all required environment variables in the Render dashboard before deploying.

## 🔮 Future Improvements

- Advanced fraud pattern detection
- More detailed payment analytics
- Merchant notification system
- Improved AI-generated recommendations
- Support for additional payment failure scenarios

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 👨‍💻 Project

**Project Name:** DeclineDoctor

**Category:** AI + FinTech

**Payment Platform:** PayPal Developer Sandbox

**AI Platform:** Google Gemini API
