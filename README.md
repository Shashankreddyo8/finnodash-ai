🧠 FINNOLAN — AI-Powered Financial Research Assistant
🏆 Why the Name FINNOLAN?

Inspired by Christopher Nolan, known for:

complex narratives

precision

deep logic

intelligent storytelling

FinnoDash-AI reflects the same qualities — smart, layered, structured, intelligent, and ahead of its time.
FINNOLAN = Finance + Nolan-level intelligence.
A modern, intelligent financial analytics platform inspired by the precision and complexity of Christopher Nolan’s storytelling.

FINNOLAN is an AI-driven financial research assistant that unifies real-time stock data, news summarization, sentiment analysis, AI insights, and automated notifications into a single, seamless dashboard.
Designed for students, beginners, and retail traders, FINNOLAN eliminates the need to switch between multiple financial tools by integrating market intelligence, automation, and conversational AI into one cohesive system.

🚀 Key Highlights

Real-Time Market Data — Live stock prices, trends, and volatility indicators.

AI News Summaries — Gemini-powered summarization of financial articles.

Sentiment Analysis — Detect positive, negative, or neutral market signals.

AI Insight Engine — Structured JSON recommendations, risk levels & confidence scores.

Automated Alerts (n8n) — WhatsApp/Email triggers for price movement & watchlist activity.

Interactive Dashboard — Clean, fast, responsive UI for all device sizes.

URL Summarization & AI Chat — Instant comprehension of articles and financial queries.

🧰 Tech Stack
Frontend (Nithin & Prajwal)

React + TypeScript

Tailwind CSS, ShadCN UI

Chart.js / Recharts

Supabase JS SDK

Backend & Integration (Shashank)

Supabase (Auth, PostgreSQL, Edge Functions)

Gemini API for summarization, sentiment, and structured insights

Secure serverless functions for market data and news retrieval

Automation Workflows (Balaji)

n8n Workflows

Supabase Webhooks → WhatsApp/Email Alerts

Scheduled market updates

AI-powered automated responses

✨ Core Features
1. Unified Financial Dashboard

View stock metrics, sentiment scores, summaries, and AI insights in one place—no switching apps.

2. AI Summaries & Sentiment Engine

Gemini LLM transforms long articles into:

Bullet summaries

Sentiment classification

Confidence scores

Key influencing factors

3. Conversational AI Assistant

Ask financial questions, interpret news, or explore market insights through an intelligent chat interface.

4. Watchlist with Automated Alerts

n8n monitors price thresholds, daily updates, and sentiment shifts—then sends:

WhatsApp messages

Email alerts

Structured AI explanations

5. URL Summarizer

Paste any article URL → instantly receive an AI summary, sentiment, and key insights.

6. Modern, Responsive UI

Clean, minimal, mobile-friendly design built for speed and clarity.

🏗️ System Architecture
Frontend → Supabase → Edge Functions → AI Models → n8n Automation

React UI sends search/query requests

Edge Functions fetch market data or news

Gemini AI analyzes, summarizes & generates insights

Supabase stores watchlists, history & triggers automation

n8n delivers notifications to user devices

This modular structure ensures scalability, low latency, and seamless integration.

📦 Project Structure
FINNOLAN/
│── frontend/              # React + TypeScript UI
│── supabase/              # SQL, migrations, schemas
│── edge-functions/        # Serverless backend logic
│── n8n/                   # Automation workflows
│── assets/                # Images & documentation
│── README.md

🛠️ Installation & Setup
1. Clone the repository
git clone https://github.com/Shashankreddyo8/finnodash-ai
cd finnodash-ai

2. Install Frontend
npm install
npm run dev

3. Configure Environment

Create .env:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
NEWS_API_KEY=
FINANCE_API_KEY=
N8N_WEBHOOK_URL=

4. Deploy Supabase Functions
supabase functions deploy fetch-market-data
supabase functions deploy fetch-news
supabase functions deploy summarize-article
supabase functions deploy chat

5. Setup n8n Workflows

Import:

watchlist-alert.json

query-bot.json

scheduled-summary.json

Update:

Webhook URLs

API keys

📈 Performance Summary

Market data latency: 180–250 ms

AI summarization: 1.2–1.6 seconds

Alert delivery (n8n): 3–5 seconds

Dashboard FPS: 55–60 on desktop

FINNOLAN is optimized for real-time performance and low-bandwidth environments.

👨‍💻 Team & Contributions
Name	Role	Contributions
**Balaji R	Automation (n8n)	Alerts, workflows, WhatsApp bot, scheduled summaries**
**Shashank N	Backend & Integration	Edge Functions, AI pipelines, DB schemas, security
Nithin P Gowda	Frontend Development	Dashboard UI, chat panel, search interface
Prajwal S K	Frontend + Visualization	Charts, executive summary, sentiment UI******
🎯 Project Vision

FINNOLAN aims to:

Simplify financial research

Make market analysis accessible to beginners

Provide structured, interpretable AI insights

Reduce dependency on multiple disconnected platforms

Inspired by Christopher Nolan, FINNOLAN represents clarity built on complexity—an intelligent system designed for deep financial understanding.

🏁 Conclusion

FINNOLAN delivers a unified, AI-first financial research experience with automation, speed, and clarity.
It sets a strong foundation for future expansions including:

Portfolio optimization

Predictive modelling

Voice-enabled financial agents

RAG-powered deep financial reasoning

FINNOLAN is not just a dashboard—it's the next step in intelligent financial analysis.

