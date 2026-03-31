"use client";

import { useRoutes } from "@/lib/RouteContext";
import RouteItem from "./RouteItem";

export default function RouteList() {
  const { state } = useRoutes();

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
    </div>
  );
}
