import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const loginPage = readFileSync(resolve(process.cwd(), 'pages/login/index.vue'), 'utf-8')

describe('登录页协议跳转', () => {
  it('点击用户协议和隐私政策跳转服务器网页', () => {
    expect(loginPage).toContain('const agreementUrls = {')
    expect(loginPage).toContain("user: 'https://example.com/user-agreement'")
    expect(loginPage).toContain("privacy: 'https://example.com/privacy-policy'")
    expect(loginPage).toContain('const goToAgree = (type) => {')
    expect(loginPage).toContain("url: `/subpkg/common/webview?url=${encodeURIComponent(agreementUrls[type])}&title=${encodeURIComponent(title)}`")
    expect(loginPage).not.toContain('/subpkg/common/textview?type=user')
  })
})
