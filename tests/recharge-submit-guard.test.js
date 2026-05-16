/**
 * PAY-03 测试：充值页防重复提交
 *
 * Bug：handleRecharge 没有 isSubmitting 标志，用户快速点击可发送多次充值请求。
 * 修复：添加 isSubmitting ref，点击时检查并锁定，完成后释放。
 */

import { describe, it, expect } from 'vitest'

// 模拟防重复提交的核心逻辑
function createSubmitGuard() {
  let isSubmitting = false

  return {
    get isSubmitting() {
      return isSubmitting
    },
    async submit(asyncFn) {
      if (isSubmitting) {
        return { duplicated: true }
      }
      isSubmitting = true
      try {
        const result = await asyncFn()
        return { duplicated: false, result }
      } finally {
        isSubmitting = false
      }
    }
  }
}

describe('PAY-03: 充值页防重复提交', () => {
  it('正常提交应成功执行', async () => {
    const guard = createSubmitGuard()
    let callCount = 0

    const result = await guard.submit(async () => {
      callCount++
      return 'ok'
    })

    expect(result.duplicated).toBe(false)
    expect(result.result).toBe('ok')
    expect(callCount).toBe(1)
  })

  it('提交中再次点击应被拒绝', async () => {
    const guard = createSubmitGuard()
    let callCount = 0

    // 模拟慢请求
    const slowFn = () => new Promise(resolve => {
      setTimeout(() => {
        callCount++
        resolve('ok')
      }, 100)
    })

    // 同时发起两次
    const [r1, r2] = await Promise.all([
      guard.submit(slowFn),
      guard.submit(slowFn)
    ])

    // 第一次应该成功
    expect(r1.duplicated).toBe(false)
    // 第二次应该被拦截
    expect(r2.duplicated).toBe(true)
    // 实际只执行了一次
    expect(callCount).toBe(1)
  })

  it('提交完成后可以再次提交', async () => {
    const guard = createSubmitGuard()
    let callCount = 0

    await guard.submit(async () => { callCount++ })
    await guard.submit(async () => { callCount++ })

    expect(callCount).toBe(2)
  })

  it('提交失败后 isSubmitting 应重置', async () => {
    const guard = createSubmitGuard()

    try {
      await guard.submit(async () => { throw new Error('fail') })
    } catch (e) {
      // expected
    }

    expect(guard.isSubmitting).toBe(false)
  })

  it('提交失败后可以再次提交', async () => {
    const guard = createSubmitGuard()
    let callCount = 0

    try {
      await guard.submit(async () => { throw new Error('fail') })
    } catch (e) {
      // expected
    }

    const result = await guard.submit(async () => {
      callCount++
      return 'ok'
    })

    expect(result.duplicated).toBe(false)
    expect(callCount).toBe(1)
  })
})
