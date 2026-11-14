# 명경사주 (明鏡四柱)

무료 맛보기 사주팔자 + 유료 상세 풀이를 목표로 한 정적 사이트 MVP입니다.
백엔드 없이 브라우저에서만 계산합니다.

## 로컬에서 보기

```bash
cd saju-site
python3 -m http.server 8080
```

브라우저에서 http://127.0.0.1:8080 을 엽니다.

나중에 올릴 때는 Cloudflare Pages, Netlify, GitHub Pages 같은 무료 정적 호스팅에
이 폴더를 그대로 올리면 됩니다. (이 저장소에서는 배포하지 않았습니다.)

## 구성

- `index.html` — 랜딩, 입력 폼, 결과, 결제 안내 모달
- `css/style.css` — 모바일 우선, 네이비·골드 동양풍 UI
- `js/saju.js` — 사주팔자 계산 래퍼
- `js/interpret.js` — 일간·오행·세운 문안 (재미·참고용)
- `js/payment.js` — 결제 연동 자리 (`SajuPayment.use(adapter)`)
- `js/app.js` — 폼과 화면
- `vendor/lunar.js` — [lunar-javascript](https://github.com/6tail/lunar-javascript) v1.7.8 (6tail, MIT)

## 계산 기준

- 년주: 입춘 절입 시각
- 월주: 해당 달의 절(節) 절입 시각
- 입력 시각은 한국 표준시(KST)로 간주
- 야자시(23:00–00:00)는 라이브러리 기본 流派 2 — 일주는 당일, 시주만 자시
- 경도 보정·과거 서머타임은 반영하지 않음

## 결제

지금은 「상세 풀이 보기 (예: 9,900원)」를 누르면 안내 모달만 열립니다.
토스페이먼츠 등을 붙일 때는 `js/payment.js`의 `SajuPayment.use({ checkout })`에
어댑터를 넣으면 됩니다. 실제 유료 잠금 해제는 서버 검증이 필요합니다.

## 면책

결과는 명리학 기반의 재미·참고용이며, 중요한 결정의 근거로 쓰지 마세요.
