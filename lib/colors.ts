// 루트 색상 팔레트 (6색, 인덱스 모듈로 순환)
export const ROUTE_COLORS = [
  "#FF6B35", // 주황
  "#4DABF7", // 파랑
  "#51CF66", // 초록
  "#CC5DE8", // 보라
  "#FF6B6B", // 빨강
  "#FFD43B", // 노랑
] as const;

export function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}
