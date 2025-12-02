<template>
  <div :class="['message-item', message.type]">
    <div class="message-avatar">
      <span v-if="message.type === 'user'" class="material-symbols-outlined">person</span>
      <span v-else class="material-symbols-outlined">smart_toy</span>
    </div>
    <div class="message-content" :class="{ 'highlighted': message.highlight }">
      <div class="message-text" v-html="formattedContent"></div>
      <div v-if="isStreaming" class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
      <div v-if="message.timestamp" class="message-timestamp">
        {{ formatTime(message.timestamp) }}
      </div>
      <div v-if="message.type === 'assistant' && message.content" class="disclaimer-notice-message">
        <span class="material-symbols-outlined">info</span>
        <span>AI 生成的食譜可能會與實際的結果有所不同，請根據實際情況調整</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'MessageItem',
  props: {
    message: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      default: 0
    },
    isStreaming: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      
      if (minutes < 1) return '剛剛';
      if (minutes < 60) return `${minutes}分鐘前`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}小時前`;
      
      return date.toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formattedContent = computed(() => {
      if (props.message.type === 'user') {
        return escapeHtml(props.message.content);
      }
      
      const content = props.message.content;
      if (!content) return '';
      
      const lines = content.split('\n');
      let formatted = '';
      let skipNext = false;
      
      lines.forEach((line, index) => {
        if (skipNext) {
          skipNext = false;
          return;
        }
        
        const trimmed = line.trim();
        if (!trimmed) {
          formatted += '<br>';
          return;
        }
        
        if (trimmed.match(/^【.*】/)) {
          const sectionName = trimmed.replace(/^【|】$/g, '');
          if (sectionName === '食物名稱') {
            // 檢查同一行是否有標題內容（【食物名稱】標題）
            let titleAfterMark = trimmed.replace(/^【食物名稱】/, '').trim();
            if (titleAfterMark) {
              // 移除所有開頭的圓點符號和空格
              titleAfterMark = titleAfterMark.replace(/^[•·\-*\s]+/g, '');
              if (titleAfterMark) {
                formatted += `<h3 class="recipe-title">${escapeHtml(titleAfterMark)}</h3>`;
              } else {
                formatted += `<h4 class="recipe-section">${escapeHtml(trimmed)}</h4>`;
              }
            } else {
              // 檢查下一行
              const nextLine = index + 1 < lines.length ? lines[index + 1].trim() : '';
              if (nextLine && !nextLine.match(/^【/)) {
                // 移除所有開頭的圓點符號和空格
                let title = nextLine.replace(/^[•·\-*\s]+/g, '');
                if (title) {
                  formatted += `<h3 class="recipe-title">${escapeHtml(title)}</h3>`;
                  skipNext = true;
                } else {
                  formatted += `<h4 class="recipe-section">${escapeHtml(trimmed)}</h4>`;
                }
              } else {
                formatted += `<h4 class="recipe-section">${escapeHtml(trimmed)}</h4>`;
              }
            }
          } else if (sectionName === '適合人數') {
            // 檢查同一行是否有人數（【適合人數】2 人份）
            let portionAfterMark = trimmed.replace(/^【適合人數】/, '').trim();
            if (portionAfterMark) {
              portionAfterMark = portionAfterMark.replace(/^[•·\-*\s]+/g, '');
              if (portionAfterMark) {
                formatted += `<p class="recipe-portion">${escapeHtml(portionAfterMark)}</p>`;
              } else {
                formatted += `<h4 class="recipe-section">${escapeHtml(trimmed)}</h4>`;
              }
            } else {
              // 檢查下一行是否有人數
              const nextLine = index + 1 < lines.length ? lines[index + 1].trim() : '';
              if (nextLine && !nextLine.match(/^【/)) {
                const portion = nextLine.replace(/^[•·\-*\s]+/g, '');
                if (portion) {
                  formatted += `<p class="recipe-portion">${escapeHtml(portion)}</p>`;
                  skipNext = true;
                } else {
                  formatted += `<h4 class="recipe-section">${escapeHtml(trimmed)}</h4>`;
                }
              } else {
                formatted += `<h4 class="recipe-section">${escapeHtml(trimmed)}</h4>`;
              }
            }
          } else {
            formatted += `<h4 class="recipe-section">${escapeHtml(trimmed)}</h4>`;
          }
        }
        else if (trimmed.startsWith('食物名稱：') || trimmed.startsWith('##') || trimmed.match(/^#{1,3}\s/)) {
          let title = trimmed.replace(/^食物名稱：|^#{1,3}\s/, '');
          title = title.replace(/^[•·\-*\s]+/g, '');
          formatted += `<h3 class="recipe-title">${escapeHtml(title)}</h3>`;
        }
        else if (trimmed.match(/^\d+[\.、]\s*/)) {
          formatted += `<p class="recipe-step">${escapeHtml(trimmed)}</p>`;
        }
        else if (trimmed.startsWith('•') || trimmed.startsWith('·') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.replace(/^[*•·-]\s*/, '• ');
          formatted += `<p class="recipe-ingredient">${escapeHtml(content)}</p>`;
        }
        else if (trimmed.match(/^[食材步驟烹飪].*[：:]/)) {
          formatted += `<h4 class="recipe-section">${escapeHtml(trimmed)}</h4>`;
        }
        else if (trimmed.match(/適合人數|人份/)) {
          // 處理「適合人數：2 人份」或「2 人份」等格式
          const portionMatch = trimmed.match(/(\d+)\s*人份/);
          if (portionMatch) {
            formatted += `<p class="recipe-portion">${escapeHtml(portionMatch[0])}</p>`;
          } else {
            formatted += `<p>${escapeHtml(trimmed)}</p>`;
          }
        }
        else {
          formatted += `<p>${escapeHtml(trimmed)}</p>`;
        }
      });
      
      return formatted;
    });

    return {
      formattedContent,
      formatTime
    };
  }
};
</script>
