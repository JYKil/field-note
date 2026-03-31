import { describe, it, expect } from "vitest";
import { haversineDistance, totalDistance, formatDistance } from "@/lib/geo";
import type { Waypoint } from "@/types/route";

describe("haversineDistance", () => {
  it("서울→부산 약 325km (오차 1% 이내)", () => {
    // 서울시청 좌표
    const seoul: Waypoint = { lat: 37.5665, lng: 126.978 };
    // 부산시청 좌표
    const busan: Waypoint = { lat: 35.1796, lng: 129.0756 };

    const dist = haversineDistance(seoul, busan);
    const expected = 325_000; // 약 325km
    const errorRate = Math.abs(dist - expected) / expected;

    expect(errorRate).toBeLessThan(0.01); // 1% 이내
  });

  it("같은 점이면 0m", () => {
    const point: Waypoint = { lat: 37.5665, lng: 126.978 };
    expect(haversineDistance(point, point)).toBe(0);
  });

  it("지구 반대편 — 최대 거리 약 20015km", () => {
    // 북극 → 남극
    const north: Waypoint = { lat: 90, lng: 0 };
    const south: Waypoint = { lat: -90, lng: 0 };

    const dist = haversineDistance(north, south);
    // 지구 반둘레 약 20015km
    const expected = Math.PI * 6371000;
    const errorRate = Math.abs(dist - expected) / expected;

    expect(errorRate).toBeLessThan(0.001);
  });
});

describe("totalDistance", () => {
  it("빈 배열이면 0m", () => {
    expect(totalDistance([])).toBe(0);
  });

  it("단일 점이면 0m", () => {
    const points: Waypoint[] = [{ lat: 37.5665, lng: 126.978 }];
    expect(totalDistance(points)).toBe(0);
  });

  it("다수 점 합산", () => {
    const a: Waypoint = { lat: 37.5665, lng: 126.978 };
    const b: Waypoint = { lat: 37.57, lng: 126.98 };
    const c: Waypoint = { lat: 37.575, lng: 126.985 };

    const expected =
      haversineDistance(a, b) + haversineDistance(b, c);

    expect(totalDistance([a, b, c])).toBeCloseTo(expected, 5);
  });
});

describe("formatDistance", () => {
  it("1000m 미만이면 'm' 단위 표시", () => {
    expect(formatDistance(500)).toBe("500m");
    expect(formatDistance(0)).toBe("0m");
    expect(formatDistance(999)).toBe("999m");
  });

  it("소수점은 반올림", () => {
    expect(formatDistance(123.7)).toBe("124m");
    expect(formatDistance(0.4)).toBe("0m");
  });

  it("1000m 이상이면 'km' 단위 표시 (소수점 1자리)", () => {
    expect(formatDistance(1000)).toBe("1.0km");
    expect(formatDistance(1500)).toBe("1.5km");
    expect(formatDistance(12345)).toBe("12.3km");
  });
});
