<template>
  <view class="search-bar">
    <view class="search-input-wrapper">
      <uni-icons type="search" size="18" color="#999"></uni-icons>
      <input
          class="search-input"
          :placeholder="placeholder"
          placeholder-class="search-placeholder"
          :value="modelValue"
          @input="onInput"
          @confirm="onConfirm"
      />
      <uni-icons
          v-if="modelValue"
          type="clear"
          size="16"
          color="#999"
          class="clear-icon"
          @click="onClear"
      ></uni-icons>
    </view>
  </view>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索裁教姓名或特长'
  }
})

const emit = defineEmits(['update:modelValue', 'search'])

const onInput = (e) => {
  emit('update:modelValue', e.detail.value)
}

const onConfirm = () => {
  emit('search')
}

const onClear = () => {
  emit('update:modelValue', '')
  emit('search')
}
</script>

<style lang="scss" scoped>
.search-bar {
  padding: 20rpx 32rpx;

  .search-input-wrapper {
    display: flex;
    align-items: center;
    background-color: var(--bg-secondary);
    border-radius: 48rpx;
    padding: 16rpx 32rpx;

    .search-input {
      flex: 1;
      margin-left: 16rpx;
      color: var(--text-primary);
      font-size: 28rpx;
    }

    .search-placeholder {
      color: var(--text-placeholder);
    }

    .clear-icon {
      margin-left: 10rpx;
    }
  }
}
</style>
