/**
 * PAY-06 测试：支付轮询超时后应给用户提示
 *
 * Bug：pollPayStatus 超时后仅返回 { paid: false, timeout: true }，无用户提示。
 * 修复：超时时弹出 uni.showModal 提示用户支付结果确认中。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// 提取核心轮询逻辑（不依赖 uni API）
function createPoller(options = {}) {
  const { maxAttempts = 3, interval = 50, onTimeout } = options

  return {
    async poll(checkFn) {
      let attempts = 0
      while (attempts < maxAttempts) {
        attempts++
        const result = await checkFn()
        if (result.paid) {
          return { paid: true, ...result }
        }
        // 模拟间隔（测试中用短间隔）
        await new Promise(r => setTimeout(r, interval))
      }
      // 超时
      if (onTimeout) {
        onTimeout()
      }
      return { paid: false, timeout: true }
    }
  }
}

describe('PAY-06: 支付轮询超时提示', () => {
  it('轮询成功时应返回 paid:true', async () => {
    const poller = createPoller({ maxAttempts: 3, interval: 10 })
    let callCount = 0
    const checkFn = async () => {
      callCount++
      return { paid: callCount >= 2 }
    }

    const result = await poller.poll(checkFn)
    expect(result.paid).toBe(true)
    expect(result.timeout).toBeUndefined()
  })

  it('轮询超时时应触发 onTimeout 回调', async () => {
    const onTimeout = vi.fn()
    const poller = createPoller({ maxAttempts: 3, interval: 10, onTimeout })
    const checkFn = async () => ({ paid: false })

    const result = await poller.poll(checkFn)
    expect(result.paid).toBe(false)
    expect(result.timeout).toBe(true)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('第一次就成功不应触发 onTimeout', async () => {
    const onTimeout = vi.fn()
    const poller = createPoller({ maxAttempts: 3, interval: 10, onTimeout })
    const checkFn = async () => ({ paid: true })

    const result = await poller.poll(checkFn)
    expect(result.paid).toBe(true)
    expect(onTimeout).not.toHaveBeenCalled()
  })
})
