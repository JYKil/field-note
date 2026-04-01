// 루트 색상 팔레트 (6색, 인덱스 모듈로 순환)
export const ROUTE_COLORS = [
  "#FF6B35", // 주황
  "#4DABF7", // 파랑
  "#51CF66", // 초록
  "#CC5DE8", // 보라
  "#FF6B6B", // 빨강
  "#FFD43B", // 노랑
] as const;

// 다크모드용 형광 색상 (CSS 필터 brightness(0.55) saturate(0.3) 적용 후에도 선명하게 보이도록)
export const ROUTE_COLORS_DARK = [
  "#FF6F00", // 형광 오렌지
  "#00E5FF", // 형광 시안
  "#00FF41", // 형광 그린
  "#E040FB", // 형광 마젠타
  "#FF1744", // 형광 레드
  "#FFEA00", // 형광 옐로
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
