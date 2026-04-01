// 루트 색상 팔레트 (6색, 인덱스 모듈로 순환)
export const ROUTE_COLORS = [
  "#FF6B35", // 주황
  "#4DABF7", // 파랑
  "#51CF66", // 초록
  "#CC5DE8", // 보라
  "#FF6B6B", // 빨강
  "#FFD43B", // 노랑
] as const;

// 다크모드용 보상 색상 (CSS 필터 brightness(0.55) saturate(0.3) 보상)
export const ROUTE_COLORS_DARK = [
  "#FFA050", // 주황 (밝게)
  "#7DC8FF", // 파랑 (밝게)
  "#7AFF8A", // 초록 (밝게)
  "#E08AFF", // 보라 (밝게)
  "#FF9090", // 빨강 (밝게)
  "#FFE870", // 노랑 (밝게)
] as const;

export function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

// 다크모드 시 CSS 필터 보상 색상 반환
export function getRouteColorForDisplay(color: string, darkMode: boolean): string {
  if (!darkMode) return color;
  const idx = ROUTE_COLORS.indexOf(color as (typeof ROUTE_COLORS)[number]);
  if (idx === -1) return color;
  return ROUTE_COLORS_DARK[idx];
}
