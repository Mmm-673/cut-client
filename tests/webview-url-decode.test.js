import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const webviewPage = readFileSync(resolve(process.cwd(), 'subpkg/common/webview.vue'), 'utf-8')

describe('通用 webview URL 解码', () => {
  it('onLoad 接收到编码 URL 后解码再传给 web-view', () => {
    expect(webviewPage).toContain('const params = { ...event }')
    expect(webviewPage).toContain('params.url = decodeURIComponent(params.url)')
    expect(webviewPage).toContain('this.params = params')
  })
})
