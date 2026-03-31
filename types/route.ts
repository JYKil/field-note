export interface Waypoint {
  lat: number;
  lng: number;
  ele?: number;
  time?: string;
}

export interface Route {
  id: string;
  name: string;
  color: string;
  waypoints: Waypoint[];
}

export interface AppState {
  routes: Route[];
  activeRouteId: string | null;
}
