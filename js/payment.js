/**
 * 결제 연동 지점 (토스페이먼츠 등을 나중에 꽂을 수 있도록 분리).
 *
 * 사용 예:
 *   SajuPayment.use({
 *     async checkout(order) {
 *       // 예: 토스페이먼츠 결제위젯 / 결제창 호출
 *       // return { status: 'paid', paymentKey, orderId };
 *     }
 *   });
 *
 * 어댑터가 없으면 checkout()은 { status: 'coming_soon' } 을 반환하고,
 * UI는 '결제 기능은 곧 오픈됩니다' 안내 모달을 띄웁니다.
 */
(function (global) {
  'use strict';

  var Payment = {
    amount: 9900,
    currency: 'KRW',
    productId: 'saju-detailed-reading',
    productName: '상세 사주 풀이',
    providerName: 'toss-payments',
    provider: null,

    use: function (adapter) {
      this.provider = adapter || null;
    },

    createOrder: function (context) {
      var now = new Date();
      var stamp = now.getFullYear().toString()
        + String(now.getMonth() + 1).padStart(2, '0')
        + String(now.getDate()).padStart(2, '0')
        + String(now.getTime()).slice(-6);
      return {
        orderId: 'saju_' + stamp,
        amount: this.amount,
        currency: this.currency,
        productId: this.productId,
        productName: this.productName,
        customer: (context && context.customer) || {},
        reading: (context && context.reading) || null
      };
    },

    checkout: function (context) {
      var order = this.createOrder(context || {});
      if (this.provider && typeof this.provider.checkout === 'function') {
        return Promise.resolve(this.provider.checkout(order));
      }
      return Promise.resolve({ status: 'coming_soon', order: order });
    }
  };

  global.SajuPayment = Payment;
})(typeof window !== 'undefined' ? window : globalThis);
