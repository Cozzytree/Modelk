export interface ShapeParams {
  x: number;
  y: number;
  id: string;
  lineType?: "elbow" | "straight" | "curve";
  type:
    | "rect"
    | "sphere"
    | "polygon"
    | "text"
    | "line"
    | "pencil"
    | "image"
    | "others";
  xRadius?: number;
  yRadius?: number;
  angle?: number;
  pointTo?: string[];
  curvePoints?: { x: number; y: number }[];
  endTo?: string | null;
  startTo?: string | null;
  radius: number;
  isActive: boolean;
  width: number;
  height: number;
  maxX?: number;
  maxY?: number;
  minY?: number;
  minX?: number;
  points?: { x: number; y: number; offsetX?: number; offsetY?: number }[];
}
