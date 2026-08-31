import config from '@/config'
import logger from '@/utils/logger'
import { TIME_ONE_SECOND } from '@/utils/constants'

/** 心跳间隔（毫秒） */
const HEARTBEAT_INTERVAL = 30 * TIME_ONE_SECOND

/**
 * 重连延迟序列（秒）
 * 指数退避：1s → 2s → 5s → 10s → 30s
 */
const RECONNECT_DELAYS = [1, 2, 5, 10, 30]

/** 最大重连延迟（秒），超过延迟序列长度后使用 */
const MAX_RECONNECT_DELAY = 30

// WebSocket 单例管理器
class WebSocketManager {
  constructor() {
    this.socketTask = null
    this.token = ''
    this.isConnected = false
    this.reconnectAttempts = 0
    this.reconnectTimer = null
    // 手动断开标记（避免主动断开后自动重连）
    this.manualClose = false
    // 消息回调集合
    this.listeners = {}
    // 消息去重（内存 Set）
    this.processedIds = new Set()
    // 心跳
    this.heartbeatTimer = null
  }

  /**
   * 建立 WebSocket 连接
   * @param {string} token - 用户 accessToken
   */
  connect(token) {
    if (!token) {
      logger.warn('[WebSocket] token 为空，跳过连接')
      return
    }

    // 如果已经连接且 token 相同，不重复连接
    if (this.isConnected && this.token === token && this.socketTask) {
      logger.debug('[WebSocket] 已连接，跳过')
      return
    }

    // 如果已有连接，先断开
    if (this.socketTask) {
      this.close(false)
    }

    this.token = token
    this.manualClose = false
    this.reconnectAttempts = 0

    const url = `${this._getWsBaseUrl()}/infra/ws?token=${encodeURIComponent(token)}`
    logger.debug('[WebSocket] 开始连接:', url)

    this.socketTask = uni.connectSocket({
      url: url,
      complete: () => {}
    })

    this.socketTask.onOpen(() => {
      logger.debug('[WebSocket] 连接成功')
      this.isConnected = true
      this.reconnectAttempts = 0
      this._startHeartbeat()
    })

    this.socketTask.onMessage((res) => {
      this._handleMessage(res.data)
    })

    this.socketTask.onError((err) => {
      logger.error('[WebSocket] 连接错误:', err)
      this.isConnected = false
      this._stopHeartbeat()
      this._tryReconnect()
    })

    this.socketTask.onClose(() => {
      logger.debug('[WebSocket] 连接关闭')
      this.isConnected = false
      this._stopHeartbeat()
      if (!this.manualClose) {
        this._tryReconnect()
      }
    })
  }

  /**
   * 断开连接
   * @param {boolean} manual - 是否主动断开（主动断开不重连）
   */
  disconnect() {
    this.close(true)
  }

  close(manual = false) {
    this.manualClose = manual
    this._stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.socketTask) {
      try {
        this.socketTask.close({})
      } catch (e) {
        logger.warn('[WebSocket] 关闭异常:', e)
      }
      this.socketTask = null
    }
    this.isConnected = false
  }

  /**
   * 重新连接（token 刷新时调用）
   * @param {string} newToken - 新的 accessToken
   */
  reconnect(newToken) {
    logger.debug('[WebSocket] 使用新 token 重连')
    this.close(false)
    this.connect(newToken)
  }

  /**
   * 订阅重大通知消息
   * @param {Function} callback - 回调函数，参数为解析后的通知对象
   * @returns {Function} 取消订阅的函数
   */
  onMajorNotification(callback) {
    return this._on('billiard_major_notification', callback)
  }

  /**
   * 检查通知是否已处理过（去重）
   * @param {number|string} id - 通知ID
   * @returns {boolean} true=已处理过
   */
  hasProcessed(id) {
    return this.processedIds.has(String(id))
  }

  /**
   * 标记通知为已处理
   * @param {number|string} id - 通知ID
   */
  markProcessed(id) {
    this.processedIds.add(String(id))
  }

  // ---------- 内部方法 ----------

  _getWsBaseUrl() {
    // 将 https:// 替换为 wss://，http:// 替换为 ws://
    const baseUrl = config.baseUrl
    if (baseUrl.startsWith('https://')) {
      return baseUrl.replace('https://', 'wss://')
    }
    return baseUrl.replace('http://', 'ws://')
  }

  _handleMessage(data) {
    try {
      const message = JSON.parse(data)
      const type = message.type

      // 心跳响应
      if (type === 'ping' || type === 'pong') {
        return
      }

      // 重大通知
      if (type === 'billiard_major_notification') {
        const notification = JSON.parse(message.content)
        // 去重检查
        if (notification.notificationId && this.hasProcessed(notification.notificationId)) {
          logger.debug('[WebSocket] 通知已处理过，跳过:', notification.notificationId)
          return
        }
        if (notification.notificationId) {
          this.markProcessed(notification.notificationId)
        }
        this._emit('billiard_major_notification', notification)
        // 全局事件通知（角标刷新等）
        uni.$emit('major-notification', notification)
      }
    } catch (e) {
      logger.error('[WebSocket] 消息解析失败:', e, data)
    }
  }

  _tryReconnect() {
    if (this.manualClose) return
    if (this.reconnectTimer) return

    const delay = this.reconnectAttempts < RECONNECT_DELAYS.length
      ? RECONNECT_DELAYS[this.reconnectAttempts]
      : MAX_RECONNECT_DELAY

    logger.debug(`[WebSocket] ${delay}秒后尝试第 ${this.reconnectAttempts + 1} 次重连`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectAttempts++
      if (this.token) {
        this.connect(this.token)
      }
    }, delay * TIME_ONE_SECOND)
  }

  _startHeartbeat() {
    this._stopHeartbeat()
    // 简单心跳：定时发送 ping 消息
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.socketTask) {
        try {
          this.socketTask.send({
            data: JSON.stringify({ type: 'ping' }),
            fail: (e) => {
              logger.warn('[WebSocket] 心跳发送失败:', e)
            }
          })
        } catch (e) {
          logger.warn('[WebSocket] 心跳异常:', e)
        }
      }
    }, HEARTBEAT_INTERVAL)
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  _on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
    // 返回取消订阅函数
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  _emit(event, data) {
    const callbacks = this.listeners[event] || []
    callbacks.forEach(cb => {
      try {
        cb(data)
      } catch (e) {
        logger.error(`[WebSocket] ${event} 回调异常:`, e)
      }
    })
  }
}

// 导出单例
const wsManager = new WebSocketManager()
export default wsManager
