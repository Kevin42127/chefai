import { ref } from 'vue';

const notifications = ref([]);

export const useNotification = () => {
  const showNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = {
      id,
      message,
      type,
      duration
    };

    notifications.value.push(notification);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  };

  const showSuccess = (message, duration = 3000) => {
    return showNotification(message, 'success', duration);
  };

  const showError = (message, duration = 3000) => {
    return showNotification(message, 'error', duration);
  };

  const showInfo = (message, duration = 3000) => {
    return showNotification(message, 'info', duration);
  };

  return {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    removeNotification
  };
};

