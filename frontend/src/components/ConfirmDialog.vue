<template>
  <transition name="dialog">
    <div v-if="confirmState.show" class="dialog-overlay" @click="handleCancel">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <h3>{{ confirmState.title }}</h3>
        </div>
        <div class="dialog-body">
          <p>{{ confirmState.message }}</p>
        </div>
        <div class="dialog-footer">
          <button @click="handleCancel" class="dialog-button dialog-button-cancel">
            取消
          </button>
          <button @click="handleConfirm" class="dialog-button dialog-button-confirm">
            確定
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { computed } from 'vue';
import { useConfirm } from '../composables/useConfirm.js';

export default {
  name: 'ConfirmDialog',
  setup() {
    const { confirmState } = useConfirm();

    const dialogState = computed(() => confirmState.value);

    const handleConfirm = () => {
      if (dialogState.value.onConfirm) {
        dialogState.value.onConfirm();
      }
    };

    const handleCancel = () => {
      if (dialogState.value.onCancel) {
        dialogState.value.onCancel();
      }
    };

    return {
      confirmState: dialogState,
      handleConfirm,
      handleCancel
    };
  }
};
</script>

