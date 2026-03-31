import type { Waypoint } from "@/types/route";

const EARTH_RADIUS = 6371000; // 미터

// 두 지점 간 거리 계산 (Haversine 공식)
export function haversineDistance(a: Waypoint, b: Waypoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}

// 웨이포인트 배열의 총 거리 계산
export function totalDistance(waypoints: Waypoint[]): number {
  let dist = 0;
  for (let i = 1; i < waypoints.length; i++) {
    dist += haversineDistance(waypoints[i - 1], waypoints[i]);
  }
  return dist;
}

// 거리 포맷 (m → km)
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
