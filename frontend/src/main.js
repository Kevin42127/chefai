import { createApp } from 'vue';
import App from './App.vue';
import './styles/main.css';

const isAndroid = /Android/i.test(navigator.userAgent);
if (isAndroid) {
  document.documentElement.classList.add('android');
}

createApp(App).mount('#app');

