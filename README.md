# 교육용 태양계 3D 모형

React + Vite + React Three Fiber 기반의 교육용 태양계 3D 시뮬레이터입니다.

## 주요 학습 모드

- 보기 좋은 모드: 전체 태양계 구조와 공전/자전 개념을 빠르게 파악
- 지구 클로즈업 모드: 지구 자전축(계절), 달 위상, 대조기/소조기(밀물·썰물) 관찰
- 실제 비율 모드: 실제 우주 스케일 차이를 체감

## 로컬 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
npm run preview
```

## 수업 영상 추가/관리

3D 모형 하단의 영상 영역은 데이터 파일 기반으로 동작합니다.

- 영상 데이터 파일: `src/data/learningVideoData.ts`
- `learningVideoSources` 배열에 항목을 추가하면 목록/검색/플레이어에 자동 반영
- 한 번에 iframe 하나만 렌더링해서 영상이 많아져도 화면 성능이 급격히 떨어지지 않도록 구성

```ts
{
  id: 'solar-system-example-002',
  title: '새 태양계 영상',
  description: '영상 요약 설명',
  youtubeUrl: 'https://youtu.be/VIDEO_ID',
  level: '중급',
}
```

지원 링크 형식:

- `https://youtu.be/...`
- `https://www.youtube.com/watch?v=...`
- `https://www.youtube.com/shorts/...`
- `https://www.youtube.com/embed/...`

## Vercel 배포

현재 운영 배포는 Vercel을 기준으로 관리합니다.

- 운영 URL: `https://solarsystem-weld-psi.vercel.app`
- Vercel 프로젝트: `solar_system`
- 프로젝트 연결 정보: `.vercel/project.json`

### 1) 최초 1회 연결

```bash
npm install
npm run build
npm install -g vercel
vercel login
vercel
```

- 최초 `vercel` 실행 시 Vercel 프로젝트가 없으면 새 프로젝트를 만들고, 있으면 현재 저장소를 해당 프로젝트에 연결합니다.
- 이 저장소는 이미 Vercel 프로젝트 `solar_system`에 연결된 상태입니다.

### 2) 프리뷰 배포

```bash
vercel
```

- 브랜치나 작업 중인 상태를 빠르게 확인할 수 있는 프리뷰 URL이 생성됩니다.

### 3) 운영 배포

```bash
npm run build
vercel --prod
```

- 운영 배포가 완료되면 Vercel이 프로덕션 URL과 별칭(alias) URL을 출력합니다.
- 배포 상태 확인:

```bash
vercel inspect <deployment-url>
```

예시:

```bash
vercel inspect solarsystem-weld-psi.vercel.app
```

### 4) GitHub 연동

- 현재 GitHub 저장소 `byoh5/solar_system`가 Vercel 프로젝트에 연결되어 있습니다.
- 이후 자동 배포 정책은 Vercel 대시보드의 Git 설정을 기준으로 관리하면 됩니다.

## GitHub Pages 보조 배포

GitHub Pages 워크플로우도 그대로 유지하고 있습니다.

- 워크플로우 파일: `.github/workflows/deploy-pages.yml`
- 배포 트리거: `main` 또는 `master` 브랜치 push
- 배포 주소 형식: `https://<your-github-id>.github.io/<repo-name>/`

## 참고

- `vite.config.ts`에서는 GitHub Actions 환경일 때만 `base: './'`를 사용하고, Vercel 및 일반 환경에서는 `/`를 사용하도록 구성했습니다.
