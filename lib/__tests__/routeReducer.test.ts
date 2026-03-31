import { describe, it, expect, vi, beforeAll } from "vitest";
import { routeReducer } from "@/lib/RouteContext";
import { ROUTE_COLORS, getRouteColor } from "@/lib/colors";
import type { Waypoint, Route, AppState } from "@/types/route";

// crypto.randomUUID mock — 매 호출마다 고유 ID 반환
let uuidCounter = 0;
beforeAll(() => {
  uuidCounter = 0;
  vi.stubGlobal("crypto", {
    ...globalThis.crypto,
    randomUUID: () => `uuid-${++uuidCounter}`,
  });
});

// StateWithUndo 타입 (RouteContext에서 export하지 않으므로 인라인 정의)
interface StateWithUndo extends AppState {
  undoStack: { routeId: string; waypoint: Waypoint }[];
}

// 빈 초기 상태 헬퍼
function emptyState(): StateWithUndo {
  return {
    routes: [],
    activeRouteId: null,
    undoStack: [],
  };
}

// 루트 1개 있는 상태 헬퍼
function stateWithOneRoute(
  id = "route-1",
  waypoints: Waypoint[] = [],
): StateWithUndo {
  return {
    routes: [
      { id, name: "루트 1", color: getRouteColor(0), waypoints },
    ],
    activeRouteId: id,
    undoStack: [],
  };
}

describe("ADD_ROUTE", () => {
  it("새 루트 추가 및 색상 자동 배정", () => {
    const state = emptyState();
    const next = routeReducer(state, { type: "ADD_ROUTE" });

    expect(next.routes).toHaveLength(1);
    expect(next.routes[0].color).toBe(ROUTE_COLORS[0]);
    expect(next.routes[0].name).toBe("루트 1");
    // ID가 존재하는지만 확인
    expect(next.routes[0].id).toBeTruthy();
  });

  it("활성 루트가 새로 추가된 루트로 설정됨", () => {
    const state = emptyState();
    const next = routeReducer(state, { type: "ADD_ROUTE" });

    expect(next.activeRouteId).toBe(next.routes[0].id);
  });

  it("7번째 루트 — 색상 모듈로 순환", () => {
    // 루트 6개가 이미 있는 상태
    let state: StateWithUndo = emptyState();
    for (let i = 0; i < 6; i++) {
      state = routeReducer(state, { type: "ADD_ROUTE" });
    }

    expect(state.routes).toHaveLength(6);

    // 7번째 추가
    const next = routeReducer(state, { type: "ADD_ROUTE" });
    // 인덱스 6 % 6 = 0 → 첫 번째 색상과 동일
    expect(next.routes[6].color).toBe(ROUTE_COLORS[0]);
  });
});

describe("REMOVE_ROUTE", () => {
  it("활성 루트 삭제 시 첫 번째 루트로 전환", () => {
    const state: StateWithUndo = {
      routes: [
        { id: "a", name: "A", color: "#F00", waypoints: [] },
        { id: "b", name: "B", color: "#0F0", waypoints: [] },
      ],
      activeRouteId: "a",
      undoStack: [],
    };

    const next = routeReducer(state, { type: "REMOVE_ROUTE", routeId: "a" });

    expect(next.routes).toHaveLength(1);
    expect(next.activeRouteId).toBe("b");
  });

  it("마지막 루트 삭제 시 activeRouteId가 null", () => {
    const state = stateWithOneRoute("only");
    const next = routeReducer(state, { type: "REMOVE_ROUTE", routeId: "only" });

    expect(next.routes).toHaveLength(0);
    expect(next.activeRouteId).toBeNull();
  });

  it("삭제된 루트의 undoStack 항목도 제거", () => {
    const wp: Waypoint = { lat: 37, lng: 127 };
    const state: StateWithUndo = {
      routes: [
        { id: "a", name: "A", color: "#F00", waypoints: [wp] },
        { id: "b", name: "B", color: "#0F0", waypoints: [] },
      ],
      activeRouteId: "a",
      undoStack: [{ routeId: "a", waypoint: wp }],
    };

    const next = routeReducer(state, { type: "REMOVE_ROUTE", routeId: "a" });
    expect(next.undoStack).toHaveLength(0);
  });
});

describe("SET_ACTIVE", () => {
  it("활성 루트 정상 전환", () => {
    const state: StateWithUndo = {
      routes: [
        { id: "a", name: "A", color: "#F00", waypoints: [] },
        { id: "b", name: "B", color: "#0F0", waypoints: [] },
      ],
      activeRouteId: "a",
      undoStack: [],
    };

    const next = routeReducer(state, { type: "SET_ACTIVE", routeId: "b" });
    expect(next.activeRouteId).toBe("b");
  });

  it("null 설정 가능", () => {
    const state = stateWithOneRoute();
    const next = routeReducer(state, { type: "SET_ACTIVE", routeId: null });
    expect(next.activeRouteId).toBeNull();
  });
});

describe("ADD_WAYPOINT", () => {
  it("활성 루트에 웨이포인트 추가", () => {
    const state = stateWithOneRoute("r1");
    const wp: Waypoint = { lat: 37.5, lng: 127.0 };

    const next = routeReducer(state, {
      type: "ADD_WAYPOINT",
      routeId: "r1",
      waypoint: wp,
    });

    expect(next.routes[0].waypoints).toHaveLength(1);
    expect(next.routes[0].waypoints[0]).toEqual(wp);
  });

  it("undoStack에 기록됨", () => {
    const state = stateWithOneRoute("r1");
    const wp: Waypoint = { lat: 37.5, lng: 127.0 };

    const next = routeReducer(state, {
      type: "ADD_WAYPOINT",
      routeId: "r1",
      waypoint: wp,
    });

    expect(next.undoStack).toHaveLength(1);
    expect(next.undoStack[0]).toEqual({ routeId: "r1", waypoint: wp });
  });
});

describe("MOVE_WAYPOINT", () => {
  it("위치 변경 확인", () => {
    const original: Waypoint = { lat: 37.0, lng: 127.0 };
    const moved: Waypoint = { lat: 38.0, lng: 128.0 };
    const state = stateWithOneRoute("r1", [original]);

    const next = routeReducer(state, {
      type: "MOVE_WAYPOINT",
      routeId: "r1",
      index: 0,
      waypoint: moved,
    });

    expect(next.routes[0].waypoints[0]).toEqual(moved);
  });
});

describe("REMOVE_WAYPOINT", () => {
  it("웨이포인트 삭제 확인", () => {
    const wps: Waypoint[] = [
      { lat: 37.0, lng: 127.0 },
      { lat: 38.0, lng: 128.0 },
    ];
    const state = stateWithOneRoute("r1", wps);

    const next = routeReducer(state, {
      type: "REMOVE_WAYPOINT",
      routeId: "r1",
      index: 0,
    });

    expect(next.routes[0].waypoints).toHaveLength(1);
    expect(next.routes[0].waypoints[0].lat).toBe(38.0);
  });
});

describe("RENAME_ROUTE", () => {
  it("이름 변경", () => {
    const state = stateWithOneRoute("r1");
    const next = routeReducer(state, {
      type: "RENAME_ROUTE",
      routeId: "r1",
      name: "새 이름",
    });

    expect(next.routes[0].name).toBe("새 이름");
  });
});

describe("IMPORT_ROUTES", () => {
  it("루트 추가 및 마지막 임포트된 루트 활성화", () => {
    const state = stateWithOneRoute("existing");
    const imported: Route[] = [
      { id: "imp-1", name: "가져온 1", color: "#F00", waypoints: [] },
      { id: "imp-2", name: "가져온 2", color: "#0F0", waypoints: [] },
    ];

    const next = routeReducer(state, {
      type: "IMPORT_ROUTES",
      routes: imported,
    });

    expect(next.routes).toHaveLength(3);
    // 마지막 임포트된 루트가 활성화
    expect(next.activeRouteId).toBe("imp-2");
  });

  it("빈 배열 임포트 시 activeRouteId 유지", () => {
    const state = stateWithOneRoute("existing");

    const next = routeReducer(state, {
      type: "IMPORT_ROUTES",
      routes: [],
    });

    expect(next.routes).toHaveLength(1);
    expect(next.activeRouteId).toBe("existing");
  });
});

describe("UNDO", () => {
  it("마지막 웨이포인트 제거", () => {
    const wp1: Waypoint = { lat: 37.0, lng: 127.0 };
    const wp2: Waypoint = { lat: 38.0, lng: 128.0 };

    const state: StateWithUndo = {
      routes: [
        { id: "r1", name: "루트", color: "#F00", waypoints: [wp1, wp2] },
      ],
      activeRouteId: "r1",
      undoStack: [
        { routeId: "r1", waypoint: wp1 },
        { routeId: "r1", waypoint: wp2 },
      ],
    };

    const next = routeReducer(state, { type: "UNDO" });

    // 마지막 웨이포인트(wp2) 제거됨
    expect(next.routes[0].waypoints).toHaveLength(1);
    expect(next.routes[0].waypoints[0]).toEqual(wp1);
    expect(next.undoStack).toHaveLength(1);
  });

  it("빈 undoStack이면 상태 불변", () => {
    const state = stateWithOneRoute("r1");
    const next = routeReducer(state, { type: "UNDO" });

    // 참조 동일성 (같은 객체)
    expect(next).toBe(state);
  });

  it("멀티루트에서 올바른 루트의 웨이포인트만 제거", () => {
    const wpA: Waypoint = { lat: 37.0, lng: 127.0 };
    const wpB: Waypoint = { lat: 38.0, lng: 128.0 };

    const state: StateWithUndo = {
      routes: [
        { id: "a", name: "A", color: "#F00", waypoints: [wpA] },
        { id: "b", name: "B", color: "#0F0", waypoints: [wpB] },
      ],
      activeRouteId: "b",
      undoStack: [
        { routeId: "a", waypoint: wpA },
        { routeId: "b", waypoint: wpB },
      ],
    };

    // UNDO → B의 wpB 제거
    const next = routeReducer(state, { type: "UNDO" });
    expect(next.routes[0].waypoints).toHaveLength(1); // A는 그대로
    expect(next.routes[1].waypoints).toHaveLength(0); // B에서 제거

    // UNDO → A의 wpA 제거
    const next2 = routeReducer(next, { type: "UNDO" });
    expect(next2.routes[0].waypoints).toHaveLength(0);
    expect(next2.routes[1].waypoints).toHaveLength(0);
  });

  it("중간 waypoint 삭제 후 UNDO가 정확한 wp를 제거", () => {
    const wp1: Waypoint = { lat: 37.0, lng: 127.0 };
    const wp2: Waypoint = { lat: 38.0, lng: 128.0 };
    const wp3: Waypoint = { lat: 39.0, lng: 129.0 };

    // wp1, wp2, wp3 순서로 추가된 상태
    let state: StateWithUndo = {
      routes: [
        { id: "r1", name: "루트", color: "#F00", waypoints: [wp1, wp2, wp3] },
      ],
      activeRouteId: "r1",
      undoStack: [
        { routeId: "r1", waypoint: wp1 },
        { routeId: "r1", waypoint: wp2 },
        { routeId: "r1", waypoint: wp3 },
      ],
    };

    // wp2(index 1)를 REMOVE_WAYPOINT으로 삭제 → [wp1, wp3]
    state = routeReducer(state, {
      type: "REMOVE_WAYPOINT",
      routeId: "r1",
      index: 1,
    });
    expect(state.routes[0].waypoints).toEqual([wp1, wp3]);

    // UNDO → undoStack 마지막은 wp3, 좌표 매칭으로 wp3 제거 → [wp1]
    const next = routeReducer(state, { type: "UNDO" });
    expect(next.routes[0].waypoints).toEqual([wp1]);
  });
});

describe("SET_ACTIVE 유효성 검증", () => {
  it("존재하지 않는 routeId로 SET_ACTIVE 시 상태 불변", () => {
    const state = stateWithOneRoute("r1");
    const next = routeReducer(state, {
      type: "SET_ACTIVE",
      routeId: "non-existent",
    });
    expect(next).toBe(state);
    expect(next.activeRouteId).toBe("r1");
  });
});

describe("LOAD_STATE", () => {
  it("상태 복원 및 undoStack 초기화", () => {
    const currentState: StateWithUndo = {
      routes: [],
      activeRouteId: null,
      undoStack: [{ routeId: "x", waypoint: { lat: 0, lng: 0 } }],
    };

    const loadedState: AppState = {
      routes: [
        { id: "loaded-1", name: "불러온 루트", color: "#F00", waypoints: [] },
      ],
      activeRouteId: "loaded-1",
    };

    const next = routeReducer(currentState, {
      type: "LOAD_STATE",
      state: loadedState,
    });

    expect(next.routes).toHaveLength(1);
    expect(next.routes[0].id).toBe("loaded-1");
    expect(next.activeRouteId).toBe("loaded-1");
    // undoStack이 비어 있어야 함
    expect(next.undoStack).toHaveLength(0);
  });
});
