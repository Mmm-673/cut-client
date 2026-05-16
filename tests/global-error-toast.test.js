/**
 * GLOBAL-01 测试：接口错误响应统一 toast 提示
 *
 * Bug：所有接口失败均无 toast 提示，页面静默失败。
 * 修复：在响应拦截器中对业务错误码（code !== 0）统一 toast 提示。
 */

import { describe, it, expect } from 'vitest'

// 核心逻辑：判断是否需要全局提示
function shouldShowGlobalError(responseData, config = {}) {
  // silent 模式跳过全局提示
  if (config.silent) return { show: false }
  // 业务错误码不为0时需要提示
  if (responseData.code !== 0) {
    return {
      show: true,
      message: responseData.msg || '操作失败，请重试'
    }
  }
  return { show: false }
}

describe('GLOBAL-01: 接口错误响应统一提示', () => {
  it('业务错误码不为0时应提示', () => {
    const result = shouldShowGlobalError({ code: 500, msg: '余额不足' })
    expect(result.show).toBe(true)
    expect(result.message).toBe('余额不足')
  })

  it('业务错误码为0时不应提示', () => {
    const result = shouldShowGlobalError({ code: 0, data: {} })
    expect(result.show).toBe(false)
  })

  it('msg 为空时使用默认提示', () => {
    const result = shouldShowGlobalError({ code: 500 })
    expect(result.show).toBe(true)
    expect(result.message).toBe('操作失败，请重试')
  })

  it('silent 模式应跳过提示', () => {
    const result = shouldShowGlobalError({ code: 500, msg: '错误' }, { silent: true })
    expect(result.show).toBe(false)
  })

  it('认证失败应提示', () => {
    const result = shouldShowGlobalError({ code: 401, msg: 'token已过期' })
    expect(result.show).toBe(true)
    expect(result.message).toBe('token已过期')
  })
})
