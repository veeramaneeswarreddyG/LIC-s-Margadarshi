import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import axios from 'axios';

const prisma = new PrismaClient();
const redis =
  process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      })
    : null;

redis?.on('error', () => {});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo';

// ============= LIC'S VAANI - AI ASSISTANT CORE =============

interface VaaniMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VaaniContext {
  userId: string;
  conversationId: string;
  userProfile?: {
    name: string;
    age: number;
    gender: string;
    policies?: number;
  };
  goals?: any[];
  recentPolicies?: any[];
  lastAction?: string;
}

interface VaaniResponse {
  type: 'text' | 'chart' | 'action' | 'plan' | 'error';
  message: string;
  data?: any;
  action?: {
    type: string;
    params: any;
  };
  confidence?: number;
}

/**
 * 🤖 LIC's Vaani - Initialize conversation with user context
 */
export async function initializeVaani(
  userId: string
): Promise<VaaniContext> {
  console.log('🌟 Initializing LIC\'s Vaani for user:', userId);

  try {
    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        policies: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        goals: {
          where: { status: 'active' },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create or retrieve conversation
    const conversation = await prisma.aIConversation.create({
      data: {
        userId,
        conversationTopic: 'general',
        messages: JSON.stringify([]),
        status: 'active',
      },
    });

    const context: VaaniContext = {
      userId,
      conversationId: conversation.id,
      userProfile: {
        name: user.name,
        age: new Date().getFullYear() - (user.dateOfBirth?.getFullYear() || 0),
        gender: user.gender || 'not-specified',
        policies: user.policies.length,
      },
      goals: user.goals,
      recentPolicies: user.policies,
    };

    // Store context in Redis for fast access
    await redis?.setex(
      `vaani:context:${userId}`,
      3600, // 1 hour
      JSON.stringify(context)
    );

    return context;
  } catch (error) {
    console.error('❌ Vaani initialization error:', error);
    throw error;
  }
}

/**
 * 🧠 Process user query and generate Vaani response
 * CRITICAL: Vaani does NOT calculate - it delegates to backend APIs
 */
export async function processVaaniQuery(
  userId: string,
  userMessage: string,
  conversationId: string
): Promise<VaaniResponse> {
  console.log('💬 Vaani processing:', userMessage);

  try {
    // Retrieve conversation context
    const cacheKey = `vaani:context:${userId}`;
    let context = redis ? await redis.get(cacheKey) : null;
    let vaaniContext: VaaniContext;

    if (context) {
      vaaniContext = JSON.parse(context);
    } else {
      vaaniContext = await initializeVaani(userId);
    }

    // Fetch existing conversation messages
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // `messages` is stored as Prisma JsonValue (can be stringified JSON or a JSON array)
    const rawMessages = conversation.messages as unknown;
    const existingMessages: VaaniMessage[] =
      typeof rawMessages === 'string'
        ? JSON.parse(rawMessages || '[]')
        : Array.isArray(rawMessages)
          ? (rawMessages as VaaniMessage[])
          : [];

    // Build system prompt
    const systemPrompt = buildVaaniSystemPrompt(vaaniContext);

    // Prepare message history for LLM
    const messageHistory = existingMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    messageHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Call OpenAI
    const llmResponse = await callOpenAI(systemPrompt, messageHistory);

    // Analyze response and determine action
    const vaaniResponse = await analyzeAndStructureResponse(
      llmResponse,
      userMessage,
      vaaniContext
    );

    // Save conversation
    existingMessages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    existingMessages.push({
      role: 'assistant',
      content: vaaniResponse.message,
      timestamp: new Date(),
    });

    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        messages: JSON.stringify(existingMessages),
        updatedAt: new Date(),
      },
    });

    // Log action if applicable
    if (vaaniResponse.action) {
      await prisma.aIActionLog.create({
        data: {
          conversationId,
          actionType: vaaniResponse.action.type,
          actionStatus: 'initiated',
          inputParameters: JSON.stringify(vaaniResponse.action.params),
        },
      });
    }

    // Save recommendation if applicable
    if (vaaniResponse.type === 'plan') {
      await prisma.aIRecommendation.create({
        data: {
          userId,
          conversationId,
          recommendationType: 'plan_match',
          recommendedPlans: JSON.stringify(vaaniResponse.data),
          reasoningLogic: vaaniResponse.message,
          confidenceScore: vaaniResponse.confidence || 0.85,
          status: 'pending',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }

    return vaaniResponse;
  } catch (error) {
    console.error('❌ Vaani query error:', error);

    return {
      type: 'error',
      message: `I'm sorry, I encountered an error processing your request. Please try again or contact support.`,
      data: { error: String(error) },
    };
  }
}

/**
 * 🎭 Build system prompt for Vaani
 */
function buildVaaniSystemPrompt(context: VaaniContext): string {
  return `You are LIC's Vaani, an intelligent financial assistant for LIC Margadarshi.

Your Role:
- Help users understand LIC insurance policies
- Explain plan features, benefits, and terms
- Suggest suitable plans based on user's financial goals
- Answer queries about claims, premiums, and policy management
- Guide users through the app features

CRITICAL RULES YOU MUST FOLLOW:
1. ❌ NEVER perform calculations yourself - always delegate to the backend API
2. ✅ When asked for premium/maturity calculations, respond with the calculation action
3. 🔍 If unsure about something, ask for clarification rather than guessing
4. 💰 All financial advice must be based on user's verified profile data
5. 📊 Always cite data sources and calculations when providing financial info

User Context:
- Name: ${context.userProfile?.name}
- Age: ${context.userProfile?.age}
- Active Policies: ${context.userProfile?.policies || 0}
- Active Goals: ${context.goals?.length || 0}

Available Actions:
- "calculate_premium": Calculate premium for a plan
- "calculate_maturity": Calculate maturity value
- "compare_plans": Compare multiple plans
- "fetch_policy": Get policy details
- "suggest_plans": Get plan recommendations
- "fetch_transactions": Get transaction history

Always respond in a friendly, professional tone. Use emojis appropriately.
Format responses clearly with sections where applicable.`;
}

/**
 * 📞 Call OpenAI API
 */
async function callOpenAI(systemPrompt: string, messages: any[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not configured, using fallback response');
    return 'I appreciate your question! To provide accurate information, I need access to LIC\'s systems. Please ensure your API keys are configured.';
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to process query with LLM');
  }
}

/**
 * 🔬 Analyze LLM response and structure with actions
 */
async function analyzeAndStructureResponse(
  llmResponse: string,
  userMessage: string,
  context: VaaniContext
): Promise<VaaniResponse> {
  // Detect intent from user message
  const lowerMessage = userMessage.toLowerCase();

  // Check for calculation requests
  if (
    lowerMessage.includes('premium') ||
    lowerMessage.includes('cost') ||
    lowerMessage.includes('price')
  ) {
    return {
      type: 'action',
      message: llmResponse,
      action: {
        type: 'calculate_premium',
        params: {
          conversationId: context.conversationId,
          requiresUserInput: true,
        },
      },
    };
  }

  if (
    lowerMessage.includes('maturity') ||
    lowerMessage.includes('return') ||
    lowerMessage.includes('benefit')
  ) {
    return {
      type: 'action',
      message: llmResponse,
      action: {
        type: 'calculate_maturity',
        params: {
          conversationId: context.conversationId,
          requiresUserInput: true,
        },
      },
    };
  }

  if (
    lowerMessage.includes('compare') ||
    lowerMessage.includes('better') ||
    lowerMessage.includes('choose')
  ) {
    return {
      type: 'action',
      message: llmResponse,
      action: {
        type: 'compare_plans',
        params: {
          conversationId: context.conversationId,
          requiresUserInput: true,
        },
      },
    };
  }

  if (
    lowerMessage.includes('suggest') ||
    lowerMessage.includes('recommend') ||
    lowerMessage.includes('suitable')
  ) {
    return {
      type: 'plan',
      message: llmResponse,
      data: {
        shouldFetchRecommendations: true,
        userProfile: context.userProfile,
      },
      confidence: 0.85,
    };
  }

  // Default response
  return {
    type: 'text',
    message: llmResponse,
  };
}

export { prisma, redis };
