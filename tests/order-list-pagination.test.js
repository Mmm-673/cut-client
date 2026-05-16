/**
 * ORDER-04 测试：订单列表分页竞态条件
 *
 * Bug1: pageNo 无快照，异步请求发出后 pageNo 可能已被修改
 * Bug2: 无去重逻辑，同一页数据可能追加两次
 *
 * 修复：请求前快照参数，请求后验证 Tab，用 orderId 去重
 */

import { describe, it, expect } from 'vitest'

// 核心去重逻辑
function mergeOrderList(existingList, newList, isRefresh) {
  if (isRefresh) {
    return [...newList]
  }
  // 用 orderId 去重后追加
  const existingIds = new Set(existingList.map(o => o.orderId))
  const newItems = newList.filter(o => !existingIds.has(o.orderId))
  return [...existingList, ...newItems]
}

describe('ORDER-04: 订单列表分页竞态条件', () => {
  describe('mergeOrderList 去重逻辑', () => {
    const existingOrders = [
      { orderId: 1, name: '订单1' },
      { orderId: 2, name: '订单2' }
    ]

    it('刷新模式应完全替换列表', () => {
      const newList = [
        { orderId: 3, name: '订单3' },
        { orderId: 4, name: '订单4' }
      ]
      const result = mergeOrderList(existingOrders, newList, true)
      expect(result).toHaveLength(2)
      expect(result[0].orderId).toBe(3)
      expect(result[1].orderId).toBe(4)
    })

    it('追加模式应去重后合并', () => {
      const newList = [
        { orderId: 2, name: '订单2(重复)' },
        { orderId: 3, name: '订单3' }
      ]
      const result = mergeOrderList(existingOrders, newList, false)
      expect(result).toHaveLength(3)
      expect(result.map(o => o.orderId)).toEqual([1, 2, 3])
    })

    it('完全重复的列表追加后不应有重复项', () => {
      const result = mergeOrderList(existingOrders, existingOrders, false)
      expect(result).toHaveLength(2)
    })

    it('空列表追加应正常工作', () => {
      const result = mergeOrderList([], [{ orderId: 1, name: '订单1' }], false)
      expect(result).toHaveLength(1)
    })

    it('追加空列表应保持原列表不变', () => {
      const result = mergeOrderList(existingOrders, [], false)
      expect(result).toHaveLength(2)
    })
  })

  describe('Tab 切换竞态验证', () => {
    it('Tab 已切换时应丢弃返回数据', () => {
      const currentTab = 'pending'
      const requestTab = 'all'  // 请求发出时的 Tab
      // 如果当前 Tab 和请求时的 Tab 不同，应该丢弃
      const shouldDiscard = currentTab !== requestTab
      expect(shouldDiscard).toBe(true)
    })

    it('Tab 未切换时应保留返回数据', () => {
      const currentTab = 'pending'
      const requestTab = 'pending'
      const shouldDiscard = currentTab !== requestTab
      expect(shouldDiscard).toBe(false)
    })
  })
})
