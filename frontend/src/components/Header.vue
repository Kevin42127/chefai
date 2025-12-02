<template>
  <header class="header">
    <div class="header-content">
      <h1 class="header-title">ChefAI</h1>
      <div class="header-search-center">
        <div class="search-container">
          <div class="search-input-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋對話..."
              class="search-input"
              @input="handleSearch"
            />
            <span class="material-symbols-outlined search-icon">search</span>
          </div>
        </div>
      </div>
      <div class="header-actions-desktop">
        <div class="header-buttons">
          <button
            v-if="hasMessages"
            @click="handleClear"
            class="clear-button-header"
            title="清除對話"
          >
            <span class="material-symbols-outlined">delete</span>
          </button>
          <div class="theme-toggle-container">
            <span class="material-symbols-outlined theme-icon">light_mode</span>
            <label class="theme-switch">
              <input
                type="checkbox"
                v-model="isDarkMode"
                @change="toggleThemeMode"
                class="theme-switch-input"
              />
              <span class="theme-switch-slider"></span>
            </label>
            <span class="material-symbols-outlined theme-icon">dark_mode</span>
          </div>
        </div>
      </div>
      <div class="header-actions-mobile">
        <div class="mobile-search-container">
          <div class="mobile-search-input-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋對話..."
              class="mobile-search-input"
              @input="handleSearch"
            />
            <span class="material-symbols-outlined search-icon">search</span>
          </div>
        </div>
      </div>
      <button
        @click="toggleMobileMenu"
        class="mobile-menu-button"
        title="選單"
      >
        <span class="material-symbols-outlined">{{ mobileMenuOpen ? 'close' : 'menu' }}</span>
      </button>
    </div>
    <transition name="menu">
      <div v-if="mobileMenuOpen" class="mobile-menu-overlay" @click="toggleMobileMenu">
        <div class="mobile-menu" @click.stop>
          <div class="mobile-menu-header">
            <h3>選單</h3>
            <button @click="toggleMobileMenu" class="mobile-menu-close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="mobile-menu-content">
            <div class="mobile-menu-actions">
              <button
                v-if="hasMessages"
                @click="handleMobileClear"
                class="mobile-menu-button-item"
              >
                <span class="material-symbols-outlined">delete</span>
                <span>清除對話</span>
              </button>
              <div class="mobile-theme-toggle">
                <span class="mobile-theme-label">深色模式</span>
                <label class="theme-switch">
                  <input
                    type="checkbox"
                    v-model="isDarkMode"
                    @change="toggleThemeMode"
                    class="theme-switch-input"
                  />
                  <span class="theme-switch-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useConfirm } from '../composables/useConfirm.js';

export default {
  name: 'Header',
  props: {
    hasMessages: {
      type: Boolean,
      default: false
    }
  },
  emits: ['search', 'clear'],
  setup(props, { emit }) {
    const { showConfirm } = useConfirm();
    const searchQuery = ref('');
    const isDarkMode = ref(false);
    const mobileMenuOpen = ref(false);

    const loadThemePreference = () => {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        isDarkMode.value = saved === 'true';
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDarkMode.value = prefersDark;
      }
      applyTheme();
    };

    const applyTheme = () => {
      document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light');
    };

    const toggleThemeMode = () => {
      localStorage.setItem('darkMode', isDarkMode.value.toString());
      applyTheme();
    };

    const handleSearch = () => {
      emit('search', searchQuery.value);
    };

    const handleClear = async () => {
      const confirmed = await showConfirm('確定要清除所有對話嗎？', '清除對話');
      if (confirmed) {
        emit('clear');
        searchQuery.value = '';
      }
    };

    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value;
    };

    const handleMobileClear = async () => {
      mobileMenuOpen.value = false;
      await handleClear();
    };


    onMounted(() => {
      loadThemePreference();
    });

    return {
      searchQuery,
      isDarkMode,
      mobileMenuOpen,
      toggleThemeMode,
      handleSearch,
      handleClear,
      toggleMobileMenu,
      handleMobileClear
    };
  }
};
</script>

