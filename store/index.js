import { createPinia } from 'pinia'
import { useUserStore } from './modules/user'
import { useConfigStore } from './modules/config'
import { useThemeStore } from './modules/theme'
import { useCoachStore } from './modules/coach'
import { useBookingStore } from './modules/booking'
import { useNotificationStore } from './modules/notification'

const pinia = createPinia()

export default pinia

export {
  useUserStore,
  useConfigStore,
  useThemeStore,
  useCoachStore,
  useBookingStore,
  useNotificationStore,
}
