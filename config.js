// 应用全局配置
export default {
  baseUrl: 'https://qiulem.com',
  // 应用信息
  appInfo: {
    // 应用名称
    name: "初球",
    // 应用版本
    version: "1.0.0",
    // 客户端版本号（用于服务端版本分流，三段式，如 1.0.2）
    clientVersion: "1.0.2",
    // 应用logo（深色/浅色主题）
    logo: "/static/logo.png",
    logoDark: "/static/logo.png",
    logoLight: "/static/logo_.png",
    // 官方网站
    site_url: "https://qiulem.com/homepage",
    // 政策协议
    agreements: [{
        title: "隐私政策",
        url: "/subpkg/common/textview?type=privacy"
      },
      {
        title: "用户服务协议",
        url: "/subpkg/common/textview?type=user"
      }
    ]
  }
}
