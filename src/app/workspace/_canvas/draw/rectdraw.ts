import { ShapeParams } from "../canvasTypes";
import { drawDotsAndRectActive, renderText } from "../utils";

export function rectDraw({
   rect,
   context,
   isActive,
   activeColor,
   tolerance = 6,
   massiveSelected,
}: {
   rect: ShapeParams;
   isActive: boolean;
   tolerance?: number;
   activeColor?: string;
   massiveSelected: boolean;
   context: CanvasRenderingContext2D;
}) {
   const {
      x,
      y,
      text,
      dash,
      font,
      width,
      height,
      radius,
      textSize,
      fillStyle,
      lineWidth,
      fontWeight,
      borderColor,
      strokeStyle,
      fontVarient,
      textPosition,
      allignVertical,
   } = rect;
   const path = new Path2D();
   context.beginPath();

   context.strokeStyle = borderColor;
   context.setLineDash(dash);
   context.lineWidth = lineWidth || 1;
   context.fillStyle = fillStyle || "transparent";

   path.moveTo(x + radius, y);
   path.lineTo(x + width - radius, y);

   path.arcTo(x + width, y, x + width, y + radius, radius);
   path.lineTo(x + width, y + height - radius);

   path.arcTo(x + width, y + height, x + width - radius, y + height, radius);
   path.lineTo(x + radius, y + height);
   path.arcTo(x, y + height, x, y + height - radius, radius);
   path.lineTo(x, y + radius);
   path.arcTo(x, y, x + radius, y, radius);

   context.fill(path);
   context.stroke(path);
   context.closePath();

   if (isActive && activeColor) {
      drawDotsAndRectActive({
         isMassiveSelected: massiveSelected,
         activeColor,
         tolerance,
         isActive,
         context,
         height,
         width,
         x,
         y,
      });
   }

   renderText({ context: context, shape: rect, tolerance });
}
