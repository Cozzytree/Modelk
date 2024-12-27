import { ShapeParams } from "../canvasTypes";
import { renderText } from "../utils";

function drawArrows({
   ctx,
   end,
   start,
   arrowLength,
}: {
   arrowLength: number;
   end: { x: number; y: number };
   ctx: CanvasRenderingContext2D;
   start: { x: number; y: number };
}) {
   const angle = Math.atan2(end.y - start.y, end.x - start.x);

   // First side of the arrowhead
   ctx.moveTo(end.x, end.y);
   ctx.lineTo(
      end.x - arrowLength * Math.cos(angle - Math.PI / 6),
      end.y - arrowLength * Math.sin(angle - Math.PI / 6),
   );
   ctx.stroke();
   ctx.closePath();

   // Second side of the arrowhead
   ctx.beginPath();
   ctx.moveTo(end.x, end.y);
   ctx.lineTo(
      end.x - arrowLength * Math.cos(angle + Math.PI / 6),
      end.y - arrowLength * Math.sin(angle + Math.PI / 6),
   );
   ctx.stroke();
   ctx.closePath();
}

function lineDraw({
   line,
   headlen,
   context,
   tolerance = 6,
}: {
   line: ShapeParams;
   headlen: number;
   tolerance?: number;
   context: CanvasRenderingContext2D;
}) {
   const {
      curvePoints,
      borderColor,
      lineType,
      arrowLeft,
      arrowRight,
      radius = 0,
      lineWidth,
      dash,
   } = line;

   if (!curvePoints) return;

   context.beginPath();
   const path = new Path2D();
   const last = curvePoints.length - 1;
   if (lineType === "straight") {
      path.moveTo(curvePoints[0].x, curvePoints[0].y);
      for (let i = 1; i < curvePoints.length; i++) {
         path.lineTo(curvePoints[i].x, curvePoints[i].y);
      }
   } else if (lineType === "elbow") {
      // Initialize the path at the first point
      path.moveTo(curvePoints[0].x, curvePoints[0].y);

      // Loop through the curvePoints array to draw arcs
      for (let i = 1; i < curvePoints.length; i++) {
         const startPoint = curvePoints[i - 1];
         const endPoint = curvePoints[i];

         path.arcTo(
            startPoint.x,
            startPoint.y, // Start point of the arc
            endPoint.x,
            endPoint.y, // End point of the arc
            line.radius, // Radius of the arc
         );
      }
      path.lineTo(
         curvePoints[curvePoints.length - 1].x,
         curvePoints[curvePoints.length - 1].y,
      );
   } else {
      path.moveTo(curvePoints[0].x, curvePoints[0].y);
      const t = 0.8;

      for (let i = 1; i < curvePoints.length - 1; i++) {
         const cp1 = curvePoints[i];
         const cp2 = curvePoints[i + 1];
         const midPointX = (1 - t) * cp1.x + t * cp2.x;
         const midPointY = (1 - t) * cp1.y + t * cp2.y;
         path.quadraticCurveTo(cp1.x, cp1.y, midPointX, midPointY);
      }

      const secondToLastPoint = curvePoints[curvePoints.length - 2];
      const lastPoint = curvePoints[curvePoints.length - 1];
      const controlPointX = (1 - t) * secondToLastPoint.x + t * lastPoint.x;
      const controlPointY = (1 - t) * secondToLastPoint.y + t * lastPoint.y;

      path.quadraticCurveTo(
         controlPointX,
         controlPointY,
         lastPoint.x,
         lastPoint.y,
      );
   }
   context.strokeStyle = borderColor;
   context.lineWidth = lineWidth;
   context.setLineDash([0, 0]);

   context.stroke();
   context.closePath();

   if (arrowLeft) {
      drawArrows({
         start: {
            x: curvePoints[1].x,
            y: curvePoints[1].y,
         },
         end: {
            x: curvePoints[0].x,
            y: curvePoints[0].y,
         },
         arrowLength: headlen,
         ctx: context,
      });
   }
   if (arrowRight) {
      drawArrows({
         start: {
            x: curvePoints[last - 1].x,
            y: curvePoints[last - 1].y,
         },
         end: {
            x: curvePoints[last].x,
            y: curvePoints[last].y,
         },
         arrowLength: headlen,
         ctx: context,
      });
   }

   // Draw the path
   // return path;
   context.stroke(path);

   renderText({ context, shape: line, tolerance });
}

export { lineDraw };
