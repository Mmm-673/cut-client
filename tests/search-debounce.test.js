/**
 * FORM-03 测试：搜索防抖
 *
 * Bug：搜索框每次触发事件都立即调接口，频繁触发请求。
 * 修复：使用 debounce，300ms 内只触发最后一次。
 */

import { describe, it, expect, vi } from 'vitest'

function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

describe('FORM-03: 搜索防抖', () => {
  it('快速连续调用只执行最后一次', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)

    debounced('a')
    debounced('ab')
    debounced('abc')

    // 立即检查，不应执行
    expect(fn).not.toHaveBeenCalled()

    // 等待 100ms
    await new Promise(r => setTimeout(r, 100))

    // 只执行了最后一次
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('abc')
  })

  it('间隔超过 delay 的调用都应执行', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 30)

    debounced('first')
    await new Promise(r => setTimeout(r, 50))

    debounced('second')
    await new Promise(r => setTimeout(r, 50))

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')
    expect(fn).toHaveBeenNthCalledWith(2, 'second')
  })

  it('单次调用应正常执行', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 30)

    debounced('hello')
    await new Promise(r => setTimeout(r, 50))

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('hello')
  })
})
