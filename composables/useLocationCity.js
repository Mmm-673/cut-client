import { ref } from 'vue'
import { getAreaTree } from '@/api/billiard/area'
import { searchServicePlace } from '@/api/billiard/venue'
import { getLocation, extractCity, showPermissionModal } from '@/utils/location'
import { logger } from '@/utils/logger'

/**
 * 定位、城市选择、地点搜索统一管理
 * @returns {Object} 定位和城市相关的状态与方法
 */
export function useLocationCity() {
  // 定位相关
  const locating = ref(false)
  const locationDenied = ref(false)
  const currentLocation = ref({ longitude: null, latitude: null })
  const currentCity = ref('')

  // 城市选择相关
  const areaTree = ref([])
  const selectedCityId = ref(null)
  const showCityPicker = ref(false)
  const showPlacePicker = ref(false)

  // 地点选择
  const selectedPlace = ref(null)

  /**
   * 获取当前位置
   */
  const getCurrentLocation = async () => {
    if (locating.value) return
    locating.value = true

    try {
      const { longitude, latitude, regeocodeData } = await getLocation({ needRegeocode: true })
      currentLocation.value = { longitude, latitude }
      currentCity.value = extractCity(regeocodeData)
      locationDenied.value = false
    } catch (err) {
      logger.error('定位失败:', err)
      if (err.message === 'permission_denied') {
        locationDenied.value = true
        showPermissionModal({
          content: '您未开启定位权限，将无法获取当前位置。是否前往开启？',
          onSuccess: () => {
            locationDenied.value = false
            getCurrentLocation()
          }
        })
      } else {
        uni.showToast({ title: '定位失败，请检查定位功能', icon: 'none' })
      }
    } finally {
      locating.value = false
    }
  }

  /**
   * 加载地区树（省-市两级）
   */
  const loadAreaTree = async () => {
    try {
      const res = await getAreaTree()
      if (res.code === 0 && res.data) {
        const processData = (list) => {
          return list.map(item => {
            const newItem = { ...item }
            if (newItem.children && newItem.children.length > 0) {
              newItem.children = newItem.children.map(city => {
                const cityItem = { ...city }
                cityItem.children = undefined
                return cityItem
              })
            }
            return newItem
          })
        }
        areaTree.value = processData(res.data)
      }
    } catch (error) {
      logger.error('加载地区树失败:', error)
    }
  }

  /**
   * 城市选择器确认回调
   * @param {Object} result - 选择结果
   */
  const onCityPickerConfirm = (result) => {
    selectedCityId.value = result.cityId
    currentCity.value = result.cityName
  }

  /**
   * 地点搜索函数（封装给 PlaceSearchPopup 组件用）
   * @param {string} keyword - 关键词
   * @param {string|number} cityId - 城市ID
   * @returns {Promise<Array>} 搜索结果
   */
  const handlePlaceSearch = async (keyword, cityId) => {
    try {
      const res = await searchServicePlace({ keyword, cityId })
      return res.data || []
    } catch (e) {
      logger.error('地点搜索失败:', e)
      return []
    }
  }

  /**
   * 地点选择器确认回调
   * @param {Object} place - 选中的地点
   * @param {Ref<Object>} [orderData] - 订单数据 ref（可选，用于同步更新）
   */
  const onPlacePickerConfirm = (place, orderData) => {
    selectedPlace.value = place
    if (orderData && orderData.value) {
      orderData.value.venueName = place.name
      orderData.value.venueAddress = place.address
    }
  }

  /**
   * 重新定位
   */
  const reLocate = async () => {
    selectedCityId.value = null
    await getCurrentLocation()
  }

  /**
   * 获取用于显示的城市名
   * @returns {string} 城市名
   */
  const getDisplayCityName = () => {
    if (selectedCityId.value) {
      const findName = (list, id) => {
        for (const area of list) {
          if (area.id === id) return area.name
          if (area.children) {
            const found = findName(area.children, id)
            if (found) return found
          }
        }
        return null
      }
      return findName(areaTree.value, selectedCityId.value) || ''
    }
    return currentCity.value || ''
  }

  return {
    // 状态
    locating,
    locationDenied,
    currentLocation,
    currentCity,
    areaTree,
    selectedCityId,
    showCityPicker,
    showPlacePicker,
    selectedPlace,
    // 方法
    getCurrentLocation,
    loadAreaTree,
    onCityPickerConfirm,
    handlePlaceSearch,
    onPlacePickerConfirm,
    reLocate,
    getDisplayCityName,
  }
}

export default useLocationCity
