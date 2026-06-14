import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const apiFile = readFileSync(resolve(process.cwd(), 'api/billiard/user.js'), 'utf-8')

describe('账号注销 API', () => {
  it('封装 cancelAccount 并请求注销接口', () => {
    expect(apiFile).toContain('export function cancelAccount(data)')
    expect(apiFile).toContain("url: '/app-api/billiard/user/cancel-account'")
    expect(apiFile).toContain("method: 'post'")
    expect(apiFile).toContain('data')
  })
})
