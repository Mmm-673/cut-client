/**
 * PAY-07 测试：充值金额应有最大值和小数位限制
 *
 * Bug：充值金额只校验 > 0，无最大金额上限，无小数位限制。
 * 修复：最大5万，强制两位小数。
 *
 * PAY-08 测试：金额计算浮点数精度
 *
 * Bug：price * quantity * 100 可能出现浮点精度问题。
 * 修复：使用 Math.round。
 */

import { describe, it, expect } from 'vitest'

// === PAY-07 核心逻辑 ===

const MAX_RECHARGE_AMOUNT = 50000

function validateRechargeAmount(amountStr) {
  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, message: '请输入充值金额' }
  }
  if (amount > MAX_RECHARGE_AMOUNT) {
    return { valid: false, message: '充值金额不能超过50000元' }
  }
  return { valid: true }
}

function formatAmountInput(value) {
  // 只允许数字和一个小数点
  let formatted = value.replace(/[^\d.]/g, '')
  const parts = formatted.split('.')
  // 多个小数点只保留第一个
  if (parts.length > 2) {
    formatted = parts[0] + '.' + parts.slice(1).join('')
  }
  // 小数位最多2位
  if (parts[1] && parts[1].length > 2) {
    formatted = parts[0] + '.' + parts[1].slice(0, 2)
  }
  return formatted
}

// === PAY-08 核心逻辑 ===

function calcAmountInCents(price, quantity) {
  return Math.round(price * quantity * 100)
}

describe('PAY-07: 充值金额校验', () => {
  describe('validateRechargeAmount', () => {
    it('有效金额应通过校验', () => {
      expect(validateRechargeAmount('100').valid).toBe(true)
      expect(validateRechargeAmount('0.01').valid).toBe(true)
      expect(validateRechargeAmount('49999.99').valid).toBe(true)
    })

    it('0 或负数应被拒绝', () => {
      expect(validateRechargeAmount('0').valid).toBe(false)
      expect(validateRechargeAmount('-10').valid).toBe(false)
    })

    it('超过5万应被拒绝', () => {
      expect(validateRechargeAmount('50001').valid).toBe(false)
      expect(validateRechargeAmount('100000').valid).toBe(false)
    })

    it('刚好5万应通过', () => {
      expect(validateRechargeAmount('50000').valid).toBe(true)
    })

    it('非数字应被拒绝', () => {
      expect(validateRechargeAmount('abc').valid).toBe(false)
      expect(validateRechargeAmount('').valid).toBe(false)
    })
  })

  describe('formatAmountInput', () => {
    it('应只保留数字和小数点', () => {
      expect(formatAmountInput('abc123')).toBe('123')
      expect(formatAmountInput('100元')).toBe('100')
    })

    it('应限制小数点后最多2位', () => {
      expect(formatAmountInput('123.456')).toBe('123.45')
      expect(formatAmountInput('12.99')).toBe('12.99')
    })

    it('应只保留一个小数点', () => {
      expect(formatAmountInput('12.3.4')).toBe('12.34')
    })

    it('整数输入应保持不变', () => {
      expect(formatAmountInput('500')).toBe('500')
    })
  })
})

describe('PAY-08: 金额计算浮点数精度', () => {
  it('0.1 * 3 应得到 30 而非 30.000000000000004', () => {
    // 经典浮点数问题
    expect(0.1 * 3 * 100).not.toBe(30) // 原始结果有精度问题
    expect(calcAmountInCents(0.1, 3)).toBe(30)
  })

  it('0.07 * 5 应得到 35', () => {
    expect(calcAmountInCents(0.07, 5)).toBe(35)
  })

  it('整数金额计算应正常', () => {
    expect(calcAmountInCents(100, 2)).toBe(20000)
  })

  it('常规金额计算应正确', () => {
    expect(calcAmountInCents(29.9, 3)).toBe(8970)
  })

  it('0.01 * 1 应得到 1', () => {
    expect(calcAmountInCents(0.01, 1)).toBe(1)
  })
})
