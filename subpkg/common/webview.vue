<template>
  <view v-if="params.url">
    <web-view :webview-styles="webviewStyles" :src="`${params.url}`"></web-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      params: {},
      webviewStyles: {
        progress: {
          color: "#FF3333"
        }
      }
    }
  },
  props: {
    src: {
      type: [String],
      default: null
    }
  },
  onLoad(event) {
    const url = event.url ? decodeURIComponent(event.url) : ''
    const title = event.title ? decodeURIComponent(event.title) : ''

    this.params = {
      ...event,
      url
    }

    if (title) {
      uni.setNavigationBarTitle({
        title
      })
    }
  }
}
</script>
