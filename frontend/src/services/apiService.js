const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 流式回應生成
export const generateRecipeStream = async (message, onChunk, onError, onComplete, abortController) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recipe/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message }),
      signal: abortController?.signal
    });

    if (!response.ok) {
      // 嘗試讀取錯誤訊息
      let errorMessage = `請求失敗 (狀態碼: ${response.status})`;
      try {
        // 先嘗試讀取為文本
        const errorText = await response.text();
        if (errorText) {
          try {
            // 嘗試解析為 JSON
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // 如果不是 JSON，嘗試從 SSE 格式解析
            const lines = errorText.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.error) {
                    errorMessage = data.error;
                    break;
                  }
                } catch {}
              }
            }
            // 如果都沒有找到，使用原始文本
            if (errorMessage.includes('狀態碼') && errorText.trim()) {
              errorMessage = errorText.trim();
            }
          }
        }
      } catch (e) {
        console.error('讀取錯誤訊息失敗:', e);
        // 如果讀取失敗，至少提供狀態碼
        errorMessage = `請求失敗 (狀態碼: ${response.status})`;
      }
      throw new Error(errorMessage);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (onComplete) onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                if (onError) onError(new Error(data.error));
                return;
              }
              if (data.done) {
                if (onComplete) onComplete();
                return;
              }
              if (data.content && onChunk) {
                onChunk(data.content);
              }
            } catch (e) {
              console.error('解析 SSE 數據錯誤:', e);
            }
          }
        }
      }
    } catch (readError) {
      if (readError.name === 'AbortError') {
        reader.cancel();
        return;
      }
      throw readError;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    console.error('API 錯誤:', error);
    if (onError) {
      onError(error);
    } else {
      throw error;
    }
  }
};

// 保留原有的非流式方法以向後兼容
export const generateRecipe = async (message) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recipe/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '請求失敗');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API 錯誤:', error);
    throw error;
  }
};

