import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bellabao.boboji',
  appName: '钵钵鸡',
  webDir: 'dist',
  // 与游戏底色一致，避免启动/旋转瞬间白闪
  backgroundColor: '#2b0d08',
  ios: {
    // 游戏自己处理 safe-area（CSS env()），WebView 铺满全屏
    contentInset: 'never',
    // 3D 游戏禁用 WebView 滚动/回弹
    scrollEnabled: false,
    backgroundColor: '#2b0d08',
    allowsLinkPreview: false,
  },
};

export default config;
