import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 生产构建时移除 console.log / debugger（H5 端生效）
// 微信小程序端请在 HBuilderX 发行时勾选「运行时压缩」或在 manifest.json 配置
export default defineConfig({
  plugins: [uni()],
  build: {
    sourcemap: false,
    // 生产环境移除 console 和 debugger
    minify: 'esbuild',
    target: 'es2015',
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    rollupOptions: {
      output: {
        // 按模块拆包，优化缓存
        manualChunks: {
          'vue-vendor': ['vue', 'pinia'],
        },
      },
    },
  },
})
