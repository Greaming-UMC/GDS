# GDS 0.0.2
Greaming Design System

React 앱용 디자인 시스템 패키지.

## 앱 레포 연결

### 옵션 A: 로컬 프리뷰 (file dependency)
퍼블리시 없이 로컬에서 컴포넌트를 확인할 때 사용.

```sh
# from the app repo
pnpm add ../GDS
pnpm -C ../GDS install
pnpm -C ../GDS build
```

참고: 패키지 엔트리는 `dist`를 읽으므로, 앱에 반영하려면
`pnpm -C ../GDS build`가 필요합니다.

### 옵션 B: 배포 패키지
레지스트리에서 사용할 때.

```sh
pnpm add @greaming/gds
pnpm up @greaming/gds
```

## Tailwind v4 테마 토큰

`theme.css`는 `@theme`를 사용하므로 Tailwind 빌드에서 처리돼야 합니다.
앱의 전역 CSS(Tailwind를 import하는 파일)에서 아래처럼 import 하세요:

```css
@import "tailwindcss/theme";
@import "@greaming/gds/theme.css";
@import "tailwindcss/utilities";
```

그 다음 유틸리티로 토큰을 사용합니다:

```html
<button class="bg-primary text-white font-brand">Button</button>
```

## 로컬 개발

```sh
pnpm install
pnpm dev
pnpm build
```
