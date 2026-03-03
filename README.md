# 교육용 태양계 3D 모형

React + Vite + React Three Fiber 기반의 교육용 태양계 3D 시뮬레이터입니다.

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

## GitHub Pages 배포

이 저장소에는 GitHub Actions 기반 Pages 배포 워크플로우가 포함되어 있습니다.

- 워크플로우 파일: `.github/workflows/deploy-pages.yml`
- 배포 트리거: `main` 또는 `master` 브랜치 push

### 1) GitHub 저장소 설정

1. GitHub 저장소로 푸시
2. `Settings > Pages` 이동
3. `Build and deployment`의 `Source`를 `GitHub Actions`로 설정

### 2) 배포 실행

- `main`/`master`에 push 하면 자동 배포
- 또는 `Actions > Deploy to GitHub Pages > Run workflow`로 수동 실행

### 3) 배포 주소

- `https://<your-github-id>.github.io/<repo-name>/`

## 참고

- Vite 설정에서 `base: './'`를 사용해 GitHub Pages의 서브패스 환경에서도 정적 리소스 경로가 동작하도록 구성했습니다.
