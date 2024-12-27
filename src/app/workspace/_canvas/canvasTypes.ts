export type textPosition = "center" | "end" | "left" | "start" | "right";
export type verticalAllign = "top" | "bottom" | "center";
export type fontWeight = "normal" | "bold";
export type ResizeDirections =
   | "top-edge"
   | "left-edge"
   | "right-edge"
   | "bottom-edge"
   | "top-left"
   | "top-right"
   | "bottom-left"
   | "bottom-right";

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
   text?: string[];
   yRadius?: number;
   content?: string[];
   angle?: number;
   pointTo?: string[];
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
   curvePoints?: { x: number; y: number; offsetX?: number; offsetY?: number }[];

   textSize: number;
   textPosition?: textPosition;
   allignVertical?: verticalAllign;
   font: any;
   fontWeight: fontWeight;
   borderColor: string;
   lineWidth: number;
   fillStyle: string;
   strokeStyle: string;
   fontVarient: any;

   arrowLeft?: boolean;
   arrowRight?: boolean;
   // ctx.setLineDash([5, 5]); // 5px dash, 5px gap
   dash: [number, number];
}
