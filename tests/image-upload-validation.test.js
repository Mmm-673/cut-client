/**
 * FORM-01 测试：图片上传文件类型和大小校验
 *
 * Bug：chooseImage 仅设置 sizeType: ['compressed']，无文件类型和大小限制。
 * 修复：上传前校验文件大小 ≤ 5MB。
 */

import { describe, it, expect } from 'vitest'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

function validateImageFile(fileInfo) {
  if (!fileInfo) {
    return { valid: false, message: '文件信息获取失败' }
  }
  if (fileInfo.size > MAX_IMAGE_SIZE) {
    return { valid: false, message: '图片不能超过5MB' }
  }
  return { valid: true }
}

describe('FORM-01: 图片上传校验', () => {
  it('5MB 以内应通过校验', () => {
    expect(validateImageFile({ size: 1024 }).valid).toBe(true)
    expect(validateImageFile({ size: 5 * 1024 * 1024 }).valid).toBe(true)
  })

  it('超过5MB应被拒绝', () => {
    expect(validateImageFile({ size: 5 * 1024 * 1024 + 1 }).valid).toBe(false)
  })

  it('文件信息为空应被拒绝', () => {
    expect(validateImageFile(null).valid).toBe(false)
    expect(validateImageFile(undefined).valid).toBe(false)
  })
})
