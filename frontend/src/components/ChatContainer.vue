<template>
  <div class="chat-container">
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome-message">
        <p>歡迎使用 ChefAI！</p>
        <p>請告訴我您想要什麼樣的食物，我會為您生成詳細的食譜。</p>
        <div class="quick-suggestions">
          <button
            v-for="(suggestion, index) in quickSuggestions"
            :key="index"
            @click="useSuggestion(suggestion)"
            :class="['suggestion-button', `suggestion-button-${index}`]"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
      <MessageItem
        v-for="(message, index) in messages"
        :key="index"
        :message="message"
        :index="index"
        :is-streaming="isLoading && index === messages.length - 1 && message.type === 'assistant'"
      />
      <div v-if="isLoading" class="loading-message">
        <div class="loading-content">
          <span class="material-symbols-outlined loading-icon">sync</span>
          <div class="loading-text">
            <p class="loading-title">正在生成食譜...</p>
            <p class="loading-subtitle">AI 正在思考並準備詳細的食譜內容</p>
            <div class="loading-steps">
              <div class="loading-step" :class="{ active: loadingStep >= 1 }">
                <span class="step-icon">{{ loadingStep >= 1 ? '✓' : '○' }}</span>
                <span>分析您的需求</span>
              </div>
              <div class="loading-step" :class="{ active: loadingStep >= 2 }">
                <span class="step-icon">{{ loadingStep >= 2 ? '✓' : '○' }}</span>
                <span>生成食譜內容</span>
              </div>
              <div class="loading-step" :class="{ active: loadingStep >= 3 }">
                <span class="step-icon">{{ loadingStep >= 3 ? '✓' : '○' }}</span>
                <span>優化格式與細節</span>
              </div>
            </div>
          </div>
        </div>
        <div class="disclaimer-notice">
          <span class="material-symbols-outlined">info</span>
          <span>AI 生成的食譜可能會與實際的結果有所不同，請根據實際情況調整</span>
        </div>
      </div>
    </div>
    <div class="chat-input-container">
      <div class="input-wrapper">
        <textarea
          ref="inputRef"
          v-model="inputMessage"
          placeholder="輸入您想要的食物或料理類型（例如：我想做 4 人份的義大利麵）..."
          @keydown="handleKeyDown"
          :disabled="isLoading"
          class="chat-input"
          rows="1"
        ></textarea>
        <div class="input-actions">
          <button
            @click="sendMessage"
            :disabled="isLoading || !inputMessage.trim()"
            class="send-button"
            title="發送 (Enter 或 Ctrl+Enter)"
          >
            <span class="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, onMounted, watch } from 'vue';
import { generateRecipeStream } from '../services/apiService.js';
import MessageItem from './MessageItem.vue';

export default {
  name: 'ChatContainer',
  components: {
    MessageItem
  },
  emits: ['messages-updated'],
  setup(props, { emit }) {
    const STORAGE_KEY = 'chefai_messages';
    const messages = ref([]);
    const inputMessage = ref('');
    const isLoading = ref(false);
    const loadingStep = ref(0);
    const messagesContainer = ref(null);
    const inputRef = ref(null);
    let currentStreamController = null;

    const quickSuggestions = [
      '我想做義大利麵',
      '推薦一道簡單的菜',
      '做一道中式料理',
      '我想吃甜點'
    ];

    const loadMessages = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          messages.value = parsed.map(msg => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          }));
          emit('messages-updated', messages.value.length);
        }
      } catch (error) {
        console.error('載入對話歷史失敗:', error);
      }
    };

    const saveMessages = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value));
      } catch (error) {
        console.error('保存對話歷史失敗:', error);
      }
    };

    const scrollToBottom = (smooth = true) => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTo({
            top: messagesContainer.value.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
          });
        }
      });
    };

    const sendMessage = async () => {
      const message = inputMessage.value.trim();
      if (!message || isLoading.value) return;

      // 如果已有正在進行的流，先取消
      if (currentStreamController) {
        currentStreamController.abort();
      }

      messages.value.push({
        type: 'user',
        content: message,
        timestamp: new Date()
      });

      inputMessage.value = '';
      adjustTextareaHeight();
      isLoading.value = true;
      loadingStep.value = 1;
      scrollToBottom();

      // 創建新的 assistant 訊息，用於流式更新
      const assistantMessageIndex = messages.value.length;
      messages.value.push({
        type: 'assistant',
        content: '',
        timestamp: new Date()
      });

      // 創建 AbortController 用於取消請求
      currentStreamController = new AbortController();

      // 更新載入步驟
      const step2Timer = setTimeout(() => { loadingStep.value = 2; }, 500);
      const step3Timer = setTimeout(() => { loadingStep.value = 3; }, 1000);

      try {
        let fullContent = '';
        
        await generateRecipeStream(
          message,
          (chunk) => {
            // 接收流式數據塊
            fullContent += chunk;
            messages.value[assistantMessageIndex].content = fullContent;
            scrollToBottom();
          },
          (error) => {
            // 錯誤處理
            clearTimeout(step2Timer);
            clearTimeout(step3Timer);
            messages.value[assistantMessageIndex].content = `錯誤：${error.message || '無法生成食譜，請稍後再試。'}`;
            isLoading.value = false;
            loadingStep.value = 0;
            scrollToBottom();
            emit('messages-updated', messages.value.length);
            currentStreamController = null;
          },
          () => {
            // 完成處理
            clearTimeout(step2Timer);
            clearTimeout(step3Timer);
            isLoading.value = false;
            loadingStep.value = 0;
            scrollToBottom();
            focusInput();
            emit('messages-updated', messages.value.length);
            currentStreamController = null;
          },
          currentStreamController
        );
      } catch (error) {
        messages.value[assistantMessageIndex].content = `錯誤：${error.message || '無法生成食譜，請稍後再試。'}`;
        isLoading.value = false;
        loadingStep.value = 0;
        scrollToBottom();
        emit('messages-updated', messages.value.length);
        currentStreamController = null;
      }
    };

    const clearMessages = () => {
      messages.value = [];
      localStorage.removeItem(STORAGE_KEY);
      focusInput();
      emit('messages-updated', 0);
    };

    const useSuggestion = async (suggestion) => {
      if (isLoading.value) return;
      
      // 如果已有正在進行的流，先取消
      if (currentStreamController) {
        currentStreamController.abort();
      }

      messages.value.push({
        type: 'user',
        content: suggestion,
        timestamp: new Date()
      });

      isLoading.value = true;
      loadingStep.value = 1;
      scrollToBottom();

      // 創建新的 assistant 訊息
      const assistantMessageIndex = messages.value.length;
      messages.value.push({
        type: 'assistant',
        content: '',
        timestamp: new Date()
      });

      currentStreamController = new AbortController();

      const step2Timer = setTimeout(() => { loadingStep.value = 2; }, 500);
      const step3Timer = setTimeout(() => { loadingStep.value = 3; }, 1000);

      try {
        let fullContent = '';
        
        await generateRecipeStream(
          suggestion,
          (chunk) => {
            fullContent += chunk;
            messages.value[assistantMessageIndex].content = fullContent;
            scrollToBottom();
          },
          (error) => {
            clearTimeout(step2Timer);
            clearTimeout(step3Timer);
            messages.value[assistantMessageIndex].content = `錯誤：${error.message || '無法生成食譜，請稍後再試。'}`;
            isLoading.value = false;
            loadingStep.value = 0;
            scrollToBottom();
            emit('messages-updated', messages.value.length);
            currentStreamController = null;
          },
          () => {
            clearTimeout(step2Timer);
            clearTimeout(step3Timer);
            isLoading.value = false;
            loadingStep.value = 0;
            scrollToBottom();
            emit('messages-updated', messages.value.length);
            currentStreamController = null;
          },
          currentStreamController
        );
      } catch (error) {
        clearTimeout(step2Timer);
        clearTimeout(step3Timer);
        if (error.name !== 'AbortError') {
          messages.value[assistantMessageIndex].content = `錯誤：${error.message || '無法生成食譜，請稍後再試。'}`;
        }
        isLoading.value = false;
        loadingStep.value = 0;
        scrollToBottom();
        emit('messages-updated', messages.value.length);
        currentStreamController = null;
      }
    };


    const handleKeyDown = (event) => {
      // Enter 鍵送出（不按 Shift）
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (!isLoading.value && inputMessage.value.trim()) {
          sendMessage();
        }
      }
      // Ctrl+Enter 或 Cmd+Enter 也送出
      else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (!isLoading.value && inputMessage.value.trim()) {
          sendMessage();
        }
      }
      // Shift+Enter 換行（不阻止默認行為，允許換行）
    };

    const newLine = () => {
      const textarea = inputRef.value;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        inputMessage.value = inputMessage.value.substring(0, start) + '\n' + inputMessage.value.substring(end);
        nextTick(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
          adjustTextareaHeight();
        });
      }
    };

    const adjustTextareaHeight = () => {
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.style.height = 'auto';
          inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px';
        }
      });
    };

    const focusInput = () => {
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus();
        }
      });
    };

    watch(inputMessage, () => {
      adjustTextareaHeight();
    });

    onMounted(() => {
      loadMessages();
      scrollToBottom(false);
      focusInput();
    });

    const searchMessages = (query) => {
      if (!query.trim()) {
        messages.value.forEach(msg => {
          msg.highlight = false;
        });
        return;
      }

      const lowerQuery = query.toLowerCase();
      messages.value.forEach(msg => {
        msg.highlight = msg.content.toLowerCase().includes(lowerQuery);
      });

      const firstMatch = messages.value.findIndex(msg => msg.highlight);
      if (firstMatch !== -1) {
        nextTick(() => {
          if (messagesContainer.value) {
            const messageElement = messagesContainer.value.children[firstMatch];
            if (messageElement) {
              messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        });
      }
    };

    watch(() => messages.value.length, (newLength) => {
      emit('messages-updated', newLength);
      saveMessages();
    });

    watch(() => messages.value, () => {
      saveMessages();
    }, { deep: true });

    return {
      messages,
      inputMessage,
      isLoading,
      loadingStep,
      messagesContainer,
      inputRef,
      quickSuggestions,
      sendMessage,
      clearMessages,
      useSuggestion,
      handleKeyDown,
      searchMessages
    };
  }
};
</script>

