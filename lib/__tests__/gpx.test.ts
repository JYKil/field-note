// @vitest-environment jsdom

import { describe, it, expect, vi, beforeAll } from "vitest";
import { parseGpx, generateGpx } from "@/lib/gpx";

// jsdom에서 crypto.randomUUID가 없을 수 있으므로 mock
beforeAll(() => {
  let counter = 0;
  if (!globalThis.crypto?.randomUUID) {
    vi.stubGlobal("crypto", {
      ...globalThis.crypto,
      randomUUID: () => `mock-uuid-${++counter}`,
    });
  }
});

// 테스트용 GPX XML 생성 헬퍼
function makeGpx(tracks: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
${tracks}
</gpx>`;
}

describe("parseGpx", () => {
  it("단일 트랙 파싱", () => {
    const xml = makeGpx(`
      <trk>
        <name>테스트 루트</name>
        <trkseg>
          <trkpt lat="37.5665" lon="126.978"><ele>30</ele></trkpt>
          <trkpt lat="37.57" lon="126.98"><ele>35</ele></trkpt>
        </trkseg>
      </trk>
    `);

    const { routes, warnings } = parseGpx(xml);

    expect(routes).toHaveLength(1);
    expect(routes[0].name).toBe("테스트 루트");
    expect(routes[0].waypoints).toHaveLength(2);
    expect(routes[0].waypoints[0].lat).toBe(37.5665);
    expect(routes[0].waypoints[0].lng).toBe(126.978);
    expect(warnings).toHaveLength(0);
  });

  it("복수 트랙 파싱", () => {
    const xml = makeGpx(`
      <trk>
        <name>루트 A</name>
        <trkseg>
          <trkpt lat="37.0" lon="127.0"></trkpt>
        </trkseg>
      </trk>
      <trk>
        <name>루트 B</name>
        <trkseg>
          <trkpt lat="38.0" lon="128.0"></trkpt>
        </trkseg>
      </trk>
    `);

    const { routes } = parseGpx(xml);

    expect(routes).toHaveLength(2);
    expect(routes[0].name).toBe("루트 A");
    expect(routes[1].name).toBe("루트 B");
  });

  it("ele, time 값 보존", () => {
    const xml = makeGpx(`
      <trk>
        <name>시간 포함</name>
        <trkseg>
          <trkpt lat="37.5" lon="127.0">
            <ele>100.5</ele>
            <time>2024-01-01T09:00:00Z</time>
          </trkpt>
        </trkseg>
      </trk>
    `);

    const { routes } = parseGpx(xml);
    const wp = routes[0].waypoints[0];

    expect(wp.ele).toBe(100.5);
    expect(wp.time).toBe("2024-01-01T09:00:00Z");
  });

  it("잘못된 XML → 에러", () => {
    expect(() => parseGpx("<<<not xml>>>")).toThrow("잘못된 GPX 파일입니다");
  });

  it("빈 경로(트랙 없음) → 에러", () => {
    const xml = makeGpx("");
    expect(() => parseGpx(xml)).toThrow("유효한 경로가 없습니다");
  });

  it("좌표 범위 초과 포인트 무시", () => {
    const xml = makeGpx(`
      <trk>
        <name>범위 초과</name>
        <trkseg>
          <trkpt lat="37.5" lon="127.0"></trkpt>
          <trkpt lat="91" lon="127.0"></trkpt>
          <trkpt lat="37.5" lon="181"></trkpt>
        </trkseg>
      </trk>
    `);

    const { routes } = parseGpx(xml);
    // 범위 초과 2개 제외, 유효한 1개만 남음
    expect(routes[0].waypoints).toHaveLength(1);
  });

  it("1000+ 웨이포인트 시 경고 추가", () => {
    // 1001개 포인트 생성
    const points = Array.from({ length: 1001 }, (_, i) =>
      `<trkpt lat="${37 + i * 0.0001}" lon="127.0"></trkpt>`
    ).join("\n");

    const xml = makeGpx(`
      <trk>
        <name>대량 데이터</name>
        <trkseg>${points}</trkseg>
      </trk>
    `);

    const { routes, warnings } = parseGpx(xml);

    expect(routes[0].waypoints).toHaveLength(1001);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("1001개 포인트");
  });

  it("startColorIndex 반영", () => {
    const xml = makeGpx(`
      <trk>
        <name>색상 테스트</name>
        <trkseg>
          <trkpt lat="37.5" lon="127.0"></trkpt>
        </trkseg>
      </trk>
    `);

    const { routes: r0 } = parseGpx(xml, 0);
    const { routes: r2 } = parseGpx(xml, 2);

    // 색상 인덱스가 다르면 색상도 달라야 함
    expect(r0[0].color).not.toBe(r2[0].color);
  });
});

describe("generateGpx", () => {
  it("단일 루트 GPX 생성", () => {
    const xml = generateGpx([
      {
        id: "1",
        name: "테스트",
        color: "#FF0000",
        waypoints: [
          { lat: 37.5, lng: 127.0 },
          { lat: 37.6, lng: 127.1, ele: 50 },
        ],
      },
    ]);

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<name>테스트</name>");
    expect(xml).toContain('lat="37.5"');
    expect(xml).toContain('lon="127.0"');
    expect(xml).toContain("<ele>50</ele>");
  });

  it("복수 루트 GPX 생성", () => {
    const xml = generateGpx([
      {
        id: "1",
        name: "A",
        color: "#F00",
        waypoints: [{ lat: 37.0, lng: 127.0 }],
      },
      {
        id: "2",
        name: "B",
        color: "#0F0",
        waypoints: [{ lat: 38.0, lng: 128.0 }],
      },
    ]);

    // trk 태그가 2개 있어야 함
    const trkCount = (xml.match(/<trk>/g) || []).length;
    expect(trkCount).toBe(2);
  });

  it("빈 배열이면 트랙 없는 GPX", () => {
    const xml = generateGpx([]);

    expect(xml).toContain("<gpx");
    expect(xml).toContain("</gpx>");
    expect(xml).not.toContain("<trk>");
  });

  it("특수문자 이스케이프 (& < > 등)", () => {
    const xml = generateGpx([
      {
        id: "1",
        name: "A & B < C > D",
        color: "#F00",
        waypoints: [{ lat: 37.0, lng: 127.0 }],
      },
    ]);

    expect(xml).toContain("A &amp; B &lt; C &gt; D");
    expect(xml).not.toContain("A & B");
  });

  it("time 필드 포함 시 출력", () => {
    const xml = generateGpx([
      {
        id: "1",
        name: "시간 포함",
        color: "#F00",
        waypoints: [
          { lat: 37.0, lng: 127.0, time: "2024-01-01T09:00:00Z" },
        ],
      },
    ]);

    expect(xml).toContain("<time>2024-01-01T09:00:00Z</time>");
  });
});
