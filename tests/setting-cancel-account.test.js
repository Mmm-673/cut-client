import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingPage = readFileSync(resolve(process.cwd(), 'subpkg/mine/setting.vue'), 'utf-8')

describe('设置页账号注销', () => {
  it('在退出登录下方提供登录态账号注销入口', () => {
    expect(settingPage).toContain('v-if="isLoggedIn"')
    expect(settingPage).toContain('账号注销')
    expect(settingPage).toContain('@click="openCancelAccountPopup"')
  })

  it('提供底部弹层填写可选注销原因', () => {
    expect(settingPage).toContain('showCancelAccountPopup')
    expect(settingPage).toContain('cancel-account-popup')
    expect(settingPage).toContain('请输入注销原因（选填）')
    expect(settingPage).toContain('v-model="cancelReason"')
    expect(settingPage).toContain('maxlength="255"')
  })

  it('支持取消关闭弹层并在提交中禁用交互', () => {
    expect(settingPage).toContain('@click="closeCancelAccountPopup"')
    expect(settingPage).toContain('isCancelingAccount')
    expect(settingPage).toContain('if (isCancelingAccount.value) return')
    expect(settingPage).toContain(':class="{ disabled: isCancelingAccount }"')
  })

  it('弹层操作区不使用原生 button 避免 loading 或 disabled 闪白', () => {
    expect(settingPage).toContain('<view class="cancel-account-cancel"')
    expect(settingPage).toContain('<view class="cancel-account-confirm"')
    expect(settingPage).not.toContain(':loading="isCancelingAccount"')
    expect(settingPage).not.toContain('<button class="cancel-account-confirm"')
  })

  it('确认注销后调用接口并退出登录', () => {
    expect(settingPage).toContain("import { cancelAccount } from '@/api/billiard/user'")
    expect(settingPage).toContain('await cancelAccount({')
    expect(settingPage).toContain('reason: cancelReason.value.trim()')
    expect(settingPage).toContain("uni.showToast({ title: '账号已注销', icon: 'success' })")
    expect(settingPage).toContain('await userStore.logout()')
    expect(settingPage).toContain("url: '/pages/login/index'")
  })
})
