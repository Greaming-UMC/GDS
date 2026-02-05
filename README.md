# GDS (Greaming Design System)

이 레포는 **Figma 토큰(JSON)**을 기준으로  
Tailwind에서 쓰는 **`theme.css`**를 자동 생성합니다.

## 1) 토큰 위치

- `src/tokens/color.json`
- `src/tokens/font.json`
- `src/tokens/shape.json`
- `src/tokens/shadow.json`
- `src/tokens/typescale.json`

## 2) `theme.css` 생성

```sh
pnpm tokens:build
```

`theme.css`는 **자동 생성 파일**입니다. 직접 수정하지 마세요.

## 3) 프론트 적용

1. 설치

```sh
pnpm add @greaming/gds
```

2. 전역 CSS import

```css
@import "@greaming/gds/theme.css";
@import "tailwindcss";
```

## 4) 예시 (각 요소 1회)

```tsx
<button className="display-large bg-secondary text-on-secondary rounded-medium shadow-1 state-layer secondary-opacity-8">
  GDS Button
</button>
```

- `display-large`: 타이포그래피(폰트/크기/자간/행간 포함)
- `bg-secondary`: 컬러 토큰
- `text-on-secondary`: 컬러 토큰
- `rounded-medium`: 라운드 토큰
- `shadow-1`: 그림자 토큰 프라이머리
- `shadow-secondary-1`: 그림자 토큰 세컨더리
- `state-layer`: 재사용 가능한 hover 오버레이 동작
- `secondary-opacity-8`: 오버레이 컬러 토큰

`state-layer`는 `::before` 레이어를 만들어 hover 시에만 보이게 합니다.  
오버레이 색상은 `primary-opacity-8`, `secondary-opacity-10`처럼 토큰 클래스로 지정합니다.

타이포 강조 버전은 `-emphasized` 접미사를 사용합니다.  
예: `display-large-emphasized`, `label-large-emphasized`

## 5) 폰트 파일

`theme.css`는 **폰트 이름만 정의**합니다.  
실제 폰트 파일(.woff2)은 **프론트 레포에서 로드**해야 합니다.
