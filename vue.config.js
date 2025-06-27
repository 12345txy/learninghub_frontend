const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: [
    'vuetify'
  ],
  devServer: {
    port: 8081,
    host: 'localhost',
    client: {
      webSocketURL: 'ws://localhost:8081/ws'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your backend server
        ws: true,
        changeOrigin: true,
        logLevel: 'debug',
        // pathRewrite: {
        //   '^/api': '' // Remove /api prefix when forwarding request
        // }
      },
      '/ws-chat': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
        logLevel: 'debug',
      }
    }
  }
})
