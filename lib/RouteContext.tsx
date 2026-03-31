"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { AppState, Route, Waypoint } from "@/types/route";
import { getRouteColor } from "@/lib/colors";

// --- Actions ---
type Action =
  | { type: "ADD_ROUTE" }
  | { type: "REMOVE_ROUTE"; routeId: string }
  | { type: "SET_ACTIVE"; routeId: string | null }
  | { type: "ADD_WAYPOINT"; routeId: string; waypoint: Waypoint }
  | { type: "MOVE_WAYPOINT"; routeId: string; index: number; waypoint: Waypoint }
  | { type: "REMOVE_WAYPOINT"; routeId: string; index: number }
  | { type: "RENAME_ROUTE"; routeId: string; name: string }
  | { type: "IMPORT_ROUTES"; routes: Route[] }
  | { type: "UNDO" }
  | { type: "LOAD_STATE"; state: AppState }
  | { type: "AUTO_START_ROUTE"; waypoint: Waypoint }
  | { type: "CLEAR_ALL" };

// --- Undo 스택 ---
interface StateWithUndo extends AppState {
  undoStack: { routeId: string; waypoint: Waypoint }[];
}

// --- 유틸 ---
function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}

function isValidWaypoint(wp: unknown): wp is Waypoint {
  return (
    typeof wp === "object" &&
    wp !== null &&
    typeof (wp as Waypoint).lat === "number" &&
    typeof (wp as Waypoint).lng === "number" &&
    isFinite((wp as Waypoint).lat) &&
    isFinite((wp as Waypoint).lng)
  );
}

function isValidRoute(r: unknown): r is Route {
  return (
    typeof r === "object" &&
    r !== null &&
    typeof (r as Route).id === "string" &&
    typeof (r as Route).name === "string" &&
    typeof (r as Route).color === "string" &&
    Array.isArray((r as Route).waypoints) &&
    (r as Route).waypoints.every(isValidWaypoint)
  );
}

// --- Reducer ---
export function routeReducer(
  state: StateWithUndo,
  action: Action,
): StateWithUndo {
  switch (action.type) {
    case "ADD_ROUTE": {
      const colorIndex = state.routes.length;
      const newRoute: Route = {
        id: crypto.randomUUID(),
        name: `루트 ${state.routes.length + 1}`,
        color: getRouteColor(colorIndex),
        waypoints: [],
      };
      return {
        ...state,
        routes: [...state.routes, newRoute],
        activeRouteId: newRoute.id,
      };
    }

    case "REMOVE_ROUTE": {
      const filtered = state.routes.filter((r) => r.id !== action.routeId);
      let activeRouteId = state.activeRouteId;
      if (activeRouteId === action.routeId) {
        activeRouteId = filtered.length > 0 ? filtered[0].id : null;
      }
      return {
        ...state,
        routes: filtered,
        activeRouteId,
        undoStack: state.undoStack.filter(
          (u) => u.routeId !== action.routeId,
        ),
      };
    }

    case "SET_ACTIVE": {
      // 존재하지 않는 routeId면 무시
      if (
        action.routeId !== null &&
        !state.routes.some((r) => r.id === action.routeId)
      ) {
        return state;
      }
      return { ...state, activeRouteId: action.routeId };
    }

    case "ADD_WAYPOINT": {
      return {
        ...state,
        routes: state.routes.map((r) =>
          r.id === action.routeId
            ? { ...r, waypoints: [...r.waypoints, action.waypoint] }
            : r,
        ),
        undoStack: [
          ...state.undoStack,
          { routeId: action.routeId, waypoint: action.waypoint },
        ],
      };
    }

    case "MOVE_WAYPOINT": {
      return {
        ...state,
        routes: state.routes.map((r) =>
          r.id === action.routeId
            ? {
                ...r,
                waypoints: r.waypoints.map((wp, i) =>
                  i === action.index ? action.waypoint : wp,
                ),
              }
            : r,
        ),
      };
    }

    case "REMOVE_WAYPOINT": {
      return {
        ...state,
        routes: state.routes.map((r) =>
          r.id === action.routeId
            ? {
                ...r,
                waypoints: r.waypoints.filter((_, i) => i !== action.index),
              }
            : r,
        ),
      };
    }

    case "RENAME_ROUTE": {
      return {
        ...state,
        routes: state.routes.map((r) =>
          r.id === action.routeId ? { ...r, name: action.name } : r,
        ),
      };
    }

    case "IMPORT_ROUTES": {
      const newRoutes = [...state.routes, ...action.routes];
      const lastImported = action.routes[action.routes.length - 1];
      return {
        ...state,
        routes: newRoutes,
        activeRouteId: lastImported?.id ?? state.activeRouteId,
      };
    }

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const last = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        routes: state.routes.map((r) => {
          if (r.id !== last.routeId) return r;
          // undoStack의 waypoint와 일치하는 마지막 항목을 찾아서 제거
          const idx = findLastIndex(
            r.waypoints,
            (wp) => wp.lat === last.waypoint.lat && wp.lng === last.waypoint.lng,
          );
          if (idx === -1) return r;
          return {
            ...r,
            waypoints: [...r.waypoints.slice(0, idx), ...r.waypoints.slice(idx + 1)],
          };
        }),
        undoStack: state.undoStack.slice(0, -1),
      };
    }

    case "LOAD_STATE":
      return { ...action.state, undoStack: [] };

    // 루트가 없을 때 맵 클릭 시 자동으로 루트 생성 + 첫 웨이포인트 추가
    case "AUTO_START_ROUTE": {
      const newRoute: Route = {
        id: crypto.randomUUID(),
        name: "루트 1",
        color: getRouteColor(0),
        waypoints: [action.waypoint],
      };
      return {
        ...state,
        routes: [newRoute],
        activeRouteId: newRoute.id,
        undoStack: [
          ...state.undoStack,
          { routeId: newRoute.id, waypoint: action.waypoint },
        ],
      };
    }

    case "CLEAR_ALL":
      return {
        routes: [],
        activeRouteId: null,
        undoStack: [],
      };

    default:
      return state;
  }
}

// --- 초기 상태 ---
function createInitialState(): StateWithUndo {
  const id = crypto.randomUUID();
  return {
    routes: [
      {
        id,
        name: "루트 1",
        color: getRouteColor(0),
        waypoints: [],
      },
    ],
    activeRouteId: id,
    undoStack: [],
  };
}

function loadFromStorage(): StateWithUndo | null {
  try {
    const raw = localStorage.getItem("fieldnote-state");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.routes)) return null;

    // 각 Route/Waypoint 구조 검증 — 유효하지 않은 루트는 필터링
    const validRoutes = parsed.routes.filter(isValidRoute);
    if (validRoutes.length === 0 && parsed.routes.length > 0) return null;

    // activeRouteId가 실제 루트에 존재하는지 검증
    const activeRouteId =
      typeof parsed.activeRouteId === "string" &&
      validRoutes.some((r: Route) => r.id === parsed.activeRouteId)
        ? parsed.activeRouteId
        : validRoutes.length > 0
          ? validRoutes[0].id
          : null;

    return { routes: validRoutes, activeRouteId, undoStack: [] };
  } catch {
    return null;
  }
}

// --- Context ---
const RouteContext = createContext<{
  state: StateWithUndo;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(routeReducer, null, () => {
    if (typeof window === "undefined") return createInitialState();
    return loadFromStorage() ?? createInitialState();
  });

  // localStorage 자동 저장 (디바운스 500ms)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const toSave: AppState = {
          routes: state.routes,
          activeRouteId: state.activeRouteId,
        };
        localStorage.setItem("fieldnote-state", JSON.stringify(toSave));
      } catch {
        // 용량 초과 등 — 무시
      }
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.routes, state.activeRouteId]);

  // Ctrl+Z / Cmd+Z 언두
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        // input/textarea에서는 브라우저 기본 undo 사용
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        dispatch({ type: "UNDO" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <RouteContext.Provider value={{ state, dispatch }}>
      {children}
    </RouteContext.Provider>
  );
}

export function useRoutes() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useRoutes must be used within RouteProvider");
  return ctx;
}
