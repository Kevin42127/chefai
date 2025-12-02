<template>
  <div class="notification-container">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`]"
      >
        <span class="material-symbols-outlined notification-icon">
          {{ getIcon(notification.type) }}
        </span>
        <span class="notification-message">{{ notification.message }}</span>
        <button
          @click="removeNotification(notification.id)"
          class="notification-close"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useNotification } from '../composables/useNotification.js';

export default {
  name: 'Notification',
  setup() {
    const { notifications, removeNotification } = useNotification();

    const notificationList = computed(() => notifications.value);

    const getIcon = (type) => {
      const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info'
      };
      return icons[type] || 'info';
    };

    return {
      notifications: notificationList,
      removeNotification,
      getIcon
    };
  }
};
</script>

