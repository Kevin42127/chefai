import { ref } from 'vue';

const confirmState = ref({
  show: false,
  message: '',
  title: '確認',
  onConfirm: null,
  onCancel: null
});

export const useConfirm = () => {
  const showConfirm = (message, title = '確認') => {
    return new Promise((resolve) => {
      confirmState.value = {
        show: true,
        message,
        title,
        onConfirm: () => {
          confirmState.value.show = false;
          resolve(true);
        },
        onCancel: () => {
          confirmState.value.show = false;
          resolve(false);
        }
      };
    });
  };

  return {
    confirmState,
    showConfirm
  };
};

