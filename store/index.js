import { createPinia } from 'pinia'
import { useUserStore } from './modules/user'
import { useConfigStore } from './modules/config'
import { useThemeStore } from './modules/theme'
import { useBookingStore } from './modules/booking'

const pinia = createPinia()

export default pinia

export { useUserStore, useConfigStore, useThemeStore, useBookingStore }
