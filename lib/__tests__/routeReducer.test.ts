import { describe, it, expect } from "vitest";
import { routeReducer } from "@/lib/RouteContext";
import { ROUTE_COLORS } from "@/lib/colors";

function makeState(overrides = {}) {
  return {
    routes: [],
    activeRouteId: null,
    undoStack: [],
    ...overrides,
  };
}

describe("routeReducer", () => {
  describe("ADD_ROUTE", () => {
    it("새 루트 추가 + 활성 설정", () => {
      const state = makeState();
      const next = routeReducer(state, { type: "ADD_ROUTE" });
      expect(next.routes).toHaveLength(1);
      expect(next.routes[0].name).toBe("루트 1");
      expect(next.routes[0].color).toBe(ROUTE_COLORS[0]);
      expect(next.activeRouteId).toBe(next.routes[0].id);
    });

    it("7번째 루트는 색상 모듈로 순환", () => {
      let state = makeState();
      for (let i = 0; i < 7; i++) {
        state = routeReducer(state, { type: "ADD_ROUTE" });
      }
      expect(state.routes[6].color).toBe(ROUTE_COLORS[0]);
    });
  });

  describe("REMOVE_ROUTE", () => {
    it("루트 삭제", () => {
      let state = makeState();
      state = routeReducer(state, { type: "ADD_ROUTE" });
      const id = state.routes[0].id;
      state = routeReducer(state, { type: "REMOVE_ROUTE", routeId: id });
      expect(state.routes).toHaveLength(0);
      expect(state.activeRouteId).toBeNull();
    });

    it("활성 루트 삭제 시 첫 번째 루트로 전환", () => {
      let state = makeState();
      state = routeReducer(state, { type: "ADD_ROUTE" });
      state = routeReducer(state, { type: "ADD_ROUTE" });
      const firstId = state.routes[0].id;
      const secondId = state.routes[1].id;
      // 두 번째가 활성
      expect(state.activeRouteId).toBe(secondId);
      // 두 번째 삭제
      state = routeReducer(state, { type: "REMOVE_ROUTE", routeId: secondId });
      expect(state.activeRouteId).toBe(firstId);
    });
  });

  describe("ADD_WAYPOINT", () => {
    it("활성 루트에 웨이포인트 추가", () => {
      let state = makeState();
      state = routeReducer(state, { type: "ADD_ROUTE" });
      const id = state.routes[0].id;
      const wp = { lat: 37.5, lng: 127 };
      state = routeReducer(state, {
        type: "ADD_WAYPOINT",
        routeId: id,
        waypoint: wp,
      });
      expect(state.routes[0].waypoints).toHaveLength(1);
      expect(state.routes[0].waypoints[0]).toEqual(wp);
    });

    it("undo 스택에 추가됨", () => {
      let state = makeState();
      state = routeReducer(state, { type: "ADD_ROUTE" });
      const id = state.routes[0].id;
      state = routeReducer(state, {
        type: "ADD_WAYPOINT",
        routeId: id,
        waypoint: { lat: 37.5, lng: 127 },
      });
      expect(state.undoStack).toHaveLength(1);
    });
  });

  describe("MOVE_WAYPOINT", () => {
    it("웨이포인트 위치 변경", () => {
      let state = makeState();
      state = routeReducer(state, { type: "ADD_ROUTE" });
      const id = state.routes[0].id;
      state = routeReducer(state, {
        type: "ADD_WAYPOINT",
        routeId: id,
        waypoint: { lat: 37.5, lng: 127 },
      });
      state = routeReducer(state, {
        type: "MOVE_WAYPOINT",
        routeId: id,
        index: 0,
        waypoint: { lat: 38, lng: 128 },
      });
      expect(state.routes[0].waypoints[0].lat).toBe(38);
    });
  });

  describe("REMOVE_WAYPOINT", () => {
    it("웨이포인트 삭제", () => {
      let state = makeState();
      state = routeReducer(state, { type: "ADD_ROUTE" });
      const id = state.routes[0].id;
      state = routeReducer(state, {
        type: "ADD_WAYPOINT",
        routeId: id,
        waypoint: { lat: 37.5, lng: 127 },
      });
      state = routeReducer(state, {
        type: "REMOVE_WAYPOINT",
        routeId: id,
        index: 0,
      });
      expect(state.routes[0].waypoints).toHaveLength(0);
    });
  });

  describe("RENAME_ROUTE", () => {
    it("이름 변경", () => {
      let state = makeState();
      state = routeReducer(state, { type: "ADD_ROUTE" });
      const id = state.routes[0].id;
      state = routeReducer(state, {
        type: "RENAME_ROUTE",
        routeId: id,
        name: "산책 코스",
      });
      expect(state.routes[0].name).toBe("산책 코스");
    });
  });

  describe("UNDO", () => {
    it("마지막 웨이포인트 삭제", () => {
      let state = makeState();
      state = routeReducer(state, { type: "ADD_ROUTE" });
      const id = state.routes[0].id;
      state = routeReducer(state, {
        type: "ADD_WAYPOINT",
        routeId: id,
        waypoint: { lat: 37.5, lng: 127 },
      });
      state = routeReducer(state, {
        type: "ADD_WAYPOINT",
        routeId: id,
        waypoint: { lat: 38, lng: 128 },
      });
      state = routeReducer(state, { type: "UNDO" });
      expect(state.routes[0].waypoints).toHaveLength(1);
      expect(state.undoStack).toHaveLength(1);
    });

    it("빈 스택이면 변경 없음", () => {
      const state = makeState();
      const next = routeReducer(state, { type: "UNDO" });
      expect(next).toBe(state);
    });
  });

  describe("IMPORT_ROUTES", () => {
    it("기존 루트에 추가 + 마지막 루트 활성", () => {
      let state = makeState();
      state = routeReducer(state, { type: "ADD_ROUTE" });
      const importedRoutes = [
        { id: "imp-1", name: "가져온 루트", color: "#4DABF7", waypoints: [{ lat: 37, lng: 127 }] },
      ];
      state = routeReducer(state, {
        type: "IMPORT_ROUTES",
        routes: importedRoutes,
      });
      expect(state.routes).toHaveLength(2);
      expect(state.activeRouteId).toBe("imp-1");
    });
  });
});
