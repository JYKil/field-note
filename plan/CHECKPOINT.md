# fieldNote 구현 체크포인트

마지막 업데이트: 2026-03-31

## 구현 상태: Phase 1~3 완료

### Phase 1: 순수 코어 — 완료
- [x] Next.js + Tailwind + 다크 테마 셋업
- [x] Vitest 설정
- [x] `types/route.ts` — Waypoint, Route, AppState 타입
- [x] `lib/geo.ts` — Haversine 거리 계산
- [x] `lib/gpx.ts` — GPX 파싱/생성
- [x] `lib/colors.ts` — 6색 팔레트
- [x] `lib/RouteContext.tsx` — reducer + localStorage 저장/복원
- [x] `lib/ToastContext.tsx` — 토스트 상태 관리
- [x] 테스트: geo.test.ts, gpx.test.ts, routeReducer.test.ts (43개 통과)

### Phase 2: 지도 연동 — 완료
- [x] `NaverMap.tsx` — 지도 로딩 + loading/ready/error 상태
- [x] 클릭 → 웨이포인트 추가
- [x] 폴리라인 그리기 (활성 3px, 비활성 2px)
- [x] 웨이포인트 드래그 이동 / 우클릭·더블클릭 삭제
- [x] GPX UI 연동 — 파일 업로드/다운로드
- [x] fitBounds + 가져온 루트 활성 설정

### Phase 3: UI 마무리 — 완료
- [x] 거리 표시 (useMemo 파생 계산, 사이드바 표시)
- [x] 루트 이름 인라인 편집 (더블클릭 → input → Enter/blur)
- [x] Toast 연동 (에러/성공/정보 피드백)
- [x] Ctrl+Z / Cmd+Z 실행취소

## 최근 수정사항 (2026-03-31)

### routeReducer 버그 3건 수정
1. **UNDO 로직** — `slice(0, -1)` 대신 `findLastIndex`로 좌표 매칭하여 정확한 waypoint 제거. 멀티루트 시나리오에서의 데이터 손실 방지.
2. **loadFromStorage 스키마 검증** — `isValidRoute`/`isValidWaypoint` 검증 함수 추가. 오염된 localStorage 데이터 필터링, 전체 오염 시 초기 상태 폴백.
3. **activeRouteId 유효성 검증** — `SET_ACTIVE`에서 존재하지 않는 routeId 무시. `loadFromStorage`에서도 activeRouteId가 실제 루트에 존재하는지 확인.

## 남은 작업

- [ ] NCP 클라이언트 ID 발급 확인 및 환경변수 설정
- [ ] Vercel 배포 및 NCP 도메인 등록 (localhost, *.vercel.app, 프로덕션)
- [ ] 실제 브라우저 QA 테스트

## v2 고려사항 (스코프 외)

- 도로 스냅 (Directions API)
- 모바일 반응형 (사이드바 → 하단 시트)
- 고도 프로필 차트
- 경로 공유 (URL/링크)
