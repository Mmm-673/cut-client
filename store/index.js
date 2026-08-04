import { createPinia } from 'pinia'
import { useUserStore } from './modules/user'
import { useConfigStore } from './modules/config'
import { useThemeStore } from './modules/theme'

const pinia = createPinia()

export default pinia

export { useUserStore, useConfigStore, useThemeStore }
