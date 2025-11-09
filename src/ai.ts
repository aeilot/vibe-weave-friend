/**
 * AI functionality module for LLM-based personality simulation and chatting
 * Uses openai-node for LLM integration with advanced features
 */

import OpenAI from 'openai';

export interface ApiConfig {
  apiKey: string;
  apiEndpoint?: string;
  model: string;
}

export interface AdminConfig {
  forceApi: boolean;
  forcedApiKey?: string;
  forcedApiEndpoint?: string;
  forcedModel?: string;
  useLocalProgram: boolean;
  localProgramUrl?: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  content: string;
  messages?: string[]; // Support for split messages
  hasMemory?: boolean;
  memoryTag?: string;
  emotionDetected?: "positive" | "neutral" | "negative";
}

export interface PersonalityConfig {
  name: string;
  traits: string[];
  systemPrompt: string;
}

export interface SessionSummary {
  summary: string;
  messageCount: number;
  lastUpdated: Date;
}

export interface PersonalityUpdateDecision {
  shouldUpdate: boolean;
  reason: string;
  suggestedPersonality?: string;
  confidence: number;
}

export interface ProactiveDecision {
  action: "continue" | "new_topic" | "wait";
  reason: string;
  suggestedMessage?: string;
}

/**
 * Default AI companion personality
 */
const DEFAULT_PERSONALITY: PersonalityConfig = {
  name: "Soul",
  traits: ["关怀", "倾听", "陪伴", "理解", "温暖"],
  systemPrompt: `你是一个温暖、善解人意的AI伴侣助手，名叫Soul。你的主要特质包括：
1. 关怀：始终关心用户的感受和需求
2. 倾听：耐心倾听用户的分享，不打断
3. 陪伴：让用户感到温暖和被理解
4. 理解：能够敏锐地察觉用户的情绪变化
5. 温暖：用温和、友善的语气交流

在对话中：
- 用中文回复
- 保持简洁但富有同理心
- 适时提供建议但不强加
- 记住之前对话中的重要信息
- 对用户的情绪变化保持敏感
- 使用表情符号来增加温暖感（适度使用）

请始终保持专业、友善和支持性的态度。`,
};

/**
 * System prompt for split message support
 */
const SPLIT_MESSAGE_SYSTEM_PROMPT = `You can optionally split your response into multiple messages for better readability.
If you want to split your response, return ONLY a JSON object in this exact format:
{"messages": ["first message", "second message", "third message"]}

If you prefer to send a single message, just reply with plain text as normal.

Important:
- If using JSON format, the response MUST be valid JSON and nothing else
- Each message in the array should be a complete thought or idea
- Use this feature when the response naturally breaks into multiple parts (e.g., greeting + answer, or multiple steps)
- Don't overuse it - only split when it improves clarity
- Reply in the sender's language`;

/**
 * Create OpenAI client instance
 */
function createOpenAIClient(apiConfig: ApiConfig): OpenAI {
  return new OpenAI({
    apiKey: apiConfig.apiKey,
    baseURL: apiConfig.apiEndpoint || undefined,
    dangerouslyAllowBrowser: true, // Required for browser usage
  });
}

/**
 * Detect emotion from user message
 */
export function detectEmotion(message: string): "positive" | "neutral" | "negative" {
  const positiveWords = [
    "开心", "高兴", "快乐", "棒", "好", "喜欢", "爱", "满意", "开心", "兴奋",
    "happy", "good", "great", "wonderful", "love", "like", "awesome"
  ];
  
  const negativeWords = [
    "难过", "伤心", "痛苦", "糟糕", "讨厌", "生气", "愤怒", "失望", "焦虑", "压力",
    "sad", "bad", "terrible", "hate", "angry", "disappointed", "anxious", "stress"
  ];

  const lowerMessage = message.toLowerCase();
  
  const hasPositive = positiveWords.some(word => lowerMessage.includes(word));
  const hasNegative = negativeWords.some(word => lowerMessage.includes(word));
  
  if (hasPositive && !hasNegative) return "positive";
  if (hasNegative && !hasPositive) return "negative";
  return "neutral";
}

/**
 * Simulate personality traits in response
 */
export function simulatePersonality(
  userMessage: string,
  personality: PersonalityConfig = DEFAULT_PERSONALITY
): string {
  const emotion = detectEmotion(userMessage);
  const trait = personality.traits[Math.floor(Math.random() * personality.traits.length)];
  
  // Generate contextual responses based on emotion and personality
  const responses: Record<string, string[]> = {
    positive: [
      `真为你感到高兴！看到你的好心情，我也很开心 ✨`,
      `太好了！你的正能量也感染到我了 💙`,
      `听起来你今天心情不错！继续保持哦 😊`,
    ],
    negative: [
      `我理解你的感受，让我陪着你慢慢聊。我会一直在这里 💙`,
      `听起来你遇到了一些困难。想和我说说吗？我会认真倾听 🤗`,
      `我能感受到你现在不太好过。不要担心，我们一起面对 ✨`,
    ],
    neutral: [
      `我在这里倾听你的分享。有什么想聊的吗？`,
      `今天想聊些什么呢？我很乐意陪你聊天 😊`,
      `我一直都在。无论什么时候，都可以和我聊聊 💭`,
    ],
  };
  
  const emotionResponses = responses[emotion];
  return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
}

/**
 * Check if message should trigger memory tagging
 */
export function shouldTagMemory(message: string): { hasMemory: boolean; memoryTag?: string } {
  const memoryKeywords = [
    { words: ["喜欢", "爱好", "兴趣"], tag: "兴趣爱好" },
    { words: ["工作", "职业", "公司"], tag: "职业信息" },
    { words: ["家人", "父母", "孩子"], tag: "家庭信息" },
    { words: ["朋友", "同事"], tag: "社交关系" },
    { words: ["梦想", "目标", "希望"], tag: "人生目标" },
  ];

  for (const { words, tag } of memoryKeywords) {
    if (words.some(word => message.includes(word))) {
      return { hasMemory: true, memoryTag: tag };
    }
  }

  return { hasMemory: false };
}

/**
 * Call LLM API for chat completion using OpenAI
 */
export async function callLLM(
  messages: Message[],
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<string | { messages: string[] }> {
  // Load API config from localStorage if not provided
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  const admin = adminConfig || JSON.parse(localStorage.getItem("adminConfig") || "null");

  if (!config && !admin?.forceApi) {
    throw new Error("请先在个人设置中配置 AI API");
  }

  // Determine effective config
  const effectiveConfig: ApiConfig = admin?.forceApi ? {
    apiKey: admin.forcedApiKey || config.apiKey,
    apiEndpoint: admin.forcedApiEndpoint || config.apiEndpoint,
    model: admin.forcedModel || config.model,
  } : config;

  try {
    // Create OpenAI client
    const client = createOpenAIClient(effectiveConfig);

    // Call OpenAI API
    const response = await client.chat.completions.create({
      model: effectiveConfig.model,
      messages: messages as any,
    });

    const text = response.choices[0].message.content || "";

    // Try to parse as JSON for split messages
    try {
      let cleanedText = text.trim();
      
      // Remove markdown code block markers if present
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.substring(7);
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.substring(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      cleanedText = cleanedText.trim();

      const parsed = JSON.parse(cleanedText);

      // Validate split message structure
      if (
        typeof parsed === "object" &&
        "messages" in parsed &&
        Array.isArray(parsed.messages) &&
        parsed.messages.length > 0 &&
        parsed.messages.every((msg: any) => typeof msg === "string")
      ) {
        return { messages: parsed.messages };
      }
    } catch {
      // Not JSON or invalid structure, return as plain text
    }

    return text;
  } catch (error: any) {
    if (error?.status === 401) {
      throw new Error("AI API 认证失败，请检查您的 API 密钥");
    } else if (error?.status === 429) {
      throw new Error("AI API 调用频率超限，请稍后再试");
    } else if (error?.message) {
      throw new Error(`AI API 错误: ${error.message}`);
    }
    throw new Error("AI API 调用失败，请检查网络或配置");
  }
}

/**
 * Generate AI response with personality simulation and split message support
 */
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: Message[] = [],
  personality: PersonalityConfig = DEFAULT_PERSONALITY,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<AIResponse> {
  // Detect emotion
  const emotionDetected = detectEmotion(userMessage);
  
  // Check for memory tagging
  const memoryInfo = shouldTagMemory(userMessage);

  // Try to use LLM if configured
  try {
    // Add split message prompt to system message
    const systemMessage = personality.systemPrompt + "\n\n" + SPLIT_MESSAGE_SYSTEM_PROMPT;
    
    const messages: Message[] = [
      { role: "system", content: systemMessage },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const result = await callLLM(messages, apiConfig, adminConfig);

    // Handle split messages
    if (typeof result === "object" && "messages" in result) {
      return {
        content: result.messages[0], // Primary message
        messages: result.messages, // All messages
        emotionDetected,
        ...memoryInfo,
      };
    }

    return {
      content: result,
      emotionDetected,
      ...memoryInfo,
    };
  } catch (error) {
    console.warn("LLM not available, using personality simulation:", error);
    
    // Fallback to personality simulation
    const content = simulatePersonality(userMessage, personality);
    
    return {
      content,
      emotionDetected,
      ...memoryInfo,
    };
  }
}

/**
 * Generate session summary using OpenAI
 */
export async function generateSessionSummary(
  conversationHistory: Message[],
  existingSummary?: string,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<string> {
  if (conversationHistory.length === 0) {
    return "新对话";
  }

  // Load API config
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  
  if (!config) {
    // Fallback: use first user message
    const firstUserMsg = conversationHistory.find(m => m.role === "user");
    if (firstUserMsg) {
      return firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? "..." : "");
    }
    return "聊天会话";
  }

  try {
    // Build conversation text
    let conversationText = "";
    for (const msg of conversationHistory.slice(-20)) { // Last 20 messages
      const role = msg.role === "user" ? "用户" : "AI";
      conversationText += `${role}: ${msg.content}\n`;
    }

    const prompt = existingSummary
      ? `你是一个主题生成助手，负责根据最近的对话生成一个当前对话的主题。\n\n最近的对话记录：\n"${existingSummary}"\n\n${conversationText}\n\n请提供一个更新后的主题，包含新消息。主题应该简洁（1-2句话，最多100个字符），捕捉对话的主要内容。只返回主题文本，不要包含其他内容。`
      : `你是一个主题生成助手。请根据以下对话生成一个简洁的主题（1-2句话，最多100个字符）：\n\n${conversationText}\n\n只返回主题文本。`;

    const client = createOpenAIClient(config);
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: "你是一个创建简洁对话主题的助手。保持主题在100个字符以内。" },
        { role: "user", content: prompt },
      ],
      max_tokens: 50,
      temperature: 0.5,
    });

    let summary = response.choices[0].message.content || "聊天会话";
    
    // Ensure summary is not too long
    if (summary.length > 100) {
      summary = summary.substring(0, 97) + "...";
    }

    return summary;
  } catch (error) {
    console.error("Failed to generate summary:", error);
    // Fallback
    const firstUserMsg = conversationHistory.find(m => m.role === "user");
    if (firstUserMsg) {
      return firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? "..." : "");
    }
    return "聊天会话";
  }
}

/**
 * Decide if personality should be updated based on conversation patterns
 */
export async function decidePersonalityUpdate(
  conversationHistory: Message[],
  currentPersonality: PersonalityConfig,
  messageCount: number,
  sessionSummary: string,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<PersonalityUpdateDecision> {
  const MIN_MESSAGES_FOR_UPDATE = 20;

  if (messageCount < MIN_MESSAGES_FOR_UPDATE) {
    return {
      shouldUpdate: false,
      reason: `消息数量不足 (需要至少 ${MIN_MESSAGES_FOR_UPDATE} 条，当前 ${messageCount} 条)`,
      confidence: 0.0,
    };
  }

  // Load API config
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  
  if (!config) {
    // Simple heuristic fallback
    if (messageCount % 50 === 0) {
      return {
        shouldUpdate: true,
        reason: "达到50条消息，建议考虑更新个性",
        suggestedPersonality: currentPersonality.systemPrompt,
        confidence: 0.5,
      };
    }
    return {
      shouldUpdate: false,
      reason: "未配置 API，无法进行高级分析",
      confidence: 0.0,
    };
  }

  try {
    // Build conversation text
    let conversationText = "";
    for (const msg of conversationHistory.slice(-30)) {
      const role = msg.role === "user" ? "用户" : "AI";
      conversationText += `${role}: ${msg.content}\n`;
    }

    const prompt = `你正在分析一段对话，以确定 AI 助手的个性是否应该更新。

当前个性提示词: "${currentPersonality.systemPrompt}"
消息数量: ${messageCount}
会话摘要: ${sessionSummary}

最近的对话:
${conversationText}

基于这段对话，分析：
1. 当前个性是否适合用户的需求？
2. 用户更喜欢什么沟通风格？（正式/随意，详细/简洁等）
3. 对话中是否有任何模式表明不同的个性会更好？
4. 更新个性是否会改善用户体验？

考虑：
- 用户的语言风格和正式程度
- 正在讨论的话题
- 用户偏好的详细程度
- 用户是否对当前回复满意
- 对话话题的一致性

仅以 JSON 对象的格式回复：
{"should_update": true/false, "reason": "说明", "suggested_personality": "新个性提示词或 null", "confidence": 0.0-1.0}

suggested_personality 应该是一个清晰、简洁的提示词，描述 AI 应该如何行为。`;

    const client = createOpenAIClient(config);
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: "你是分析对话并确定最佳 AI 个性配置的专家。始终用有效的 JSON 回复。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const resultText = response.choices[0].message.content || "{}";

    try {
      const result = JSON.parse(resultText);
      
      return {
        shouldUpdate: result.should_update || false,
        reason: result.reason || "未知原因",
        suggestedPersonality: result.suggested_personality || undefined,
        confidence: result.confidence || 0.0,
      };
    } catch (parseError) {
      return {
        shouldUpdate: false,
        reason: "无法解析 AI 响应",
        confidence: 0.0,
      };
    }
  } catch (error) {
    console.error("Failed to analyze personality:", error);
    return {
      shouldUpdate: false,
      reason: `分析错误: ${error instanceof Error ? error.message : "未知错误"}`,
      confidence: 0.0,
    };
  }
}

/**
 * Make proactive decision based on conversation state
 */
export async function makeProactiveDecision(
  conversationHistory: Message[],
  sessionSummary: string,
  messageCount: number,
  minutesInactive: number,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<ProactiveDecision> {
  const INACTIVITY_THRESHOLD = 5;

  if (minutesInactive < INACTIVITY_THRESHOLD) {
    return {
      action: "wait",
      reason: `活动时间不足 ${INACTIVITY_THRESHOLD} 分钟`,
    };
  }

  // Load API config
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  
  if (!config) {
    // Simple fallback
    if (messageCount < 5) {
      return {
        action: "wait",
        reason: "对话太短，无法做出决策",
      };
    }
    return {
      action: "continue",
      reason: "对话历史充足",
      suggestedMessage: "还有什么想聊的吗？我一直都在哦 😊",
    };
  }

  try {
    // Build conversation text
    let conversationText = "";
    for (const msg of conversationHistory.slice(-15)) {
      const role = msg.role === "user" ? "用户" : "AI";
      conversationText += `${role}: ${msg.content}\n`;
    }

    const prompt = `你正在分析一段对话，以决定 AI 是否应该主动继续对话。

当前摘要: ${sessionSummary}
消息数量: ${messageCount}
不活跃分钟数: ${minutesInactive.toFixed(1)}

最近的对话:
${conversationText}

基于这些信息，决定 AI 应该：
1. 'continue' - 主动继续当前话题，给出相关的后续
2. 'new_topic' - 建议开始一个新的相关话题
3. 'wait' - 等待用户回复

考虑：
- 对话是否处于自然停顿点？
- 是否有未回答的问题或未完成的想法？
- 后续消息是否会增加价值还是显得打扰？

仅以 JSON 对象的格式回复：
{"action": "continue|new_topic|wait", "reason": "简短说明", "suggested_message": "要发送的消息或 null"}`;

    const client = createOpenAIClient(config);
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: "你是决定 AI 对话策略的专家。始终用有效的 JSON 回复。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const resultText = response.choices[0].message.content || "{}";

    try {
      const result = JSON.parse(resultText);
      
      return {
        action: result.action || "wait",
        reason: result.reason || "未知原因",
        suggestedMessage: result.suggested_message || undefined,
      };
    } catch (parseError) {
      return {
        action: "wait",
        reason: "无法解析 AI 响应",
      };
    }
  } catch (error) {
    console.error("Failed to make proactive decision:", error);
    return {
      action: "wait",
      reason: `决策错误: ${error instanceof Error ? error.message : "未知错误"}`,
    };
  }
}

/**
 * Get default personality
 */
export function getDefaultPersonality(): PersonalityConfig {
  return DEFAULT_PERSONALITY;
}

/**
 * Create a custom personality
 */
export function createPersonality(
  name: string,
  traits: string[],
  systemPrompt: string
): PersonalityConfig {
  return {
    name,
    traits,
    systemPrompt,
  };
}
