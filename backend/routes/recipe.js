import express from 'express';
import Groq from 'groq-sdk';

const router = express.Router();

// 從用戶輸入中提取人數
const extractPortionFromMessage = (message) => {
  if (!message || typeof message !== 'string') return null;
  
  // 匹配各種人數表達方式
  const patterns = [
    /(\d+)\s*人份/,
    /(\d+)\s*個人/,
    /(\d+)\s*人/,
    /做給\s*(\d+)\s*個人/,
    /做給\s*(\d+)\s*人/,
    /(\d+)\s*份/,
    /(\d+)\s*人吃/,
    /(\d+)\s*個人吃/
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const portion = parseInt(match[1], 10);
      if (portion > 0 && portion <= 20) {
        return portion;
      }
    }
  }
  
  return null;
};

// 流式回應處理函數
const processEnglishReplacements = (text) => {
  const englishReplacements = [
    { pattern: /\b(\d+)\s*g\b/gi, replacement: '$1公克' },
    { pattern: /\b(\d+)\s*gram(s)?\b/gi, replacement: '$1公克' },
    { pattern: /\b(\d+)\s*kg\b/gi, replacement: '$1公斤' },
    { pattern: /\b(\d+)\s*ml\b/gi, replacement: '$1毫升' },
    { pattern: /\b(\d+)\s*mL\b/gi, replacement: '$1毫升' },
    { pattern: /\b(\d+)\s*L\b/gi, replacement: '$1公升' },
    { pattern: /\b(\d+)\s*tbsp\b/gi, replacement: '$1大匙' },
    { pattern: /\b(\d+)\s*tsp\b/gi, replacement: '$1小匙' },
    { pattern: /\b(\d+)\s*cup(s)?\b/gi, replacement: '$1杯' },
    { pattern: /\b(\d+)\s*piece(s)?\b/gi, replacement: '$1個' },
    { pattern: /\b(\d+)\s*pc(s)?\b/gi, replacement: '$1個' },
    { pattern: /\b(\d+)\s*oz\b/gi, replacement: '$1盎司' },
    { pattern: /\b(\d+)\s*lb\b/gi, replacement: '$1磅' },
    { pattern: /\b(\d+)\s*tb\b/gi, replacement: '$1大匙' },
    { pattern: /\b(\d+)\s*ts\b/gi, replacement: '$1小匙' },
    { pattern: /\bg\s+/gi, replacement: '公克 ' },
    { pattern: /\s+g\b/gi, replacement: ' 公克' },
    { pattern: /\bgram(s)?\b/gi, replacement: '公克' },
    { pattern: /\bkg\b/gi, replacement: '公斤' },
    { pattern: /\bml\b/gi, replacement: '毫升' },
    { pattern: /\bmL\b/gi, replacement: '毫升' },
    { pattern: /\bL\b/gi, replacement: '公升' },
    { pattern: /\btbsp\b/gi, replacement: '大匙' },
    { pattern: /\btsp\b/gi, replacement: '小匙' },
    { pattern: /\bcup(s)?\b/gi, replacement: '杯' },
    { pattern: /\bpiece(s)?\b/gi, replacement: '個' },
    { pattern: /\bpc(s)?\b/gi, replacement: '個' },
    { pattern: /\boz\b/gi, replacement: '盎司' },
    { pattern: /\blb\b/gi, replacement: '磅' }
  ];

  let processed = text;
  for (const { pattern, replacement } of englishReplacements) {
    processed = processed.replace(pattern, replacement);
  }
  return processed;
};

// 流式回應端點
router.post('/generate-stream', async (req, res) => {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400);
      res.write(`data: ${JSON.stringify({ error: '請提供有效的訊息' })}\n\n`);
      res.end();
      return;
    }

    // 設置 SSE 標頭
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const formatTemplate = `【推薦選項】
• 第一個推薦選項
• 第二個推薦選項
• 第三個推薦選項

【食物名稱】
第一個推薦選項的料理名稱

【料理介紹】
用 2-3 句話親切地介紹這道料理的特色、風味或適合的場合。

【食材清單】
• 食材名稱（例如：雞胸肉）
• 食材名稱（例如：橄欖油）
• 食材名稱

【製作步驟】
1. 第一個步驟的詳細說明
2. 第二個步驟的詳細說明
3. 第三個步驟的詳細說明

【烹飪小貼士】
• 實用的烹飪技巧或替代方案
• 保存建議或注意事項`;

    const taiwanTerminology = `【台灣用語強制規則 - 絕對禁止違反】
你必須使用台灣用語，絕對禁止使用中國大陸用語。這是強制性規則，違反此規則是不被允許的。

常見對照表（必須嚴格遵守）：
• 「番茄」而非「西紅柿」
• 「馬鈴薯」而非「土豆」
• 「洋蔥」而非「蔥頭」
• 「高麗菜」而非「包菜」或「捲心菜」
• 「花椰菜」而非「菜花」
• 「青椒」而非「甜椒」或「彩椒」
• 「地瓜」而非「紅薯」
• 「奇異果」而非「獼猴桃」
• 「柳丁」而非「橙子」
• 「紅蘿蔔」而非「胡蘿蔔」
• 「小黃瓜」而非「黃瓜」
• 「菜豆」而非「豆角」
• 「大白菜」而非「白菜」
• 「美生菜」而非「生菜」
• 「白飯」或「米飯」而非「飯」
• 「滷肉飯」而非「肉燥飯」
• 「炒飯」而非「蛋炒飯」
• 「三杯雞」等台灣特色料理名稱

所有食材名稱、料理名稱、烹飪術語都必須使用台灣用語。如果遇到不確定的用語，請優先選擇台灣常見用法。`;

    const prompt = `你是一位專業的廚師和食譜專家，專門為用戶生成詳細、實用的食譜。

用戶需求：${message}

【重要】你必須嚴格按照以下格式生成食譜，格式是強制性的，不能省略任何格式符號。你必須從【推薦選項】開始，絕對不能跳過【推薦選項】直接生成食譜：

${formatTemplate}

${taiwanTerminology}

【格式規則（必須嚴格遵守）】：
1. 【最重要】你必須首先生成【推薦選項】區塊，這是強制性的第一步，絕對不能省略或跳過。在【推薦選項】中隨機列出 3 個符合用戶需求的推薦選項，每個選項用圓點符號（•）標記。必須根據用戶需求隨機生成不同的選項，不要使用固定的預設選項
2. 然後為第一個推薦選項生成完整的詳細食譜（包含【食物名稱】、【料理介紹】、【食材清單】、【製作步驟】、【烹飪小貼士】）
3. 必須使用【】符號標記每個區塊標題，例如：【推薦選項】、【食物名稱】、【料理介紹】、【食材清單】、【製作步驟】、【烹飪小貼士】
4. 絕對禁止使用「首先」、「我們需要的食材有」、「製作步驟如下」等自然語言開頭
5. 【推薦選項】中只列出選項名稱，不需要詳細說明
6. 【食物名稱】後面直接寫料理名稱，不要加冒號
7. 【食材清單】中只列出食材名稱，不要包含份量、數量或單位（例如：只寫「雞胸肉」，不要寫「雞胸肉 300 公克」）
8. 食材和貼士必須使用圓點符號（•）作為列表符號，不要使用 * 或 - 
9. 步驟必須使用數字編號（1. 2. 3.），不要使用其他格式
10. 必須完全使用繁體中文，絕對禁止使用任何英文單詞、英文縮寫、英文術語或英文字母
11. 如果遇到外國料理名稱，請使用繁體中文翻譯或音譯
12. 使用自然、親切的語氣，但保持專業和實用性

請嚴格按照上述格式和台灣用語規則生成食譜，現在開始：`;

    const systemMessage = `你是一位專業的廚師和食譜專家，專門為用戶生成詳細、實用且完整的食譜。你必須嚴格按照指定的格式生成食譜，格式是強制性的，絕對不能使用自然語言格式。【最重要】你必須首先提供【推薦選項】區塊，這是強制性的第一步，絕對不能省略或跳過。在【推薦選項】中隨機列出 3 個符合用戶需求的推薦選項，必須根據用戶需求隨機生成不同的選項，不要使用固定的預設選項，然後為第一個推薦選項生成完整的詳細食譜。你必須使用【】符號標記每個區塊標題，包括：【推薦選項】、【食物名稱】、【料理介紹】、【食材清單】、【製作步驟】、【烹飪小貼士】。每個區塊標題必須用【】包圍，不能省略。絕對禁止使用「首先」、「我們需要的食材有」、「製作步驟如下」等自然語言開頭。【推薦選項】中只列出選項名稱，不需要詳細說明。【食材清單】中只列出食材名稱，不要包含份量、數量或單位（例如：只寫「雞胸肉」，不要寫「雞胸肉 300 公克」）。食材和貼士必須使用圓點符號（•），步驟必須使用數字編號（1. 2. 3.）。你必須完全使用繁體中文回應，絕對不能使用任何英文單詞、英文縮寫或英文術語。這是最重要的規則，違反此規則是不被允許的。所有內容包括食物名稱、食材名稱、步驟說明都必須使用繁體中文。

【台灣用語強制規則 - 絕對禁止違反】
你必須使用台灣用語，絕對禁止使用中國大陸用語。這是強制性規則，違反此規則是不被允許的。常見對照：使用「番茄」而非「西紅柿」、使用「馬鈴薯」而非「土豆」、使用「洋蔥」而非「蔥頭」、使用「高麗菜」而非「包菜」或「捲心菜」、使用「花椰菜」而非「菜花」、使用「青椒」而非「甜椒」或「彩椒」、使用「地瓜」而非「紅薯」、使用「奇異果」而非「獼猴桃」、使用「柳丁」而非「橙子」、使用「紅蘿蔔」而非「胡蘿蔔」、使用「小黃瓜」而非「黃瓜」、使用「菜豆」而非「豆角」、使用「大白菜」而非「白菜」、使用「美生菜」而非「生菜」、使用「白飯」或「米飯」而非「飯」、使用「滷肉飯」而非「肉燥飯」、使用「炒飯」而非「蛋炒飯」、使用「三杯雞」等台灣特色料理名稱。所有食材名稱、料理名稱、烹飪術語都必須使用台灣用語。如果遇到不確定的用語，請優先選擇台灣常見用法。

使用台灣常見的料理名稱和烹飪術語。請用專業但親切的語氣，確保食譜實用且易於理解。格式符號【】是必須的，不能省略。`;

    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 3000,
      stream: true
    });

    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          const processed = processEnglishReplacements(content);
          res.write(`data: ${JSON.stringify({ content: processed })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (streamError) {
      console.error('流式處理錯誤:', streamError);
      res.write(`data: ${JSON.stringify({ error: '生成食譜時發生錯誤', details: streamError.message })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Groq API 錯誤:', error);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }
    res.write(`data: ${JSON.stringify({ error: '生成食譜時發生錯誤', details: error.message })}\n\n`);
    res.end();
  }
});

// 保留原有的非流式端點以向後兼容
router.post('/generate', async (req, res) => {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '請提供有效的訊息' });
    }

    const formatTemplate = `【推薦選項】
• 第一個推薦選項
• 第二個推薦選項
• 第三個推薦選項

【食物名稱】
第一個推薦選項的料理名稱

【料理介紹】
用 2-3 句話親切地介紹這道料理的特色、風味或適合的場合。

【食材清單】
• 食材名稱（例如：雞胸肉）
• 食材名稱（例如：橄欖油）
• 食材名稱

【製作步驟】
1. 第一個步驟的詳細說明
2. 第二個步驟的詳細說明
3. 第三個步驟的詳細說明

【烹飪小貼士】
• 實用的烹飪技巧或替代方案
• 保存建議或注意事項`;

    const taiwanTerminology = `【台灣用語強制規則 - 絕對禁止違反】
你必須使用台灣用語，絕對禁止使用中國大陸用語。這是強制性規則，違反此規則是不被允許的。

常見對照表（必須嚴格遵守）：
• 「番茄」而非「西紅柿」
• 「馬鈴薯」而非「土豆」
• 「洋蔥」而非「蔥頭」
• 「高麗菜」而非「包菜」或「捲心菜」
• 「花椰菜」而非「菜花」
• 「青椒」而非「甜椒」或「彩椒」
• 「地瓜」而非「紅薯」
• 「奇異果」而非「獼猴桃」
• 「柳丁」而非「橙子」
• 「紅蘿蔔」而非「胡蘿蔔」
• 「小黃瓜」而非「黃瓜」
• 「菜豆」而非「豆角」
• 「大白菜」而非「白菜」
• 「美生菜」而非「生菜」
• 「白飯」或「米飯」而非「飯」
• 「滷肉飯」而非「肉燥飯」
• 「炒飯」而非「蛋炒飯」
• 「三杯雞」等台灣特色料理名稱

所有食材名稱、料理名稱、烹飪術語都必須使用台灣用語。如果遇到不確定的用語，請優先選擇台灣常見用法。`;

    const prompt = `你是一位專業的廚師和食譜專家，專門為用戶生成詳細、實用的食譜。

用戶需求：${message}

【重要】你必須嚴格按照以下格式生成食譜，格式是強制性的，不能省略任何格式符號。你必須從【推薦選項】開始，絕對不能跳過【推薦選項】直接生成食譜：

${formatTemplate}

${taiwanTerminology}

【格式規則（必須嚴格遵守）】：
1. 【最重要】你必須首先生成【推薦選項】區塊，這是強制性的第一步，絕對不能省略或跳過。在【推薦選項】中隨機列出 3 個符合用戶需求的推薦選項，每個選項用圓點符號（•）標記。必須根據用戶需求隨機生成不同的選項，不要使用固定的預設選項
2. 然後為第一個推薦選項生成完整的詳細食譜（包含【食物名稱】、【料理介紹】、【食材清單】、【製作步驟】、【烹飪小貼士】）
3. 必須使用【】符號標記每個區塊標題，例如：【推薦選項】、【食物名稱】、【料理介紹】、【食材清單】、【製作步驟】、【烹飪小貼士】
4. 絕對禁止使用「首先」、「我們需要的食材有」、「製作步驟如下」等自然語言開頭
5. 【推薦選項】中只列出選項名稱，不需要詳細說明
6. 【食物名稱】後面直接寫料理名稱，不要加冒號
7. 【食材清單】中只列出食材名稱，不要包含份量、數量或單位（例如：只寫「雞胸肉」，不要寫「雞胸肉 300 公克」）
8. 食材和貼士必須使用圓點符號（•）作為列表符號，不要使用 * 或 - 
9. 步驟必須使用數字編號（1. 2. 3.），不要使用其他格式
10. 必須完全使用繁體中文，絕對禁止使用任何英文單詞、英文縮寫、英文術語或英文字母
11. 如果遇到外國料理名稱，請使用繁體中文翻譯或音譯
12. 使用自然、親切的語氣，但保持專業和實用性

請嚴格按照上述格式和台灣用語規則生成食譜，現在開始：`;

    const systemMessage = `你是一位專業的廚師和食譜專家，專門為用戶生成詳細、實用且完整的食譜。你必須嚴格按照指定的格式生成食譜，格式是強制性的，絕對不能使用自然語言格式。【最重要】你必須首先提供【推薦選項】區塊，這是強制性的第一步，絕對不能省略或跳過。在【推薦選項】中隨機列出 3 個符合用戶需求的推薦選項，必須根據用戶需求隨機生成不同的選項，不要使用固定的預設選項，然後為第一個推薦選項生成完整的詳細食譜。你必須使用【】符號標記每個區塊標題，包括：【推薦選項】、【食物名稱】、【料理介紹】、【食材清單】、【製作步驟】、【烹飪小貼士】。每個區塊標題必須用【】包圍，不能省略。絕對禁止使用「首先」、「我們需要的食材有」、「製作步驟如下」等自然語言開頭。【推薦選項】中只列出選項名稱，不需要詳細說明。【食材清單】中只列出食材名稱，不要包含份量、數量或單位（例如：只寫「雞胸肉」，不要寫「雞胸肉 300 公克」）。食材和貼士必須使用圓點符號（•），步驟必須使用數字編號（1. 2. 3.）。你必須完全使用繁體中文回應，絕對不能使用任何英文單詞、英文縮寫或英文術語。這是最重要的規則，違反此規則是不被允許的。所有內容包括食物名稱、食材名稱、步驟說明都必須使用繁體中文。

【台灣用語強制規則 - 絕對禁止違反】
你必須使用台灣用語，絕對禁止使用中國大陸用語。這是強制性規則，違反此規則是不被允許的。常見對照：使用「番茄」而非「西紅柿」、使用「馬鈴薯」而非「土豆」、使用「洋蔥」而非「蔥頭」、使用「高麗菜」而非「包菜」或「捲心菜」、使用「花椰菜」而非「菜花」、使用「青椒」而非「甜椒」或「彩椒」、使用「地瓜」而非「紅薯」、使用「奇異果」而非「獼猴桃」、使用「柳丁」而非「橙子」、使用「紅蘿蔔」而非「胡蘿蔔」、使用「小黃瓜」而非「黃瓜」、使用「菜豆」而非「豆角」、使用「大白菜」而非「白菜」、使用「美生菜」而非「生菜」、使用「白飯」或「米飯」而非「飯」、使用「滷肉飯」而非「肉燥飯」、使用「炒飯」而非「蛋炒飯」、使用「三杯雞」等台灣特色料理名稱。所有食材名稱、料理名稱、烹飪術語都必須使用台灣用語。如果遇到不確定的用語，請優先選擇台灣常見用法。

使用台灣常見的料理名稱和烹飪術語。請用專業但親切的語氣，確保食譜實用且易於理解。格式符號【】是必須的，不能省略。`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 3000
    });

    let response = completion.choices[0]?.message?.content || '無法生成食譜，請稍後再試。';
    response = processEnglishReplacements(response);

    res.json({
      success: true,
      content: response
    });

  } catch (error) {
    console.error('Groq API 錯誤:', error);
    res.status(500).json({
      error: '生成食譜時發生錯誤',
      details: error.message
    });
  }
});

export default router;

