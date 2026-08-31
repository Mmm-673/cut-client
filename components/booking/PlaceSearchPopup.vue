<template>
  <view class="place-picker-mask" v-if="visible" @click="handleCancel">
    <view class="place-picker-wrapper" @click.stop>
      <view class="place-picker-header">
        <text class="cancel-btn" @click="handleCancel">取消</text>
        <text class="picker-title">选择服务地点</text>
        <text class="confirm-btn" :class="{disabled: !selectedPlace}" @click="handleConfirm">确定</text>
      </view>
      <view class="place-picker-content">
        <!-- 搜索框 -->
        <view class="search-box">
          <uni-icons type="search" size="18" color="#9CA3AF" />
          <input
              v-model="keyword"
              class="search-input"
              placeholder="请输入服务地点关键词"
              @input="onSearchInput"
              @confirm="onSearch"
          />
          <uni-icons
              v-if="keyword"
              type="clear"
              size="18"
              color="#9CA3AF"
              class="clear-icon"
              @click="clearSearch"
          />
        </view>
        <!-- 搜索结果 -->
        <view class="place-results" v-if="searchResults.length > 0">
          <view
              v-for="place in searchResults"
              :key="place.name"
              :class="{active: selectedPlace?.name === place.name}"
              class="place-item"
              @click="selectPlace(place)"
          >
            <text class="place-name">{{ place.name }}</text>
            <text class="place-address">{{ place.address }}</text>
          </view>
        </view>
        <!-- 无结果提示 -->
        <view class="no-results" v-if="keyword && searchResults.length === 0 && !searching">
          未找到相关地点，请尝试其他关键词
        </view>
        <!-- 加载中 -->
        <view class="no-results" v-if="searching">
          搜索中...
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  // 搜索函数，接收 keyword 返回 Promise<Array>
  searchFn: {
    type: Function,
    default: null
  },
  // 默认选中的地点
  defaultPlace: {
    type: Object,
    default: null
  },
  // 城市ID（用于限定搜索范围）
  cityId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const keyword = ref('')
const searchResults = ref([])
const selectedPlace = ref(null)
const searching = ref(false)
let searchTimer = null

const onSearchInput = () => {
  // 防抖搜索
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    onSearch()
  }, 300)
}

const onSearch = async () => {
  if (!keyword.value.trim()) {
    searchResults.value = []
    return
  }
  if (!props.searchFn) return

  searching.value = true
  try {
    const res = await props.searchFn(keyword.value, props.cityId)
    searchResults.value = res || []
  } catch (e) {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

const clearSearch = () => {
  keyword.value = ''
  searchResults.value = []
}

const selectPlace = (place) => {
  selectedPlace.value = place
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

const handleConfirm = () => {
  if (selectedPlace.value) {
    emit('confirm', selectedPlace.value)
    emit('update:visible', false)
  } else {
    uni.showToast({ title: '请选择服务地点', icon: 'none' })
  }
}

// 弹窗显示时重置状态
watch(() => props.visible, (val) => {
  if (val) {
    keyword.value = ''
    searchResults.value = []
    selectedPlace.value = props.defaultPlace || null
  }
})
</script>

<style lang="scss" scoped>
.place-picker-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.place-picker-wrapper {
  width: 100%;
  background: var(--bg-card, #1E252B);
  border-radius: 24rpx 24rpx 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.place-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 32rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;

  .cancel-btn {
    font-size: 30rpx;
    color: #9CA3AF;
  }

  .picker-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
  }

  .confirm-btn {
    font-size: 30rpx;
    color: #00BB88;
    font-weight: 500;

    &.disabled {
      color: #666;
    }
  }
}

.place-picker-content {
  flex: 1;
  overflow-y: auto;
  padding: 24rpx 32rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  margin-bottom: 24rpx;

  .search-input {
    flex: 1;
    margin: 0 16rpx;
    font-size: 28rpx;
    color: #fff;
  }

  .clear-icon {
    flex-shrink: 0;
  }
}

.place-results {
  .place-item {
    padding: 24rpx 0;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);

    &.active {
      .place-name {
        color: #00BB88;
      }
    }

    .place-name {
      font-size: 30rpx;
      color: #fff;
      display: block;
      margin-bottom: 8rpx;
    }

    .place-address {
      font-size: 24rpx;
      color: #9CA3AF;
    }
  }
}

.no-results {
  text-align: center;
  padding: 60rpx 0;
  font-size: 28rpx;
  color: #6B7280;
}
</style>
