/**
 * AI functionality module for LLM-based personality simulation and chatting
 * Uses openai-node for LLM integration with advanced features
 */

import OpenAI from 'openai';

export interface ApiConfig {
  apiKey: string;
  apiEndpoint?: string; // Base URL for OpenAI API (e.g., "https://api.openai.com/v1")
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
  // Note: Database-loaded config should be passed in via apiConfig parameter
  // localStorage is used as fallback for backward compatibility
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

  console.log("Using AI API config:", {
    apiEndpoint: effectiveConfig.apiEndpoint,
    model: effectiveConfig.model,
  });
  

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

/**
 * Generate diary entry from conversation history
 */
export async function generateDiaryEntry(
  conversationHistory: Message[],
  date: Date,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<{ title: string; content: string; mood: string; moodText: string }> {
  // Default fallback diary
  const defaultDiary = {
    title: "平静的一天",
    content: "今天和 AI 助手进行了愉快的交流。",
    mood: "😊",
    moodText: "平静",
  };

  if (conversationHistory.length === 0) {
    return defaultDiary;
  }

  // Load API config
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  
  if (!config) {
    // Fallback: generate simple diary from messages
    const userMessages = conversationHistory.filter(m => m.role === "user");
    if (userMessages.length > 0) {
      const firstMsg = userMessages[0].content;
      return {
        title: firstMsg.substring(0, 20) + (firstMsg.length > 20 ? "..." : ""),
        content: firstMsg.substring(0, 100) + (firstMsg.length > 100 ? "..." : ""),
        mood: "😊",
        moodText: "平静",
      };
    }
    return defaultDiary;
  }

  try {
    // Build conversation text
    let conversationText = "";
    for (const msg of conversationHistory.slice(-15)) { // Last 15 messages
      const role = msg.role === "user" ? "我" : "助手";
      conversationText += `${role}: ${msg.content}\n`;
    }

    const prompt = `基于以下对话，为用户生成一篇简短的日记条目。

日期: ${date.toLocaleDateString("zh-CN")}

对话内容:
${conversationText}

请生成：
1. 一个简短的标题（5-10个字）
2. 一段日记内容（50-120个字），以第一人称描述今天的对话和感受
3. 一个表情符号代表整体情绪
4. 一个简短的情绪词（如：快乐、平静、焦虑等）

以 JSON 格式回复：
{"title": "标题", "content": "日记内容", "mood": "😊", "moodText": "情绪词"}`;

    const client = createOpenAIClient(config);
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: "你是一个日记撰写助手，帮助用户记录日常对话和感受。总是用 JSON 格式回复。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const resultText = response.choices[0].message.content || "{}";
    const result = JSON.parse(resultText);

    return {
      title: result.title || defaultDiary.title,
      content: result.content || defaultDiary.content,
      mood: result.mood || defaultDiary.mood,
      moodText: result.moodText || defaultDiary.moodText,
    };
  } catch (error) {
    console.error("Failed to generate diary:", error);
    return defaultDiary;
  }
}

/**
 * Generate emotion insights from conversation history
 */
export async function generateEmotionInsights(
  conversationHistory: Message[],
  timeframe: string = "week",
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<string> {
  const defaultInsight = "最近的对话显示了积极的情绪趋势。继续保持！";

  if (conversationHistory.length === 0) {
    return defaultInsight;
  }

  // Load API config
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  
  if (!config) {
    return defaultInsight;
  }

  try {
    // Build conversation text with emotion detection
    let conversationText = "";
    const emotions: string[] = [];
    
    for (const msg of conversationHistory.slice(-20)) {
      if (msg.role === "user") {
        const emotion = detectEmotion(msg.content);
        emotions.push(emotion);
        conversationText += `用户: ${msg.content} [情绪: ${emotion}]\n`;
      }
    }

    const prompt = `分析用户${timeframe === "week" ? "本周" : "最近"}的对话情绪，生成洞察。

对话记录和情绪:
${conversationText}

请提供一段简短的情绪洞察（50-100个字），包括：
1. 整体情绪趋势
2. 情绪变化模式
3. 积极的建议或鼓励

只返回洞察文本，不要包含其他内容。`;

    const client = createOpenAIClient(config);
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: "你是一个情绪分析专家，帮助用户理解他们的情绪模式。" },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content || defaultInsight;
  } catch (error) {
    console.error("Failed to generate emotion insights:", error);
    return defaultInsight;
  }
}

/**
 * Analyze social relationships from group chat data
 */
export async function analyzeSocialRelationships(
  groupMessages: Array<{ sender: string; content: string }>,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<string> {
  const defaultAnalysis = "你在群聊中积极参与交流，与朋友们保持良好的互动。";

  if (groupMessages.length === 0) {
    return defaultAnalysis;
  }

  // Load API config
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  
  if (!config) {
    return defaultAnalysis;
  }

  try {
    // Build message text
    let messageText = "";
    for (const msg of groupMessages.slice(-30)) {
      messageText += `${msg.sender}: ${msg.content}\n`;
    }

    const prompt = `分析用户在群聊中的社交互动模式。

群聊消息:
${messageText}

请提供一段简短的社交习惯分析（50-100个字），包括：
1. 沟通风格特点
2. 互动频率和时间偏好
3. 一个建议性的提示

只返回分析文本，不要包含其他内容。`;

    const client = createOpenAIClient(config);
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: "你是一个社交行为分析专家，帮助用户了解他们的交流模式。" },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content || defaultAnalysis;
  } catch (error) {
    console.error("Failed to analyze social relationships:", error);
    return defaultAnalysis;
  }
}

/**
 * Generate group chat AI response with role-based personality
 */
export async function generateGroupChatResponse(
  userMessage: string,
  groupHistory: Array<{ sender: string; content: string }>,
  aiRole: "moderator" | "guide" | "entertainer",
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<string> {
  // Role-specific personalities
  const rolePersonalities = {
    moderator: `你是一个群聊调解员，名叫Soul。你的角色是：
- 帮助化解矛盾，维护群聊和谐
- 引导大家进行理性、建设性的讨论
- 在气氛紧张时提醒大家保持冷静
- 确保每个人的观点都被听到和尊重
用中文回复，语气专业但友好，保持中立立场。`,
    
    guide: `你是一个话题引导者，名叫Soul。你的角色是：
- 引导有趣的话题，激发讨论
- 提出深刻的问题让大家思考
- 分享相关的知识和观点
- 保持对话的活跃和有意义
用中文回复，语气热情且富有洞察力。`,
    
    entertainer: `你是一个气氛活跃者，名叫Soul。你的角色是：
- 活跃气氛，增添趣味
- 适时加入幽默和轻松的元素
- 让群聊更加有趣和愉快
- 用积极的态度影响大家
用中文回复，语气活泼有趣，适度使用表情符号。`,
  };

  // Default responses by role
  const defaultResponses = {
    moderator: "我理解大家的不同观点。让我们先冷静下来，听听各方的想法如何？",
    guide: "这个话题很有意思！不如我们深入讨论一下这个问题的几个方面？",
    entertainer: "哈哈，让我来活跃一下气氛！大家今天心情都不错啊~ 😄",
  };

  // Load API config
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  
  if (!config) {
    return defaultResponses[aiRole];
  }

  try {
    // Build group chat history
    let historyText = "";
    for (const msg of groupHistory.slice(-10)) {
      historyText += `${msg.sender}: ${msg.content}\n`;
    }

    const messages: Message[] = [
      { role: "system", content: rolePersonalities[aiRole] },
      { role: "user", content: `群聊历史:\n${historyText}\n\n最新消息: ${userMessage}\n\n请作为${aiRole === "moderator" ? "调解员" : aiRole === "guide" ? "话题引导者" : "气氛活跃者"}回应。` },
    ];

    const result = await callLLM(messages, apiConfig, adminConfig);
    
    if (typeof result === "string") {
      return result;
    }
    
    return defaultResponses[aiRole];
  } catch (error) {
    console.error("Failed to generate group chat response:", error);
    return defaultResponses[aiRole];
  }
}

/**
 * Generate AI response for a specific AI member with custom personality
 */
export async function generateAIMemberResponse(
  userMessage: string,
  groupHistory: Array<{ sender: string; content: string; senderType?: string }>,
  aiMember: {
    name: string;
    role: string;
    personality?: string;
  },
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<string> {
  // Role-specific default personalities (fallback if no custom personality)
  const rolePersonalities: Record<string, string> = {
    moderator: `你是一个群聊调解员，名叫${aiMember.name}。你的角色是：
- 帮助化解矛盾，维护群聊和谐
- 引导大家进行理性、建设性的讨论
- 在气氛紧张时提醒大家保持冷静
- 确保每个人的观点都被听到和尊重
用中文回复，语气专业但友好，保持中立立场。`,
    
    guide: `你是一个话题引导者，名叫${aiMember.name}。你的角色是：
- 引导有趣的话题，激发讨论
- 提出深刻的问题让大家思考
- 分享相关的知识和观点
- 保持对话的活跃和有意义
用中文回复，语气热情且富有洞察力。`,
    
    entertainer: `你是一个气氛活跃者，名叫${aiMember.name}。你的角色是：
- 活跃气氛，增添趣味
- 适时加入幽默和轻松的元素
- 让群聊更加有趣和愉快
- 用积极的态度影响大家
用中文回复，语气活泼有趣，适度使用表情符号。`,
  };

  // Use custom personality if provided, otherwise use role-based default
  const personality = aiMember.personality || rolePersonalities[aiMember.role] || rolePersonalities.guide;

  // Default responses by role
  const defaultResponses: Record<string, string> = {
    moderator: `大家好，我是${aiMember.name}。让我们保持理性讨论，互相尊重。`,
    guide: `嗨！我是${aiMember.name}，让我们聊些有趣的话题吧！`,
    entertainer: `哈喽～我是${aiMember.name}，来给大家带来欢乐啦！😄`,
  };

  // Load API config
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  
  if (!config) {
    return defaultResponses[aiMember.role] || `你好，我是${aiMember.name}！`;
  }

  try {
    // Build group chat history with sender types
    let historyText = "";
    for (const msg of groupHistory.slice(-10)) {
      const senderLabel = msg.senderType === "ai" ? `[AI] ${msg.sender}` : msg.sender;
      historyText += `${senderLabel}: ${msg.content}\n`;
    }

    const messages: Message[] = [
      { role: "system", content: personality },
      { role: "user", content: `群聊历史:\n${historyText}\n\n最新消息: ${userMessage}\n\n请以${aiMember.name}的身份回应。记住你的角色是${aiMember.role}。` },
    ];

    const result = await callLLM(messages, apiConfig, adminConfig);
    
    if (typeof result === "string") {
      return result;
    }
    
    return defaultResponses[aiMember.role] || `你好，我是${aiMember.name}！`;
  } catch (error) {
    console.error("Failed to generate AI member response:", error);
    return defaultResponses[aiMember.role] || `你好，我是${aiMember.name}！`;
  }
}

/**
 * Generate group topic suggestions
 */
export async function generateGroupTopicSuggestions(
  groupName: string,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<string[]> {
  const defaultTopics = [
    "今天有什么有趣的事情想分享吗？",
    "最近大家在忙什么呢？",
    "周末有什么计划吗？",
  ];

  // Load API config
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  
  if (!config) {
    return defaultTopics;
  }

  try {
    const prompt = `为名为"${groupName}"的群聊生成3个有趣的话题建议。

要求：
1. 话题应该轻松、有趣、易于讨论
2. 适合中文群聊环境
3. 每个话题以问句形式呈现
4. 话题应该能激发互动

以 JSON 数组格式回复：["话题1", "话题2", "话题3"]`;

    const client = createOpenAIClient(config);
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: "你是一个群聊话题建议专家，善于提出能激发讨论的话题。总是用 JSON 数组格式回复。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    const resultText = response.choices[0].message.content || "[]";
    const topics = JSON.parse(resultText);
    
    if (Array.isArray(topics) && topics.length > 0) {
      return topics;
    }
    
    return defaultTopics;
  } catch (error) {
    console.error("Failed to generate topic suggestions:", error);
    return defaultTopics;
  }
}

/**
 * Generate personality prompt suggestions based on user's conversation patterns
 */
export async function generatePersonalitySuggestions(
  conversationHistory: Message[],
  currentPersonality: PersonalityConfig,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<{ suggestions: string[]; explanation: string }> {
  const defaultSuggestions = {
    suggestions: [
      "增加更多同理心和情感支持",
      "提供更具体和实用的建议",
      "使用更轻松活泼的语气",
    ],
    explanation: "基于您的对话模式，这些调整可能会改善交流体验。",
  };

  if (conversationHistory.length < 5) {
    return defaultSuggestions;
  }

  // Load API config
  const config = apiConfig || JSON.parse(localStorage.getItem("userApiConfig") || "null");
  
  if (!config) {
    return defaultSuggestions;
  }

  try {
    // Build conversation text
    let conversationText = "";
    for (const msg of conversationHistory.slice(-20)) {
      const role = msg.role === "user" ? "用户" : "AI";
      conversationText += `${role}: ${msg.content}\n`;
    }

    const prompt = `分析用户的对话历史，为 AI 个性提供改进建议。

当前个性提示词:
"${currentPersonality.systemPrompt}"

对话历史:
${conversationText}

请分析：
1. 用户的交流偏好和风格
2. 当前个性的优点和可以改进的地方
3. 3个具体的个性调整建议

以 JSON 格式回复：
{
  "suggestions": ["建议1", "建议2", "建议3"],
  "explanation": "简短说明为什么这些建议有帮助"
}`;

    const client = createOpenAIClient(config);
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: "你是一个 AI 个性优化专家，帮助改进 AI 助手的行为和回应方式。总是用 JSON 格式回复。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const resultText = response.choices[0].message.content || "{}";
    const result = JSON.parse(resultText);
    
    return {
      suggestions: result.suggestions || defaultSuggestions.suggestions,
      explanation: result.explanation || defaultSuggestions.explanation,
    };
  } catch (error) {
    console.error("Failed to generate personality suggestions:", error);
    return defaultSuggestions;
  }
}
