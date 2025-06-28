<template>
  <!-- 关于页面的主容器 -->
  <div class="about">
    <!-- 页面标题 -->
    <h1>This is an about page</h1>
  </div>
</template>

<script>
/**
 * AboutView 组件
 * 
 * 这是一个简单的关于页面组件，用于展示应用程序的相关信息。
 * 目前只包含一个基础的标题，可以根据需要扩展更多内容。
 * 
 * @component AboutView
 * @description 关于页面组件 - 显示应用程序的基本信息
 * @author 开发团队
 * @version 1.0.0
 */
export default {
  // 组件名称
  name: 'AboutView',
  
  // 组件数据
  data() {
    return {
      // 这里可以添加页面所需的数据
    }
  },
  
  // 计算属性
  computed: {
    // 这里可以添加计算属性
  },
  
  // 生命周期钩子
  created() {
    // 组件创建时的逻辑
  },
  
  // 组件方法
  methods: {
    // 这里可以添加页面相关的方法
  }
}
</script>

<style scoped>
/**
 * AboutView 组件的样式
 * 使用 scoped 确保样式只作用于当前组件
 */

/* 关于页面主容器样式 */
.about {
  /* 页面布局相关样式 */
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  
  /* 文本对齐 */
  text-align: center;
  
  /* 最小高度确保页面有足够的显示空间 */
  min-height: calc(100vh - 200px);
  
  /* 垂直居中显示内容 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 标题样式 */
.about h1 {
  /* 字体大小 */
  font-size: 2.5rem;
  
  /* 字体颜色 */
  color: #2c3e50;
  
  /* 字体粗细 */
  font-weight: 300;
  
  /* 外边距 */
  margin-bottom: 2rem;
  
  /* 文字阴影效果 */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 - 移动端适配 */
@media (max-width: 768px) {
  .about {
    /* 移动端减少内边距 */
    padding: 10px;
  }
  
  .about h1 {
    /* 移动端字体大小调整 */
    font-size: 2rem;
  }
}

/* 响应式设计 - 小屏幕设备适配 */
@media (max-width: 480px) {
  .about h1 {
    /* 小屏幕设备字体大小进一步调整 */
    font-size: 1.5rem;
  }
}
</style>
