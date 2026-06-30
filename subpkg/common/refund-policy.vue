<template>
  <view class="policy-wrapper">
    <scroll-view scroll-y class="policy-scroll">
      <!-- 标题 -->
      <view class="page-header">
        <text class="page-title">退款与取消规则</text>
        <text class="page-date">更新日期：2026年6月30日</text>
      </view>

      <!-- 政策内容 -->
      <view class="policy-content">
        <!-- 简介卡片 -->
        <view class="intro-card">
          <uni-icons type="info" size="24" color="#00BB88" />
          <text class="intro-text">
            以下退款与取消规则适用于初球平台的所有预约订单。请您在下单前仔细阅读，订单的取消扣费将严格依据裁教的实时履约状态判定。
          </text>
        </view>

        <view class="section">
          <view class="section-title">1. 退款原则</view>
          <text class="section-text">
            1.1 本规则所指“退款”仅针对用户在App内预付的裁教课时服务费用，不包含任何线下球馆的场地费。
          </text>
          <text class="section-text">
            1.2 退款将按照原支付路径退回，具体到账时间取决于第三方支付渠道（微信/支付宝）及银行的处理速度。
          </text>
          <text class="section-text">
            1.3 使用优惠券、活动折扣等购买的订单，退款时仅按用户实际支付的现金金额结算，优惠券不予补发。
          </text>
          <text class="section-text">
            1.4 钱包余额支付的部分将直接退回本平台钱包账户，可用于下次消费，暂不支持提现。
          </text>
        </view>

        <view class="section">
          <view class="section-title">2. 订单取消与扣费规则</view>

          <view class="rule-box">
            <view class="rule-header">
              <view class="rule-icon" style="background: rgba(0, 187, 136, 0.2)">
                <uni-icons type="checkmarkempty" size="20" color="#00BB88" />
              </view>
              <text class="rule-title">1. 裁教未确认出发前取消</text>
            </view>
            <view class="rule-content">
              <text class="rule-text">用户下单后，在裁教【未确认出发】前，用户可自主无责取消订单，系统将全额退还用户预付的所有费用。</text>
            </view>
          </view>

          <view class="rule-box">
            <view class="rule-header">
              <view class="rule-icon" style="background: rgba(251, 191, 36, 0.2)">
                <uni-icons type="clock" size="20" color="#FBBF24" />
              </view>
              <text class="rule-title">2. 裁教已确认出发后取消</text>
            </view>
            <view class="rule-content">
              <text class="rule-text">因裁教【已确认出发】后已实际产生出行时间与交通成本，若用户此时取消订单，需按系统设定标准承担相应的往返车费作为退单违约金。该笔费用将全额用于补偿裁教的出行损失。</text>
            </view>
          </view>

          <view class="rule-box">
            <view class="rule-header">
              <view class="rule-icon" style="background: rgba(239, 68, 68, 0.2)">
                <uni-icons type="close" size="20" color="#EF4444" />
              </view>
              <text class="rule-title">3. 服务正常开始后取消</text>
            </view>
            <view class="rule-content">
              <text class="rule-text">裁教已到达约定的服务地址，且【服务工作已正常开始】后，当前订单进入锁定履约阶段，用户将无法中途取消订单，预付服务费用不予退还。</text>
            </view>
          </view>
        </view>

        <view class="section">
          <view class="section-title">3. 特殊情况与场地费免责声明</view>
          <text class="section-text">
            3.1 【裁教爽约】如因裁教单方面迟到、旷工或因裁教自身原因临时取消订单导致服务无法提供的，平台核实后将全额退还用户预付费。
          </text>
          <text class="section-text">
            3.2 如因不可抗力（如自然灾害、政府突发政策管控等）导致线下无法履约的，用户可申请全额退款。
          </text>
          <text class="section-text" style="color: #FBBF24; font-weight: bold;">
            3.3 【场地费独立声明】教学/陪练所需的台球厅场地由用户自行选定并预约。不论因何种原因（包括用户自主取消、裁教爽约或不可抗力）导致订单退款或取消，本平台仅负责处理平台内的服务费与车费。用户因提前预订台球厅产生的台费、包厢费、异地违约金或无法退还的场地损失，均由用户与台球厅商家自行协商解决，本平台不承担任何连带赔偿责任。
          </text>
        </view>

        <view class="section">
          <view class="section-title">4. 退款流程</view>
          <text class="section-text">
            4.1 用户在App“订单详情”页点击“取消订单”，系统将自动根据当前订单的履约阶段，即时计算并展示可退金额及需扣除的必要成本。
          </text>
          <text class="section-text">
            4.2 退款申请提交后，若订单状态清晰，系统将即时原路退回；涉及特殊纠纷的订单，平台将在1-2个工作日内完成人工审核。
          </text>
          <text class="section-text">
            4.3 微信/支付宝支付通常在1-3个工作日内到账，银行卡可能需要3-7个工作日，具体到账时间以金融机构规定为准。
          </text>
        </view>

        <view class="section">
          <view class="section-title">5. 争议解决</view>
          <text class="section-text">
            5.1 若用户与裁教在线下就“是否到达指定地点”、“是否实际开始服务”或“服务质量”等发生争议，建议优先保留现场音视频、微信沟通截图等证据。
          </text>
          <text class="section-text">
            5.2 用户可点击下方客服电话或在线客服进行申诉，平台将依据系统后台日志（如定位数据、状态变更时间戳等）及双方提供的有效证据公平公正地处理最终争议。
          </text>
        </view>

        <!-- 联系客服 -->
        <view class="contact-card">
          <view class="contact-title">有疑问？联系客服</view>
          <view class="contact-info">
            <view class="contact-item">
              <uni-icons type="chat" size="20" color="#00BB88" />
              <text class="contact-text">在线客服：9:00 - 22:00</text>
            </view>
            <view class="contact-item">
              <uni-icons type="phone" size="20" color="#00BB88" />
              <text class="contact-text">客服热线：15900560488</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  uni.setNavigationBarTitle({ title: '退款与取消规则' })
})
</script>

<style lang="scss" scoped>
/* 样式保持不变 */
.policy-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
}

.policy-scroll {
  flex: 1;
  width: 100%;
}

.page-header {
  padding: 40rpx 30rpx 30rpx;
  text-align: center;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
  margin-bottom: 30rpx;
}

.page-title {
  display: block;
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.page-date {
  display: block;
  color: #6B7280;
  font-size: 24rpx;
}

.policy-content {
  padding: 0 30rpx;
}

.intro-card {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(0, 187, 136, 0.1);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 40rpx;
  border: 1rpx solid rgba(0, 187, 136, 0.2);
}

.intro-text {
  flex: 1;
  color: #9CA3AF;
  font-size: 26rpx;
  line-height: 1.6;
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  color: #00BB88;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  padding-left: 16rpx;
  border-left: 6rpx solid #00BB88;
}

.section-text {
  display: block;
  color: #9CA3AF;
  font-size: 26rpx;
  line-height: 1.8;
  margin-bottom: 16rpx;
  text-align: justify;
}

.rule-box {
  background: #1E252B;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.05);
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.rule-icon {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rule-title {
  flex: 1;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
}

.rule-content {
  padding-left: 60rpx;
}

.rule-text {
  color: #9CA3AF;
  font-size: 26rpx;
}

.contact-card {
  background: linear-gradient(135deg, rgba(0, 187, 136, 0.1) 0%, #1E252B 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-top: 40rpx;
  border: 1rpx solid rgba(0, 187, 136, 0.2);
}

.contact-title {
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
  text-align: center;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  justify-content: center;
}

.contact-text {
  color: #9CA3AF;
  font-size: 26rpx;
}

.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>