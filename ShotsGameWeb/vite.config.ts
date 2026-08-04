import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ShotsGame/' : '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true, // 锁死 5173 端口，被占用时报错而不跳转其他端口
    open: true, // 启动时自动打开浏览器
    allowedHosts: true, // 允许所有 host（仅本地+局域网用，关闭隧道访问）
  },
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }),
    tsconfigPaths()
  ],
}))
