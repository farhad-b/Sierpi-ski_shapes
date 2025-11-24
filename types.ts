export interface AppState {
  vertices: number;
  ratio: number;
  speed: number;
  pointSize: number;
  color: string;
  glow: boolean;
}

export const DEFAULT_STATE: AppState = {
  vertices: 3,
  ratio: 0.5,
  speed: 100, // points per frame
  pointSize: 1,
  color: '#60A5FA', // blue-400
  glow: false,
};

export interface Point {
  x: number;
  y: number;
}
