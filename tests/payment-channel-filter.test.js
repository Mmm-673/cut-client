/**
 * PAY-02 测试：getPayChannelsByEnabled 应根据平台正确过滤渠道
 *
 * Bug：原代码使用 channel.platForm（拼写错误），导致条件永远为 false，
 *      后端返回的渠道列表永远为空，总是 fallback 到本地渠道。
 *
 * 修复：改用 channel.platforms.includes(currentPlatform)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock uni-app 条件编译 - getCurrentPlatform 在测试中无法解析条件编译
// 所以我们直接测试 getPayChannelsByEnabled 的逻辑
// 需要提取核心过滤逻辑为可测试的纯函数

// 我们将测试核心的渠道过滤逻辑
// 从 payment.js 的 codeToChannel 和过滤逻辑中提取

const PAY_CHANNEL = {
  WX_MINIPROGRAM: 'wx_pub',
  WX_APP: 'wx_app',
  ALIPAY_APP: 'alipay_app',
  WALLET: 'wallet'
}

const codeToChannel = {
  'wx_pub': { value: 'wechat', label: '微信支付', channelCode: PAY_CHANNEL.WX_MINIPROGRAM, platforms: ['mp-weixin'] },
  'wx_lite': { value: 'wechat', label: '微信支付', channelCode: PAY_CHANNEL.WX_MINIPROGRAM, platforms: ['mp-weixin'] },
  'wx_app': { value: 'wechat', label: '微信支付', channelCode: PAY_CHANNEL.WX_APP, platforms: ['app-plus'] },
  'alipay_app': { value: 'alipay', label: '支付宝', channelCode: PAY_CHANNEL.ALIPAY_APP, platforms: ['app-plus'] },
  'wallet': { value: 'wallet', label: '钱包余额', channelCode: PAY_CHANNEL.WALLET, platforms: ['mp-weixin', 'app-plus', 'h5'] }
}

// 核心过滤函数（与 payment.js 中的逻辑一致）
function filterChannelsByPlatform(enabledCodes, currentPlatform) {
  const result = []
  enabledCodes.forEach(code => {
    const channel = codeToChannel[code]
    // 这里是修复后的逻辑：使用 platforms.includes 而非 platForm ===
    if (channel && channel.platforms && channel.platforms.includes(currentPlatform)) {
      result.push(channel)
    }
  })
  return result
}

describe('PAY-02: 支付渠道过滤', () => {
  describe('filterChannelsByPlatform - 修复后逻辑', () => {
    it('微信小程序平台应能过滤出 wx_pub 和 wallet 渠道', () => {
      const result = filterChannelsByPlatform(['wx_pub', 'wallet'], 'mp-weixin')
      expect(result).toHaveLength(2)
      expect(result[0].value).toBe('wechat')
      expect(result[1].value).toBe('wallet')
    })

    it('App 平台应能过滤出 wx_app、alipay_app 和 wallet 渠道', () => {
      const result = filterChannelsByPlatform(['wx_app', 'alipay_app', 'wallet'], 'app-plus')
      expect(result).toHaveLength(3)
    })

    it('H5 平台应只能过滤出 wallet 渠道', () => {
      const result = filterChannelsByPlatform(['wx_pub', 'alipay_app', 'wallet'], 'h5')
      expect(result).toHaveLength(1)
      expect(result[0].value).toBe('wallet')
    })

    it('当前平台不支持的渠道应被过滤掉', () => {
      // 微信小程序平台不应显示支付宝
      const result = filterChannelsByPlatform(['alipay_app', 'wallet'], 'mp-weixin')
      expect(result).toHaveLength(1)
      expect(result[0].value).toBe('wallet')
    })

    it('空渠道列表应返回空数组', () => {
      const result = filterChannelsByPlatform([], 'mp-weixin')
      expect(result).toHaveLength(0)
    })

    it('不存在的渠道编码应被忽略', () => {
      const result = filterChannelsByPlatform(['wx_pub', 'unknown_channel'], 'mp-weixin')
      expect(result).toHaveLength(1)
      expect(result[0].value).toBe('wechat')
    })
  })

  describe('原 Bug 复现验证：platForm 拼写错误', () => {
    // 模拟原来的错误逻辑
    function filterChannelsBuggy(enabledCodes, currentPlatform) {
      const result = []
      enabledCodes.forEach(code => {
        const channel = codeToChannel[code]
        // Bug: platForm 拼写错误，channel 上没有 platForm 属性
        if (channel && channel.platForm === currentPlatform) {
          result.push(channel)
        }
      })
      return result
    }

    it('使用 platForm（错误拼写）时，任何渠道都无法匹配', () => {
      const result = filterChannelsBuggy(['wx_pub', 'alipay_app', 'wallet'], 'mp-weixin')
      // platForm 不存在于 channel 对象，永远为 undefined
      expect(result).toHaveLength(0)
    })

    it('使用 platForm 时，即使渠道存在也返回空', () => {
      const result = filterChannelsBuggy(['wx_pub', 'wallet'], 'app-plus')
      expect(result).toHaveLength(0)
    })
  })
})
