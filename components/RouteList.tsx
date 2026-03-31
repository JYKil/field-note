"use client";

import { useMemo } from "react";
import { useRoutes } from "@/lib/RouteContext";
import { totalDistance, formatDistance } from "@/lib/geo";
import RouteItem from "./RouteItem";

export default function RouteList() {
  const { state } = useRoutes();

  const totalDist = useMemo(
    () =>
      state.routes.reduce(
        (sum, route) => sum + totalDistance(route.waypoints),
        0,
      ),
    [state.routes],
  );

  if (state.routes.length === 0) {
    return (
      <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
          <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.553 2.776A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm text-muted">"+ 새 루트"로 경로를 시작하세요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-2">
      {state.routes.map((route) => (
        <RouteItem
          key={route.id}
          route={route}
          isActive={route.id === state.activeRouteId}
        />
      ))}
      {/* 총 합산 거리 + 단축키 안내 */}
      {state.routes.length > 1 && totalDist > 0 && (
        <div className="px-3 py-2 mt-1 border-t border-zinc-800 text-xs text-muted text-right">
          총 거리: {formatDistance(totalDist)}
        </div>
      )}
      <p className="text-[11px] text-muted text-right px-3 py-1">Ctrl+Z: 취소</p>
    </div>
  );
}
