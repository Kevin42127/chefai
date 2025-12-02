<template>
  <transition name="dialog">
    <div v-if="visible" class="dialog-overlay" @click="close">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <h3>購物清單</h3>
        </div>
        <div class="dialog-body">
          <div v-if="ingredients.length === 0" class="empty-list">
            <span class="material-symbols-outlined">shopping_cart</span>
            <p>沒有食材可顯示</p>
          </div>
          <div v-else class="shopping-list-content">
            <div class="list-actions">
              <button @click="toggleAll" class="action-button">
                <span class="material-symbols-outlined">{{ allChecked ? 'check_box' : 'check_box_outline_blank' }}</span>
                <span>{{ allChecked ? '取消全選' : '全選' }}</span>
              </button>
              <button @click="exportList" class="action-button">
                <span class="material-symbols-outlined">download</span>
                <span>匯出</span>
              </button>
            </div>
            <ul class="ingredient-list">
              <li v-for="(ingredient, index) in ingredients" :key="index" class="ingredient-item">
                <label class="ingredient-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="ingredient.checked"
                    class="checkbox-input"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="ingredient-text">{{ ingredient.text }}</span>
                </label>
              </li>
            </ul>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="close" class="dialog-button dialog-button-cancel">關閉</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  name: 'ShoppingList',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    ingredients: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const allChecked = computed(() => {
      return props.ingredients.length > 0 && props.ingredients.every(item => item.checked);
    });

    const toggleAll = () => {
      const checked = !allChecked.value;
      props.ingredients.forEach(item => {
        item.checked = checked;
      });
    };

    const exportList = () => {
      const checkedItems = props.ingredients.filter(item => item.checked);
      const uncheckedItems = props.ingredients.filter(item => !item.checked);
      
      let text = '【購物清單】\n\n';
      
      if (checkedItems.length > 0) {
        text += '已購買：\n';
        checkedItems.forEach(item => {
          text += `✓ ${item.text}\n`;
        });
        text += '\n';
      }
      
      if (uncheckedItems.length > 0) {
        text += '待購買：\n';
        uncheckedItems.forEach(item => {
          text += `☐ ${item.text}\n`;
        });
      }
      
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `購物清單_${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    };

    const close = () => {
      emit('close');
    };

    return {
      allChecked,
      toggleAll,
      exportList,
      close
    };
  }
};
</script>

