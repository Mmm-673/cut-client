// 应用全局配置
export default {
  baseUrl: 'http://web.qiulem.com',
  // 应用信息
  appInfo: {
    // 应用名称
    name: "初球",
    // 应用版本
    version: "1.0.0",
    // 应用logo
    logo: "/static/logo.png",
    // 官方网站
    site_url: "http://web.qiulem.com/homepage",
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
