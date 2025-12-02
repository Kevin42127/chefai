<template>
  <div class="app">
    <Header 
      :has-messages="hasMessages" 
      @search="handleSearch" 
      @clear="handleClear" 
    />
    <ChatContainer ref="chatContainerRef" @messages-updated="handleMessagesUpdated" />
    <Notification />
    <ConfirmDialog />
    <WelcomeDialog />
  </div>
</template>

<script>
import { ref } from 'vue';
import ChatContainer from './components/ChatContainer.vue';
import Header from './components/Header.vue';
import Notification from './components/Notification.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import WelcomeDialog from './components/WelcomeDialog.vue';

export default {
  name: 'App',
  components: {
    ChatContainer,
    Header,
    Notification,
    ConfirmDialog,
    WelcomeDialog
  },
  setup() {
    const chatContainerRef = ref(null);
    const hasMessages = ref(false);

    const handleSearch = (query) => {
      if (chatContainerRef.value && chatContainerRef.value.searchMessages) {
        chatContainerRef.value.searchMessages(query);
      }
    };

    const handleClear = () => {
      if (chatContainerRef.value && chatContainerRef.value.clearMessages) {
        chatContainerRef.value.clearMessages();
        hasMessages.value = false;
      }
    };

    const handleMessagesUpdated = (count) => {
      hasMessages.value = count > 0;
    };

    return {
      chatContainerRef,
      hasMessages,
      handleSearch,
      handleClear,
      handleMessagesUpdated
    };
  }
};
</script>

