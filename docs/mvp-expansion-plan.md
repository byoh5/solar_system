# 교육용 태양계 3D 모형 계획서 (MVP -> 확장)

## 1) 목표
- 브라우저에서 태양계 3D를 조작하며 공전/자전, 스케일(거리/크기), 시간 가속을 직관적으로 학습한다.
- 수업 시연과 학생 자율 체험 모두 가능한 인터랙션 중심 구성으로 설계한다.

## 2) 핵심 학습 포인트
- 공전과 자전의 차이를 시각적으로 구분한다.
- 실제 비율이 왜 보기 어려운지 모드 전환으로 체감한다.
- 시간 가속으로 행성 공전 주기 차이를 비교한다.
- 클릭 카드로 행성 핵심 정보를 빠르게 학습한다.

## 3) MVP 범위 (현재 구현 대상)
- 태양 + 8행성 렌더링
- 공전/자전 애니메이션
- 시간 가속 슬라이더
- 거리 스케일 슬라이더
- 크기 과장 슬라이더
- 보기 좋은 모드 / 실제 비율 모드 토글
- 궤도선 on/off
- 라벨 on/off
- 행성 클릭 선택 + 우측 정보 카드
- 상단 리셋 및 카메라 프레이밍 버튼

## 4) 아키텍처
- 프레임워크: React + Vite + TypeScript
- 3D: @react-three/fiber, @react-three/drei
- 상태관리: Zustand
- UI: 커스텀 우측 패널 + 상단 툴바

## 5) 데이터 모델
`planetData`는 아래 필드를 가진다.
- `id`, `nameKr`, `nameEn`
- `radiusKm`, `orbitRadiusAU`
- `orbitalPeriodDays`, `rotationPeriodHours`
- `color`, `moonsCount`, `desc`

렌더링 시에는 데이터와 UI 스케일 값을 결합해 아래를 계산한다.
- `renderOrbitRadius = f(orbitRadiusAU, mode, distanceScale)`
- `renderRadius = f(radiusKm, mode, sizeExaggeration)`

## 6) 3D 구성 규칙
- 씬: `Canvas + PointLight(태양) + AmbientLight + Stars + OrbitControls`
- 행성 구조: `OrbitGroup(공전) -> PlanetMesh(자전)`
- 프레임 업데이트: `useFrame(delta)`에서 `timeScale`을 반영

## 7) 모드 설계
- 보기 좋은 모드(기본): 거리 압축 + 크기 과장
- 실제 비율 모드: 거리/크기 상대비율 강화 (행성이 작고 멀게 보임)
- 모드 전환 시 학습 안내 문구를 표시한다.

## 8) 단계별 구현 순서
1. 프로젝트 세팅 및 기본 레이아웃
2. planet 데이터와 스케일 유틸 작성
3. 태양/행성/궤도 렌더링 + 공전/자전 적용
4. Zustand 스토어로 UI/씬 상태 연결
5. 클릭 선택 및 정보 카드
6. 모드 토글/리셋/프레이밍 정리
7. 빌드 검증

## 9) 완료 기준 (DoD)
- 8행성이 안정적으로 렌더링되고 성능이 유지된다.
- 슬라이더 변경이 공전/자전/스케일에 즉시 반영된다.
- 모드 토글 시 실제 비율 vs 보기 좋은 차이가 분명하다.
- 클릭한 행성 정보 카드가 정확히 변경된다.
- `npm run build`가 성공한다.

## 10) 확장 로드맵
### V1
- 지구-달 시스템
- 토성 고리
- 카메라 프리셋(전체/내행성/외행성/행성 따라가기)
- 낮/밤 강조 표현

### V2
- NASA/JPL 정밀 모드
- 퀴즈/미션 학습 모듈
- 모바일/태블릿 UX 최적화
