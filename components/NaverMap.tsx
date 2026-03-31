"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Script from "next/script";
import { useRoutes } from "@/lib/RouteContext";
import { useToast } from "@/lib/ToastContext";
import type { Waypoint } from "@/types/route";

type MapStatus = "loading" | "ready" | "error";

// naver.maps 타입 선언
declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => NMap;
        LatLng: new (lat: number, lng: number) => NLatLng;
        LatLngBounds: new (sw: NLatLng, ne: NLatLng) => NLatLngBounds;
        Polyline: new (opts: Record<string, unknown>) => NPolyline;
        Marker: new (opts: Record<string, unknown>) => NMarker;
        Event: {
          addListener: (
            instance: unknown,
            event: string,
            handler: (...args: unknown[]) => void,
          ) => unknown;
          removeListener: (listener: unknown) => void;
        };
        Position: { TOP_RIGHT: unknown };
      };
    };
  }
}

interface NLatLng {
  lat(): number;
  lng(): number;
}
interface NLatLngBounds {
  extend(latlng: NLatLng): NLatLngBounds;
}
interface NMap {
  setCenter(latlng: NLatLng): void;
  fitBounds(bounds: NLatLngBounds, padding?: Record<string, number>): void;
  getCenter(): NLatLng;
}
interface NPolyline {
  setMap(map: NMap | null): void;
  setPath(path: NLatLng[]): void;
  setOptions(opts: Record<string, unknown>): void;
  getPath(): { getArray(): NLatLng[] };
}
interface NMarker {
  setMap(map: NMap | null): void;
  setPosition(latlng: NLatLng): void;
  getPosition(): NLatLng;
  setIcon(icon: Record<string, unknown>): void;
}

// 마커 아이콘 생성
function makeMarkerIcon(color: string, size: number = 8) {
  return {
    content: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:1.5px solid white;cursor:pointer;"></div>`,
    anchor: { x: size / 2, y: size / 2 },
  };
}

export default function NaverMap() {
  const { state, dispatch } = useRoutes();
  const { showToast } = useToast();
  const [status, setStatus] = useState<MapStatus>("loading");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NMap | null>(null);

  // 폴리라인/마커 추적 (routeId → 객체들)
  const polylinesRef = useRef<Map<string, NPolyline>>(new Map());
  const markersRef = useRef<Map<string, NMarker[]>>(new Map());

  // 드래그 상태
  const draggingRef = useRef<{
    routeId: string;
    index: number;
    marker: NMarker;
  } | null>(null);

  const clientId = process.env.NEXT_PUBLIC_NCP_CLIENT_ID;

  // 지도 초기화
  const initMap = useCallback(() => {
    if (!mapContainerRef.current || !window.naver?.maps) return;
    try {
      const map = new window.naver.maps.Map(mapContainerRef.current, {
        center: new window.naver.maps.LatLng(37.5665, 126.978), // 서울 시청
        zoom: 14,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
      });
      mapRef.current = map;
      setStatus("ready");
    } catch {
      setStatus("error");
      showToast("지도 초기화 실패", "error");
    }
  }, [showToast]);

  // 지도 클릭 → 웨이포인트 추가
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    const listener = window.naver.maps.Event.addListener(
      map,
      "click",
      ((...args: unknown[]) => {
        const e = args[0] as { coord: NLatLng };
        const activeId = state.activeRouteId;
        if (!activeId) {
          showToast("루트를 먼저 선택하세요", "info");
          return;
        }
        const wp: Waypoint = {
          lat: e.coord.lat(),
          lng: e.coord.lng(),
        };
        dispatch({ type: "ADD_WAYPOINT", routeId: activeId, waypoint: wp });
      }),
    );

    return () => {
      window.naver.maps.Event.removeListener(listener);
    };
  }, [status, state.activeRouteId, dispatch, showToast]);

  // 루트 변경 → 폴리라인/마커 갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    const { maps } = window.naver;

    const currentRouteIds = new Set(state.routes.map((r) => r.id));

    // 삭제된 루트 정리
    for (const [id, polyline] of polylinesRef.current) {
      if (!currentRouteIds.has(id)) {
        polyline.setMap(null);
        polylinesRef.current.delete(id);
      }
    }
    for (const [id, markers] of markersRef.current) {
      if (!currentRouteIds.has(id)) {
        markers.forEach((m) => m.setMap(null));
        markersRef.current.delete(id);
      }
    }

    // 각 루트 업데이트
    for (const route of state.routes) {
      const isActive = route.id === state.activeRouteId;
      const path = route.waypoints.map(
        (wp) => new maps.LatLng(wp.lat, wp.lng),
      );

      // 폴리라인
      let polyline = polylinesRef.current.get(route.id);
      if (!polyline) {
        polyline = new maps.Polyline({
          map,
          path,
          strokeColor: route.color,
          strokeWeight: isActive ? 3.5 : 2.5,
          strokeOpacity: 1,
        });
        polylinesRef.current.set(route.id, polyline);
      } else {
        polyline.setPath(path);
        polyline.setOptions({
          strokeColor: route.color,
          strokeWeight: isActive ? 3.5 : 2.5,
          strokeOpacity: 1,
        });
      }

      // 마커
      const existingMarkers = markersRef.current.get(route.id) || [];

      // 필요한 것보다 많으면 제거
      while (existingMarkers.length > route.waypoints.length) {
        const m = existingMarkers.pop()!;
        m.setMap(null);
      }

      // 마커 업데이트/추가
      for (let i = 0; i < route.waypoints.length; i++) {
        const wp = route.waypoints[i];
        const pos = new maps.LatLng(wp.lat, wp.lng);

        if (i < existingMarkers.length) {
          existingMarkers[i].setPosition(pos);
          existingMarkers[i].setIcon(makeMarkerIcon(route.color, isActive ? 8 : 6));
        } else {
          const marker = new maps.Marker({
            map,
            position: pos,
            icon: makeMarkerIcon(route.color, isActive ? 8 : 6),
            draggable: isActive,
          });

          // 드래그 시작
          maps.Event.addListener(marker, "dragstart", () => {
            draggingRef.current = {
              routeId: route.id,
              index: i,
              marker,
            };
            marker.setIcon(makeMarkerIcon(route.color, 12));
          });

          // 드래그 종료
          maps.Event.addListener(marker, "dragend", () => {
            if (!draggingRef.current) return;
            const pos = marker.getPosition();
            dispatch({
              type: "MOVE_WAYPOINT",
              routeId: draggingRef.current.routeId,
              index: draggingRef.current.index,
              waypoint: { lat: pos.lat(), lng: pos.lng() },
            });
            marker.setIcon(makeMarkerIcon(route.color, 8));
            draggingRef.current = null;
          });

          // 우클릭/더블클릭 → 삭제
          const removeHandler = () => {
            dispatch({
              type: "REMOVE_WAYPOINT",
              routeId: route.id,
              index: i,
            });
          };
          maps.Event.addListener(marker, "rightclick", removeHandler);
          maps.Event.addListener(marker, "dblclick", removeHandler);

          existingMarkers.push(marker);
        }
      }

      markersRef.current.set(route.id, existingMarkers);
    }
  }, [state.routes, state.activeRouteId, status, dispatch]);

  // fitBounds 함수 (GPX import 후 호출용으로 노출)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    // import 시 마지막으로 추가된 루트들이 보이도록 fitBounds
    const activeRoute = state.routes.find(
      (r) => r.id === state.activeRouteId,
    );
    if (!activeRoute || activeRoute.waypoints.length === 0) return;

    // 첫 렌더링이 아닌 경우에만 (웨이포인트가 하나일 때만 센터 이동)
    if (activeRoute.waypoints.length === 1) {
      const wp = activeRoute.waypoints[0];
      map.setCenter(new window.naver.maps.LatLng(wp.lat, wp.lng));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.routes.length]);

  const handleRetry = () => {
    setStatus("loading");
    // 스크립트 리로드는 복잡하므로 페이지 리로드
    window.location.reload();
  };

  return (
    <div className="relative flex-1 h-full">
      {clientId && (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
          strategy="afterInteractive"
          onReady={initMap}
          onError={() => {
            setStatus("error");
            showToast("네이버 지도 로딩 실패", "error");
          }}
        />
      )}

      {/* 로딩 상태 */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      {/* 에러 상태 */}
      {(status === "error" || !clientId) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 gap-3">
          <p className="text-zinc-400 text-sm">
            {!clientId
              ? "NEXT_PUBLIC_NCP_CLIENT_ID 환경변수를 설정해주세요"
              : "지도를 불러올 수 없습니다"}
          </p>
          {clientId && (
            <button
              className="px-4 py-1.5 text-sm rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              onClick={handleRetry}
            >
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* 빈 상태 힌트 */}
      {status === "ready" &&
        state.routes.every((r) => r.waypoints.length === 0) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="bg-zinc-900/80 text-zinc-400 text-sm px-4 py-2 rounded-lg backdrop-blur">
              지도를 클릭해서 경로를 그려보세요 (Ctrl+Z: 취소)
            </div>
          </div>
        )}

      {/* 지도 컨테이너 */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
