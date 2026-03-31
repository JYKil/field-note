import type { Route, Waypoint } from "@/types/route";
import { getRouteColor } from "@/lib/colors";

// XML 특수문자 이스케이프
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// GPX 파일 파싱 → Route 배열 반환
export function parseGpx(
  xml: string,
  startColorIndex: number = 0,
): { routes: Route[]; warnings: string[] } {
  const warnings: string[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  // 파싱 에러 체크
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("잘못된 GPX 파일입니다");
  }

  const tracks = doc.querySelectorAll("trk");
  if (tracks.length === 0) {
    throw new Error("유효한 경로가 없습니다");
  }

  const routes: Route[] = [];
  let colorIdx = startColorIndex;

  tracks.forEach((trk) => {
    const nameEl = trk.querySelector("name");
    const name = nameEl?.textContent?.trim() || `루트 ${colorIdx + 1}`;
    const waypoints: Waypoint[] = [];

    // 모든 trkseg의 trkpt를 하나로 합침
    const points = trk.querySelectorAll("trkpt");
    points.forEach((pt) => {
      const lat = parseFloat(pt.getAttribute("lat") || "");
      const lng = parseFloat(pt.getAttribute("lon") || "");

      if (isNaN(lat) || isNaN(lng)) return;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      const wp: Waypoint = { lat, lng };

      const eleEl = pt.querySelector("ele");
      if (eleEl?.textContent) {
        const ele = parseFloat(eleEl.textContent);
        if (!isNaN(ele)) wp.ele = ele;
      }

      const timeEl = pt.querySelector("time");
      if (timeEl?.textContent) {
        wp.time = timeEl.textContent.trim();
      }

      waypoints.push(wp);
    });

    if (waypoints.length === 0) return;

    if (waypoints.length > 1000) {
      warnings.push(`"${name}": ${waypoints.length}개 포인트 (대량 데이터)`);
    }

    routes.push({
      id: crypto.randomUUID(),
      name,
      color: getRouteColor(colorIdx),
      waypoints,
    });
    colorIdx++;
  });

  if (routes.length === 0) {
    throw new Error("유효한 경로가 없습니다");
  }

  return { routes, warnings };
}

// Route 배열 → GPX XML 문자열 생성
export function generateGpx(routes: Route[]): string {
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  gpx += `<gpx version="1.1" creator="fieldNote" xmlns="http://www.topografix.com/GPX/1/1">\n`;

  for (const route of routes) {
    gpx += `  <trk>\n`;
    gpx += `    <name>${escapeXml(route.name)}</name>\n`;
    gpx += `    <trkseg>\n`;
    for (const wp of route.waypoints) {
      gpx += `      <trkpt lat="${wp.lat}" lon="${wp.lng}">`;
      if (wp.ele !== undefined) gpx += `<ele>${wp.ele}</ele>`;
      if (wp.time) gpx += `<time>${escapeXml(wp.time)}</time>`;
      gpx += `</trkpt>\n`;
    }
    gpx += `    </trkseg>\n`;
    gpx += `  </trk>\n`;
  }

  gpx += `</gpx>`;
  return gpx;
}
