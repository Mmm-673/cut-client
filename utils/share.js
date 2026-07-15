// 全局分享配置
export default {
  onShareAppMessage() {
    return {
      title: '初球 - 台球预约平台',
      path: '/pages/home/index',
      imageUrl: '' // 可以设置自定义分享图片
    }
  },
  // #ifdef MP-WEIXIN
  onShareTimeline() {
    return {
      title: '初球 - 台球预约平台',
      query: '',
      imageUrl: '' // 可以设置自定义分享图片
    }
  }
  // #endif
}
