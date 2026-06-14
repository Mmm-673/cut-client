import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const loginPage = readFileSync(resolve(process.cwd(), 'pages/login/index.vue'), 'utf-8')

describe('登录页协议勾选', () => {
  it('默认不勾选协议', () => {
    expect(loginPage).toContain('const agree = ref(false)')
  })

  it('未勾选协议时提示阅读并同意隐私政策', () => {
    expect(loginPage).toContain("uni.showToast({ title: '请先阅读并同意隐私政策', icon: 'none' })")
  })
})