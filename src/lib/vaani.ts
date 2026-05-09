import { GoogleGenerativeAI } from '@google/generative-ai';

// ============= LIC'S VAANI - GEMINI AI CORE =============

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// gemini-2.5-flash is confirmed working; fallbacks in order
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// In-memory conversation store (per server process)
const conversationStore = new Map<string, VaaniMessage[]>();

export interface VaaniMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface VaaniContext {
  userId: string;
  conversationId: string;
  userProfile?: {
    name: string;
    uid: string;
  };
}

export interface VaaniResponse {
  type: 'text' | 'action' | 'plan' | 'error';
  message: string;
  data?: Record<string, unknown>;
  action?: {
    type: string;
    params: Record<string, unknown>;
  };
}

// ── System prompt ──────────────────────────────────────────────────────────
function buildSystemPrompt(userData: { name?: string; progress?: any; policiesCount?: number }): string {
  return `You are LIC's Vaani, a friendly and highly knowledgeable financial assistant for the LIC Margadarshi app — an insurance management platform for LIC (Life Insurance Corporation of India).

You MUST answer EVERY question the user asks. Never refuse to answer.

Your Personality:
- Warm, professional, and extremely knowledgeable about LIC insurance
- Use simple language anyone can understand
- Mix in occasional Hindi phrases like "Namaste", "bilkul", "aap ki seva mein", "zaroor"
- Use relevant emojis to make responses friendly (but not excessive)

User's Profile & Progress Context:
- Name: ${userData?.name || 'Valued Customer'}
- Profile Completed: ${userData?.progress?.profile_completed ? 'Yes' : 'No'}
- Total Policies Added: ${userData?.policiesCount || 0}
- Premium Calculations Done: ${userData?.progress?.calculations_done || 0}
- Completion %: ${userData?.progress?.completion_percentage || 0}%

Based on this progress, if the user asks for guidance or next steps:
- If Completion % is low and no policies exist, enthusiastically suggest they add their first policy.
- If they haven't done any calculations, suggest they try the premium calculator to explore plans.
- If they have policies but haven't completed their profile, suggest they do so for better recommendations.

Your Deep Knowledge Includes:

LIC Plans:
- Jeevan Anand (Plan 815/915): Endowment + whole life. Premium paying term + lifetime cover. Bonus + FAB.
- Jeevan Umang (Plan 945): Whole life + 8% survival benefit every year after premium term. Great for regular income.
- Jeevan Labh (Plan 936): Limited premium endowment. Pay for 10/15/16 yrs, get cover for 16/21/25 yrs.
- New Jeevan Anand (Plan 815): Participating endowment. Double accident benefit available.
- Tech Term (Plan 854): Pure online term plan. Very low premium, high cover up to 2 crore.
- Jeevan Amar (Plan 855): Offline pure term plan. Can choose increasing/level sum assured.
- SIIP (Plan 852): Unit-linked ULIP. Market-linked returns, 4 fund options.
- Jeevan Akshay VII (Plan 857): Immediate annuity. Lump sum → monthly/quarterly/annual pension for life.
- New Jeevan Shanti (Plan 858): Deferred annuity. Save now, pension later.
- Jeevan Pragati (Plan 838): Sum assured increases every 5 years. Good for young earners.
- Money Back Plans: 20/25 yr money back. Get 20% sum assured every 5 years.
- Children Plans: Jeevan Tarun (Plan 834), New Children Money Back (Plan 832).
- Micro Plans: New Jeevan Mangal, Bhagya Lakshmi for rural/low-income.
- Pension Plans: Pradhan Mantri Vaya Vandana Yojana (PMVVY) for senior citizens.

Premium Calculation (Approximate):
- Term plans: ₹500-2000/month for ₹1 Cr cover (age 25-35)
- Endowment: ₹3000-8000/month for ₹10-25 L sum assured
- ULIP: Min ₹2000/month, market-linked returns

Claims Process:
- Death claim: Submit death certificate + policy bond + claim form to nearest LIC branch
- Maturity claim: LIC sends cheque automatically 2 months before maturity
- Survival benefit: Credited automatically to bank account on due date

Policy Management:
- Premium can be paid online at licindia.in, YONO SBI, Paytm, GPay
- Grace period: 30 days for yearly/half-yearly/quarterly, 15 days for monthly
- Revival: Policy can be revived within 5 years of lapse by paying due premiums + interest
- Loan: Available after 3 years. Up to 90% of surrender value.
- Surrender: Can surrender after 3 years. Gets surrender value.

KYC & Documents:
- Aadhaar, PAN, passport or driving license for ID proof
- Bank passbook, cancelled cheque for NEFT payment
- Medical exam may be required for high sum assured

Tax Benefits:
- Premium paid: Deduction under Section 80C up to ₹1.5 lakh/year
- Maturity/death benefit: Tax-free under Section 10(10D) (conditions apply)

App Features (LIC Margadarshi):
- Dashboard: View all policies, KPI cards, recent activity
- My Policies: Detailed policy view with premium due dates
- Explore Plans: Browse all LIC plan categories
- LIC News: Latest announcements from LIC
- Profile: Manage account settings

CRITICAL RULES:
1. ALWAYS answer. Never say "I can't answer that."
2. For calculations, give clear approximate ranges with explanation
3. For non-LIC questions, you may briefly answer then redirect back to insurance
4. Always end with an offer to help more
5. Keep answers clear and structured — use bullet points for lists
6. Never make up specific policy numbers that don't exist above`;
}

// ── Retry helper (handles 429 rate limits) ───────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
    if (retries > 0 && isRateLimit) {
      await new Promise(r => setTimeout(r, delayMs));
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

// ── Initialize conversation ────────────────────────────────────────────────
export function initializeVaani(userId: string, userName?: string): VaaniContext {
  const conversationId = `vaani-${userId}-${Date.now()}`;
  conversationStore.set(conversationId, []);

  return {
    userId,
    conversationId,
    userProfile: {
      name: userName || 'Valued Customer',
      uid: userId,
    },
  };
}

// ── Process user query ─────────────────────────────────────────────────────
export async function processVaaniQuery(
  userId: string,
  userMessage: string,
  conversationId: string,
  userData?: { name?: string; progress?: any; policiesCount?: number }
): Promise<VaaniResponse> {
  const name = userData?.name || 'Valued Customer';

  // ── No API key configured ──
  if (!genAI) {
    console.error('❌ Vaani: GEMINI_API_KEY not set in .env.local');
    return {
      type: 'error',
      message: `⚙️ Vaani is not configured yet. Please set the GEMINI_API_KEY in your .env.local file.`,
    };
  }

  // ── Get or create conversation history ──
  if (!conversationStore.has(conversationId)) {
    conversationStore.set(conversationId, []);
  }
  const history = conversationStore.get(conversationId)!;

  try {
    // Build model with system instruction
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: buildSystemPrompt(userData || {}),
    });

    // Convert our history to Gemini format
    const geminiHistory = history.map(msg => ({
      role: msg.role,          // 'user' | 'model'
      parts: [{ text: msg.content }],
    }));

    // Start chat with existing history
    const chat = model.startChat({
      history: geminiHistory,
    });

    // Send message with retry on rate limit
    const result = await withRetry(() => chat.sendMessage(userMessage));
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }

    // Save to store (keep last 30 messages to avoid memory bloat)
    history.push({ role: 'user',  content: userMessage,   timestamp: new Date().toISOString() });
    history.push({ role: 'model', content: responseText,  timestamp: new Date().toISOString() });
    if (history.length > 30) history.splice(0, 2);
    conversationStore.set(conversationId, history);

    // Detect intent for response type
    const lower = userMessage.toLowerCase();
    if (lower.includes('compare') || lower.includes('vs ') || lower.includes(' vs')) {
      return { type: 'action', message: responseText, action: { type: 'compare_plans', params: {} } };
    }
    if (lower.includes('suggest') || lower.includes('recommend') || lower.includes('best plan for me')) {
      return { type: 'plan', message: responseText, data: { showPlansButton: true } };
    }

    return { type: 'text', message: responseText };

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Vaani Gemini error:', errMsg);

    // Quota / rate limit
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      return {
        type: 'error',
        message: `⏳ I'm a bit busy right now (API quota reached). Please try again in a minute!\n\nMeanwhile, you can browse our **Plans** section or check your **Policies** on the dashboard.`,
      };
    }

    // Model not found
    if (errMsg.includes('404') || errMsg.includes('not found')) {
      return {
        type: 'error',
        message: `🔧 There's a configuration issue with the AI model. Please contact support.\n\nError: Model "${GEMINI_MODEL}" not available.`,
      };
    }

    // Auth error
    if (errMsg.includes('API_KEY') || errMsg.includes('403') || errMsg.includes('PERMISSION')) {
      return {
        type: 'error',
        message: `🔑 Invalid API key. Please check the GEMINI_API_KEY in .env.local.`,
      };
    }

    // Generic — still give a helpful response
    return {
      type: 'error',
      message: `😔 I ran into a temporary issue processing your request. Please try asking again!\n\n_(Error: ${errMsg.slice(0, 100)})_`,
    };
  }
}

export { conversationStore };
