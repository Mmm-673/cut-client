<template>
  <view class="city-picker-mask" v-if="visible" @click="handleCancel">
    <view class="city-picker-wrapper" @click.stop>
      <view class="city-picker-header">
        <text class="cancel-btn" @click="handleCancel">取消</text>
        <text class="picker-title">选择城市</text>
        <text class="confirm-btn" @click="handleConfirm">确定</text>
      </view>
      <view class="city-picker-content">
        <!-- 省份选择 -->
        <view class="province-list">
          <view
              v-for="(province, index) in areaTree"
              :key="province.id"
              :class="{active: selectedProvinceIndex === index}"
              class="province-item"
              @click="onProvinceSelect(index)"
          >
            {{ province.name }}
          </view>
        </view>
        <!-- 城市选择 -->
        <view class="city-list">
          <view
              v-for="(city, index) in selectedProvince?.children || []"
              :key="city.id"
              :class="{active: selectedCityIndex === index}"
              class="city-item"
              @click="onCitySelect(index)"
          >
            {{ city.name }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  // 省市区树形数据 [{ id, name, children: [{ id, name }] }]
  areaTree: {
    type: Array,
    default: () => []
  },
  // 默认选中的城市ID
  defaultCityId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const selectedProvinceIndex = ref(-1)
const selectedCityIndex = ref(-1)

const selectedProvince = computed(() => {
  return selectedProvinceIndex.value !== -1 ? props.areaTree[selectedProvinceIndex.value] : null
})

const onProvinceSelect = (index) => {
  selectedProvinceIndex.value = index
  selectedCityIndex.value = -1
}

const onCitySelect = (index) => {
  selectedCityIndex.value = index
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

const handleConfirm = () => {
  if (selectedProvinceIndex.value !== -1 && selectedCityIndex.value !== -1) {
    const province = props.areaTree[selectedProvinceIndex.value]
    const city = province.children[selectedCityIndex.value]
    emit('confirm', {
      provinceId: province.id,
      provinceName: province.name,
      cityId: city.id,
      cityName: city.name,
      provinceIndex: selectedProvinceIndex.value,
      cityIndex: selectedCityIndex.value,
    })
    emit('update:visible', false)
  } else {
    uni.showToast({ title: '请选择城市', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.city-picker-mask {
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

.city-picker-wrapper {
  width: 100%;
  background: var(--bg-card, #1E252B);
  border-radius: 24rpx 24rpx 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.city-picker-header {
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
  }
}

.city-picker-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.province-list {
  width: 200rpx;
  background: rgba(255, 255, 255, 0.03);
  overflow-y: auto;

  .province-item {
    padding: 28rpx 24rpx;
    font-size: 28rpx;
    color: #9CA3AF;
    border-left: 4rpx solid transparent;
    transition: all 0.2s;

    &.active {
      color: #fff;
      background: rgba(0, 187, 136, 0.1);
      border-left-color: #00BB88;
      font-weight: 500;
    }
  }
}

.city-list {
  flex: 1;
  overflow-y: auto;

  .city-item {
    padding: 28rpx 32rpx;
    font-size: 30rpx;
    color: #fff;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s;

    &.active {
      color: #00BB88;
      background: rgba(0, 187, 136, 0.05);
    }
  }
}
</style>
