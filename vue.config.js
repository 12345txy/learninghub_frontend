const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: [
    'vuetify'
  ],
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your backend server
        ws: true,
        changeOrigin: true,
        // pathRewrite: {
        //   '^/api': '' // Remove /api prefix when forwarding request
        // }
      }
    }
  }
})
