# fieldNote 디자인 세션 (2026-03-31)

## 프로젝트 요약
네이버 지도 위에서 경로를 클릭으로 그리고, GPX 파일로 내보내기/가져오기하는 웹 도구.

## 핵심 결정사항
- **기술 스택:** Next.js + 네이버 지도 API v3 (NCP)
- **아키텍처:** 서버 없는 클라이언트 전용, Vercel 정적 배포
- **범위:** 순수 경로 그리기 도구 (부동산 기능 제외)
- **핵심 기능:** 경로 그리기, 여러 경로 색상별 관리, 거리/시간 표시, GPX 내보내기/가져오기

## 디자인 목업 (선택 대기)
| 파일 | 스타일 | 특징 |
|------|--------|------|
| `variant-A-light-floating.png` | 라이트 모드 | 플로팅 카드, 지도 최대 노출 |
| `variant-B-dark-sidebar.png` | 다크 모드 | 왼쪽 사이드바, imjanglog 유사 |
| `variant-C-dark-right-panel.png` | 다크 모드 | 우측 패널 + 하단 상태바, 다중 경로 강조 |

## 기술 조사
- 네이버 지도 API v3: DrawingManager, GPX 데이터 레이어 내장
- 기존 GPX 에디터(gpx.studio 등)는 전부 OSM 기반 → 한국 지도 약함 → 빈 자리
- 참고: doojinkang/map_polyline (네이버 지도용 편집 가능 폴리라인)

## 참고 사이트
- https://imjanglog.com/my-route-detail?route_id=312

## 다음 단계
1. 친구에게 목업 보여주고 디자인 방향 결정
2. `/office-hours` 재개 → 디자인 문서 완성
3. `/plan-eng-review` → 구현 계획 수립
