/**
 * 分页常量
 * 统一分页参数默认值
 */

// 分页默认值
export const PAGINATION = {
  // 默认页码
  DEFAULT_PAGE_NUM: 1,

  // 默认每页条数
  DEFAULT_PAGE_SIZE: 20,

  // 小列表每页条数
  SMALL_PAGE_SIZE: 10,

  // 大列表每页条数（如全部加载场景）
  LARGE_PAGE_SIZE: 50,

  // 超大列表（尽量一次拉完的场景）
  XLARGE_PAGE_SIZE: 100,

  // 球厅列表每页条数
  VENUE_PAGE_SIZE: 25,
}

// 分页初始状态生成器
export function createPagination(pageSize = PAGINATION.DEFAULT_PAGE_SIZE) {
  return {
    pageNum: PAGINATION.DEFAULT_PAGE_NUM,
    pageSize,
    total: 0,
    hasMore: true,
  }
}
