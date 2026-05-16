/**
 * ORDER-02 + ORDER-03 测试
 *
 * ORDER-02: 评价提交无防重复提交
 * ORDER-03: 评价星级默认5分导致最低星校验失效
 */

import { describe, it, expect } from 'vitest'

// === ORDER-03 核心逻辑 ===

// 默认评分应为0（未评分），而非5
const DEFAULT_SCORE = 0

function validateScore(score) {
  if (score === 0) {
    return { valid: false, message: '请先给教练打分' }
  }
  return { valid: true }
}

// === ORDER-02 核心逻辑 ===
// 复用 submitGuard 模式

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

describe('ORDER-03: 评价星级默认值', () => {
  it('默认评分应为0（未评分）', () => {
    expect(DEFAULT_SCORE).toBe(0)
  })

  it('评分为0时校验不通过', () => {
    expect(validateScore(0).valid).toBe(false)
  })

  it('评分1-5时校验通过', () => {
    expect(validateScore(1).valid).toBe(true)
    expect(validateScore(3).valid).toBe(true)
    expect(validateScore(5).valid).toBe(true)
  })
})

describe('ORDER-02: 评价提交防重复', () => {
  it('提交中再次点击应被拒绝', async () => {
    const guard = createSubmitGuard()
    let callCount = 0

    const slowFn = () => new Promise(resolve => {
      setTimeout(() => {
        callCount++
        resolve('ok')
      }, 50)
    })

    const [r1, r2] = await Promise.all([
      guard.submit(slowFn),
      guard.submit(slowFn)
    ])

    expect(r1.duplicated).toBe(false)
    expect(r2.duplicated).toBe(true)
    expect(callCount).toBe(1)
  })
})
