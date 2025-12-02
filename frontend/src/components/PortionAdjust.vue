<template>
  <transition name="dialog">
    <div v-if="visible" class="dialog-overlay" @click="close">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <h3>份量調整</h3>
          <button @click="close" class="dialog-close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="dialog-body">
          <div class="portion-controls">
            <label class="portion-label">
              <span>調整為：</span>
              <select v-model="selectedPortion" class="portion-select">
                <option value="0.5">0.5 人份</option>
                <option value="1">1 人份</option>
                <option value="2">2 人份</option>
                <option value="3">3 人份</option>
                <option value="4">4 人份</option>
                <option value="5">5 人份</option>
                <option value="6">6 人份</option>
                <option value="8">8 人份</option>
                <option value="10">10 人份</option>
              </select>
            </label>
            <div class="portion-preview">
              <p>將所有食材份量調整為 <strong>{{ selectedPortion }} 人份</strong></p>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="close" class="dialog-button dialog-button-cancel">取消</button>
          <button @click="applyAdjustment" class="dialog-button dialog-button-confirm">套用</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'PortionAdjust',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'apply'],
  setup(props, { emit }) {
    const selectedPortion = ref('2');

    const applyAdjustment = () => {
      emit('apply', parseFloat(selectedPortion.value));
      close();
    };

    const close = () => {
      emit('close');
    };

    return {
      selectedPortion,
      applyAdjustment,
      close
    };
  }
};
</script>

