import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import axios from 'axios'

// Set a base URL for all axios requests
// axios.defaults.baseURL = '/api' 

// Add a request interceptor to include the token in headers
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log('🔍 请求拦截器 - 当前token:', token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token已添加到请求头');
  } else {
    console.log('❌ 没有找到token');
  }
  console.log('📤 发送请求:', config.method?.toUpperCase(), config.url, config.headers);
  return config;
}, error => {
  return Promise.reject(error);
});

// 添加响应拦截器来查看服务器响应
axios.interceptors.response.use(response => {
  console.log('📥 收到响应:', response.status, response.config.url);
  return response;
}, error => {
  console.log('❌ 请求失败:', error.response?.status, error.config?.url, error.response?.data);
  return Promise.reject(error);
});

Vue.prototype.$axios = axios
Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
