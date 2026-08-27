<template>
  <view class="theme-wrapper" :class="`theme-${theme}`">
    <slot></slot>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '@/store'

const themeStore = useThemeStore()

const theme = computed(() => themeStore.theme)
</script>

<style lang="scss" scoped>
.theme-wrapper {
  min-height: calc(var(--vh, 1vh) * 100);
  width: 100%;
}
</style>
