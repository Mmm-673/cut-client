/**
 * HTML 白名单过滤器
 * 用于 rich-text / v-html 渲染前过滤不安全的 HTML 内容，防止 XSS
 *
 * 使用正则方式实现（不依赖 DOM API，兼容小程序/App/H5 全平台）
 */

// 允许的标签白名单
const ALLOWED_TAGS = [
  'p', 'span', 'br', 'img', 'a',
  'ul', 'ol', 'li',
  'strong', 'em', 'b', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre', 'hr',
  'table', 'tr', 'td', 'th', 'thead', 'tbody',
  'div', 'section', 'article',
]

// 允许的属性（按标签）
const ALLOWED_ATTRS = {
  // 通用属性
  '*': ['style', 'class', 'title'],
  // 图片
  img: ['src', 'alt', 'width', 'height'],
  // 链接
  a: ['href', 'target', 'title', 'rel'],
}

// style 属性中允许的 CSS 属性（白名单）
const ALLOWED_STYLE_PROPS = [
  'color', 'background-color', 'background',
  'font-size', 'font-weight', 'font-style', 'font-family',
  'text-align', 'text-decoration', 'text-indent',
  'line-height', 'letter-spacing',
  'width', 'height',
  'margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom',
  'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
  'border', 'border-radius',
]

// 危险的 style 关键词（黑名单，命中即移除）
const DANGEROUS_STYLE_PATTERNS = [
  /javascript:/i,
  /expression/i,
  /url\s*\(/i,
  /@import/i,
  /behavior\s*:/i,
]

/**
 * 检查标签是否在白名单中
 */
function isTagAllowed(tag) {
  return ALLOWED_TAGS.indexOf(tag.toLowerCase()) !== -1
}

/**
 * 检查属性是否允许
 */
function isAttrAllowed(tag, attrName) {
  tag = tag.toLowerCase()
  attrName = attrName.toLowerCase()

  // 通用属性
  const commonAttrs = ALLOWED_ATTRS['*'] || []
  if (commonAttrs.indexOf(attrName) !== -1) {
    return true
  }

  // 标签特定属性
  const tagAttrs = ALLOWED_ATTRS[tag] || []
  return tagAttrs.indexOf(attrName) !== -1
}

/**
 * 过滤 style 属性值，只保留安全的 CSS
 */
function sanitizeStyle(styleValue) {
  if (!styleValue) return ''

  // 先检查危险关键词
  for (let i = 0; i < DANGEROUS_STYLE_PATTERNS.length; i++) {
    if (DANGEROUS_STYLE_PATTERNS[i].test(styleValue)) {
      return ''
    }
  }

  // 解析每个 CSS 属性，只保留白名单中的
  const props = styleValue.split(';')
  const safeProps = []

  for (let i = 0; i < props.length; i++) {
    const prop = props[i].trim()
    if (!prop) continue

    const colonIndex = prop.indexOf(':')
    if (colonIndex === -1) continue

    const propName = prop.substring(0, colonIndex).trim().toLowerCase()
    const propValue = prop.substring(colonIndex + 1).trim()

    if (ALLOWED_STYLE_PROPS.indexOf(propName) !== -1 && propValue) {
      // 再检查一次值中的危险关键词
      let hasDanger = false
      for (let j = 0; j < DANGEROUS_STYLE_PATTERNS.length; j++) {
        if (DANGEROUS_STYLE_PATTERNS[j].test(propValue)) {
          hasDanger = true
          break
        }
      }
      if (!hasDanger) {
        safeProps.push(propName + ': ' + propValue)
      }
    }
  }

  return safeProps.join('; ')
}

/**
 * 检查 URL 是否安全（http/https 或 data:image）
 */
function isSafeUrl(url) {
  if (!url) return false
  url = url.trim().toLowerCase()
  // 允许 http、https、相对路径、data:image
  if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
    return true
  }
  if (url.indexOf('data:image/') === 0) {
    return true
  }
  if (url.indexOf('/') === 0 || url.indexOf('./') === 0 || url.indexOf('../') === 0) {
    return true
  }
  return false
}

/**
 * 过滤标签属性
 * @param {string} tag - 标签名
 * @param {string} attrsStr - 属性字符串
 * @returns {string} 过滤后的属性字符串
 */
function sanitizeAttributes(tag, attrsStr) {
  if (!attrsStr) return ''

  const safeAttrs = []
  // 匹配 属性名="值" 或 属性名='值' 或 属性名
  const attrRegex = /([a-zA-Z-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g
  let match

  while ((match = attrRegex.exec(attrsStr)) !== null) {
    const attrName = match[1].toLowerCase()
    const attrValue = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : (match[4] || ''))

    if (!isAttrAllowed(tag, attrName)) {
      continue
    }

    // 特殊处理 src 和 href
    if (attrName === 'src' || attrName === 'href') {
      if (!isSafeUrl(attrValue)) {
        continue
      }
    }

    // 特殊处理 style
    if (attrName === 'style') {
      const safeStyle = sanitizeStyle(attrValue)
      if (safeStyle) {
        safeAttrs.push('style="' + safeStyle + '"')
      }
      continue
    }

    // 特殊处理 a 标签 target
    if (tag === 'a' && attrName === 'target') {
      // 强制 _blank 加 rel=noopener
      safeAttrs.push('target="_blank"')
      safeAttrs.push('rel="noopener noreferrer"')
      continue
    }

    // 普通属性
    safeAttrs.push(attrName + '="' + (attrValue || '') + '"')
  }

  return safeAttrs.join(' ')
}

/**
 * 核心过滤函数
 * 移除不在白名单中的标签（保留内容），过滤不安全的属性
 *
 * @param {string} html - 原始 HTML 字符串
 * @returns {string} 过滤后的安全 HTML
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return ''
  }

  let result = html
  let safetyCounter = 0
  const MAX_ITERATIONS = 100

  // 循环处理，防止嵌套的危险标签（如 <scr<script>ipt>）
  while (safetyCounter < MAX_ITERATIONS) {
    const before = result
    safetyCounter++

    // 1. 移除 script 标签及其内容
    result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    result = result.replace(/<script[^>]*\/?>/gi, '')

    // 2. 移除 style 标签及其内容
    result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    result = result.replace(/<style[^>]*\/?>/gi, '')

    // 3. 移除 iframe 标签
    result = result.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    result = result.replace(/<iframe[^>]*\/?>/gi, '')

    // 4. 移除其他危险标签（保留内容）
    const DANGEROUS_TAGS = ['script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'option', 'link', 'meta', 'base']
    for (let i = 0; i < DANGEROUS_TAGS.length; i++) {
      const tag = DANGEROUS_TAGS[i]
      const openRegex = new RegExp('<' + tag + '[^>]*>', 'gi')
      const closeRegex = new RegExp('<\/' + tag + '>', 'gi')
      result = result.replace(openRegex, '')
      result = result.replace(closeRegex, '')
    }

    if (before === result) {
      break
    }
  }

  // 5. 处理所有标签的属性白名单
  result = result.replace(/<([a-zA-Z0-9]+)(\s[^>]*)?(\/?)>/g, function(match, tagName, attrsStr, selfClosing) {
    const tagLower = tagName.toLowerCase()

    // 不在白名单的标签，移除标签本身（返回空字符串，内容保留）
    if (!isTagAllowed(tagLower)) {
      return ''
    }

    // 在白名单中，过滤属性
    const safeAttrs = sanitizeAttributes(tagLower, attrsStr || '')
    if (safeAttrs) {
      return '<' + tagLower + ' ' + safeAttrs + (selfClosing ? ' /' : '') + '>'
    } else {
      return '<' + tagLower + (selfClosing ? ' /' : '') + '>'
    }
  })

  // 6. 移除事件处理属性（onclick, onerror 等）
  result = result.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
  result = result.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
  result = result.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')

  // 7. 移除 javascript: 伪协议
  result = result.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
  result = result.replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'")

  return result
}

export default {
  sanitizeHtml,
}
