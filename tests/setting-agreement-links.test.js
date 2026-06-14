import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingPage = readFileSync(resolve(process.cwd(), 'subpkg/mine/setting.vue'), 'utf-8')

describe('设置页协议跳转', () => {
  it('点击用户协议和隐私政策跳转服务器网页', () => {
    expect(settingPage).toContain("@click=\"goToAgree('user')\"")
    expect(settingPage).toContain("@click=\"goToAgree('privacy')\"")
    expect(settingPage).toContain('const agreementUrls = {')
    expect(settingPage).toContain("user: 'https://example.com/user-agreement'")
    expect(settingPage).toContain("privacy: 'https://example.com/privacy-policy'")
    expect(settingPage).toContain('const goToAgree = (type) => {')
    expect(settingPage).toContain("url: `/subpkg/common/webview?url=${encodeURIComponent(agreementUrls[type])}&title=${encodeURIComponent(title)}`")
  })
})
