import Groq from 'groq-sdk';

const extractPortionFromMessage = (message) => {
  if (!message || typeof message !== 'string') return null;
  
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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400);
      res.write(`data: ${JSON.stringify({ error: '請提供有效的訊息' })}\n\n`);
      res.end();
      return;
    }

    const userPortion = extractPortionFromMessage(message);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    const portionInstruction = userPortion 
      ? `用戶指定要做 ${userPortion} 人份，請根據 ${userPortion} 人份來計算所有食材的份量。你必須在食譜中包含【適合人數】區塊，顯示 ${userPortion} 人份。`
      : `請根據一般家庭常見的份量來計算食材。如果用戶沒有指定人數，請不要包含【適合人數】區塊。`;

    const formatTemplate = userPortion 
      ? `【食物名稱】
料理名稱

【料理介紹】
用 2-3 句話親切地介紹這道料理的特色、風味或適合的場合。

【適合人數】
${userPortion} 人份

【食材清單】
• 食材名稱 份量（例如：雞胸肉 300 公克）
• 食材名稱 份量（例如：橄欖油 2 大匙）
• 食材名稱 份量

【製作步驟】
1. 第一個步驟的詳細說明
2. 第二個步驟的詳細說明
3. 第三個步驟的詳細說明

【烹飪小貼士】
• 實用的烹飪技巧或替代方案
• 保存建議或注意事項`
      : `【食物名稱】
料理名稱

【料理介紹】
用 2-3 句話親切地介紹這道料理的特色、風味或適合的場合。

【食材清單】
• 食材名稱 份量（例如：雞胸肉 300 公克）
• 食材名稱 份量（例如：橄欖油 2 大匙）
• 食材名稱 份量

【製作步驟】
1. 第一個步驟的詳細說明
2. 第二個步驟的詳細說明
3. 第三個步驟的詳細說明

【烹飪小貼士】
• 實用的烹飪技巧或替代方案
• 保存建議或注意事項`;

    const prompt = `你是一位專業的廚師和食譜專家，專門為用戶生成詳細、實用的食譜。

用戶需求：${message}

${portionInstruction}

【重要】你必須嚴格按照以下格式生成食譜，格式是強制性的，不能省略任何格式符號：

${formatTemplate}

【格式規則（必須嚴格遵守）】：
1. 必須使用【】符號標記每個區塊標題，例如：【食物名稱】、【料理介紹】、【食材清單】、【製作步驟】、【烹飪小貼士】
2. ${userPortion ? '你必須包含【適合人數】區塊，顯示 ' + userPortion + ' 人份，放在【料理介紹】之後、【食材清單】之前。' : '如果用戶沒有指定人數，請不要包含【適合人數】區塊。'}
3. 絕對禁止使用「首先」、「我們需要的食材有」、「製作步驟如下」等自然語言開頭
4. 【食物名稱】後面直接寫料理名稱，不要加冒號
5. ${userPortion ? '【適合人數】後面直接寫 ' + userPortion + ' 人份，不要加冒號。' : ''}食材和貼士必須使用圓點符號（•）作為列表符號，不要使用 * 或 - 
6. 步驟必須使用數字編號（1. 2. 3.），不要使用其他格式
7. 所有單位必須使用繁體中文（公克、毫升、大匙、小匙、杯、個等）
8. 必須完全使用繁體中文，絕對禁止使用任何英文單詞、英文縮寫、英文術語或英文字母
9. 如果遇到外國料理名稱，請使用繁體中文翻譯或音譯
10. 使用自然、親切的語氣，但保持專業和實用性

請嚴格按照上述格式生成食譜，現在開始：`;

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `你是一位專業的廚師和食譜專家，專門為用戶生成詳細、實用且完整的食譜。你必須嚴格按照指定的格式生成食譜，格式是強制性的，絕對不能使用自然語言格式。你必須使用【】符號標記每個區塊標題，包括：【食物名稱】、【料理介紹】、【食材清單】、【製作步驟】、【烹飪小貼士】。${userPortion ? '你必須包含【適合人數】區塊，顯示 ' + userPortion + ' 人份，放在【料理介紹】之後、【食材清單】之前。' : '如果用戶沒有指定人數，請不要包含【適合人數】區塊。'}每個區塊標題必須用【】包圍，不能省略。絕對禁止使用「首先」、「我們需要的食材有」、「製作步驟如下」等自然語言開頭。食材和貼士必須使用圓點符號（•），步驟必須使用數字編號（1. 2. 3.）。你必須完全使用繁體中文回應，絕對不能使用任何英文單詞、英文縮寫或英文術語。這是最重要的規則，違反此規則是不被允許的。所有內容包括食物名稱、食材名稱、單位、步驟說明都必須使用繁體中文。常見單位對照：g/gram→公克，ml→毫升，tbsp→大匙，tsp→小匙，cup→杯，piece→個。請用專業但親切的語氣，確保食譜實用且易於理解。格式符號【】是必須的，不能省略。`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
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
}

