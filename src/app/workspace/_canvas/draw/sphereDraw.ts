import { ShapeParams } from "../canvasTypes";
import { drawDotsAndRectActive } from "../utils";

export const drawEllipse = ({
   ctx,
   shape,
   isActive,
   activeColor,
   tolerance = 6,
   isMassiveSelected,
}: {
   shape: ShapeParams;
   isActive?: boolean;
   tolerance?: number;
   activeColor: string;
   isMassiveSelected: boolean;
   ctx: CanvasRenderingContext2D;
}) => {
   const { x, y, width, height, xRadius, yRadius } = shape;
   ctx.beginPath();
   ctx.ellipse(x, y, xRadius ?? 0, yRadius ?? 0, 0, 0, Math.PI * 2);
   ctx.fillStyle = shape.fillStyle;
   ctx.fill();
   ctx.strokeStyle = shape.strokeStyle;
   ctx.lineWidth = shape.lineWidth;
   ctx.setLineDash(shape.dash);
   ctx.stroke();
   ctx.closePath();

   if (isActive && xRadius && yRadius) {
      drawDotsAndRectActive({
         width,
         height,
         isActive,
         tolerance,
         activeColor,
         context: ctx,
         y: y - yRadius,
         x: x - xRadius,
         isMassiveSelected,
      });
   }
};
