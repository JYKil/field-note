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
      <div className="px-4 py-8 text-center text-sm text-muted">
        루트가 없습니다
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
