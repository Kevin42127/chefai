<template>
  <transition name="dialog">
    <div v-if="show" class="dialog-overlay" @click="close">
      <div class="dialog-container welcome-dialog" @click.stop>
        <div class="dialog-header">
          <h3>歡迎使用 ChefAI！</h3>
          <button @click="close" class="dialog-close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="dialog-body">
          <div class="welcome-content">
            <p>🎉 歡迎來到 ChefAI 食譜生成器！</p>
            <p>您可以：</p>
            <ul>
              <li>輸入想要的食物或料理類型</li>
              <li>指定人數（例如：4 人份）</li>
              <li>獲得詳細的食譜和烹飪步驟</li>
            </ul>
            <p class="welcome-tip">💡 提示：在輸入中包含人數，AI 會自動調整食材份量</p>
          </div>
        </div>
        <div class="dialog-footer welcome-footer">
          <button @click="close" class="dialog-button dialog-button-confirm">
            我知道了
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'WelcomeDialog',
  setup() {
    const show = ref(false);
    const STORAGE_KEY = 'chefai_welcome_shown';

    const checkShouldShow = () => {
      const shown = localStorage.getItem(STORAGE_KEY);
      if (!shown) {
        show.value = true;
      }
    };

    const close = () => {
      show.value = false;
    };

    onMounted(() => {
      // 延遲顯示，讓頁面先載入
      setTimeout(() => {
        checkShouldShow();
      }, 500);
    });

    return {
      show,
      close
    };
  }
};
</script>

