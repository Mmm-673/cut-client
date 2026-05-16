// Vitest 全局 setup - mock uni-app API
import { vi } from 'vitest'

// Mock uni-app 全局对象
global.uni = {
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  setStorageSync: vi.fn(),
  getStorageSync: vi.fn((key) => ''),
  removeStorageSync: vi.fn(),
  request: vi.fn(),
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  reLaunch: vi.fn(),
  chooseImage: vi.fn(),
  getFileInfo: vi.fn(),
}
