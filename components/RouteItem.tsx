"use client";

import { useState, useRef, useMemo } from "react";
import type { Route } from "@/types/route";
import { totalDistance, formatDistance } from "@/lib/geo";
import { useRoutes } from "@/lib/RouteContext";

interface RouteItemProps {
  route: Route;
  isActive: boolean;
}

export default function RouteItem({ route, isActive }: RouteItemProps) {
  const { dispatch } = useRoutes();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(route.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const distance = useMemo(
    () => totalDistance(route.waypoints),
    [route.waypoints],
  );

  const handleDoubleClick = () => {
    setEditName(route.name);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== route.name) {
      dispatch({ type: "RENAME_ROUTE", routeId: route.id, name: trimmed });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") {
      setEditName(route.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
        isActive
          ? "bg-active ring-1 ring-zinc-700"
          : "hover:bg-zinc-800/50"
      }`}
      onClick={() => dispatch({ type: "SET_ACTIVE", routeId: route.id })}
    >
      {/* 색상 점 */}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: route.color }}
      />

      {/* 이름 + 거리 */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            className="w-full bg-zinc-700 text-zinc-100 text-sm px-1 py-0.5 rounded outline-none"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div onDoubleClick={handleDoubleClick}>
            <div className="text-sm font-medium truncate">{route.name}</div>
            <div className="text-xs text-muted">
              {route.waypoints.length === 0
                ? "포인트 없음"
                : formatDistance(distance)}
            </div>
          </div>
        )}
      </div>

      {/* 삭제 버튼 */}
      <button
        className="flex items-center justify-center w-8 h-8 min-w-[32px] text-zinc-500 hover:text-error hover:bg-zinc-700/50 rounded text-lg shrink-0 transition-colors cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: "REMOVE_ROUTE", routeId: route.id });
        }}
        title="루트 삭제"
        aria-label="루트 삭제"
      >
        ×
      </button>
    </div>
  );
}
