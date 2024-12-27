import { shapeTypes } from "@/lib/utils";
import { ShapeParams } from "../canvasTypes";
import { findSlope } from "../utilsFunc";
import { Mate } from "next/font/google";

interface Line {
   x: number;
   y: number;
   text: string[];
   radius: number;
   curvePoints: { x: number; y: number }[];
   lineType: "elbow" | "straight" | "curve";
   maxX: number;
   maxY: number;
   minX: number;
   minY: number;
}

export function lineResizeLogic({
   mouseX,
   mouseY,
   line,
   direction,
   index,
}: {
   mouseX: number;
   mouseY: number;
   line: Line;
   direction: "resizeStart" | "resizeEnd" | null;
   index: number;
}) {
   const { curvePoints, lineType } = line;
   if (direction == null) {
      if (line.lineType === "elbow") return;
      if (index >= 0 && index < curvePoints.length) {
         curvePoints[index] = { x: mouseX, y: mouseY };
      }
   } else if (direction === "resizeStart") {
      if (lineType === "elbow") {
         resizeforElbowLine({ line, mouseX, mouseY, direction: "start" });
      } else {
         line.curvePoints[0].x = mouseX;
         line.curvePoints[0].y = mouseY;
         if (mouseX > line.maxX) {
            line.maxX = mouseX;
         }
         if (mouseX < line.minX) {
            line.minX = mouseX;
         }
         if (mouseY > line.maxY) {
            line.maxY = mouseY;
         }
         if (mouseY < line.minY) {
            line.minY = mouseY;
         }
      }
   } else if (direction === "resizeEnd") {
      if (lineType === "elbow") {
         resizeforElbowLine({ line, mouseX, mouseY, direction: "end" });
      } else {
         line.curvePoints[line.curvePoints.length - 1].x = mouseX;
         if (Math.abs(line.curvePoints[0].y - mouseY) <= 10) {
            line.curvePoints[line.curvePoints.length - 1].y =
               line.curvePoints[0].y;
         } else line.curvePoints[line.curvePoints.length - 1].y = mouseY;
      }
   }
}

function resizeforElbowLine({
   line,
   mouseX,
   mouseY,
   direction,
}: {
   line: Line;
   mouseX: number;
   mouseY: number;
   direction: "start" | "end";
}) {
   const { curvePoints } = line;
   // Update the first point of the lineResize.curvePoints
   if (direction === "start") {
      line.curvePoints[0] = { x: mouseX, y: mouseY };
      line.curvePoints[1] = {
         x: curvePoints[curvePoints.length - 1].x,
         y: mouseY,
      };
   } else {
      line.curvePoints[curvePoints.length - 1] = { x: mouseX, y: mouseY };
      line.curvePoints[1] = {
         x: curvePoints[curvePoints.length - 1].x,
         y: curvePoints[0].y,
      };
   }
}

export function lineResizeWhenConnected({
   line,
   endShape,
   startShape,
   startEn = "start",
}: {
   line: ShapeParams;
   endShape: any;
   startShape: any;
   startEn: "start" | "end";
}) {
   const { curvePoints } = line;
   let sx, sy, swidth, sheight, ex, ey, ewidth, eheight;

   // values
   if (startShape.type === shapeTypes.circle) {
      sx = startShape.x - startShape.xRadius;
      sy = startShape.y - startShape.yRadius;
      swidth = startShape.xRadius * 2;
      sheight = startShape.yRadius * 2;
   } else {
      sx = startShape.x;
      sy = startShape.y;
      swidth = startShape.width;
      sheight = startShape.height;
   }

   if (line.lineType !== "elbow") return;
   if (endShape) {
      if (endShape.type === shapeTypes.circle) {
         ex = endShape.x - endShape.xRadius;
         ey = endShape.y - endShape.yRadius;
         ewidth = endShape.xRadius * 2;
         eheight = endShape.yRadius * 2;
      } else {
         ex = endShape.x;
         ey = endShape.y;
         ewidth = endShape.width;
         eheight = endShape.height;
      }

      // logic -------------
      const startYMidPoint = sy + sheight * 0.5;
      const startXMidPoint = sx + swidth * 0.5;
      const endXMidPoint = ex + ewidth * 0.5;
      const endYMidPoint = ey + eheight * 0.5;

      const horizontalCenter =
         sx + swidth / 2 > ex && sx + swidth / 2 < ex + ewidth;
      const horizontalLeft = sx + swidth / 2 < ex;
      const verticalMid =
         sy + sheight * 0.5 > ey && sy + sheight * 0.5 < ey + eheight;
      const verticalTop = sy + sheight * 0.5 < ey;
      // const verticalBottom = sy + sheight * 0.5 > ey + eheight;

      // const horizontalRight = sx + swidth / 2 < ex + ewidth;

      // start shape will move
      if (startEn == "start") {
         /* if start is less than end */
         if (startYMidPoint < ey) {
            ifStartShapeAbove({
               startS: startShape,
               start: {
                  x: sx,
                  y: sy,
                  width: swidth,
                  height: sheight,
                  midX: startXMidPoint,
                  midY: startYMidPoint,
               },
               end: {
                  x: ex,
                  y: ey,
                  width: ewidth,
                  height: eheight,
                  midX: endXMidPoint,
                  midY: endYMidPoint,
               },
               line: line,
            });
         } else if (startYMidPoint > ey && startYMidPoint < ey + eheight) {
            ifStartInMiddle({
               startS: startShape,
               line: line,
               start: {
                  x: sx,
                  y: sy,
                  width: swidth,
                  height: sheight,
                  midX: startXMidPoint,
                  midY: startYMidPoint,
               },
               end: {
                  x: ex,
                  y: ey,
                  width: ewidth,
                  height: eheight,
                  midX: endXMidPoint,
                  midY: endYMidPoint,
               },
            });
         } else {
            ifStartShapeBelow({
               startShape: startShape,
               start: {
                  x: sx,
                  y: sy,
                  width: swidth,
                  height: sheight,
                  midX: startXMidPoint,
                  midY: startYMidPoint,
               },
               end: {
                  x: ex,
                  y: ey,
                  width: ewidth,
                  height: eheight,
                  midX: endXMidPoint,
                  midY: endYMidPoint,
               },
               line: line,
            });
         }
      } else {
         if (startYMidPoint < ey) {
            ifEndShapeAbove({
               startS: startShape,
               start: {
                  height: sheight,
                  midY: startYMidPoint,
                  midX: startXMidPoint,
                  y: sy,
                  x: sx,
                  width: swidth,
               },
               end: {
                  height: eheight,
                  midY: endYMidPoint,
                  midX: endXMidPoint,
                  y: ey,
                  x: ex,
                  width: ewidth,
               },
               line,
            });
         } else if (endYMidPoint > sy && endYMidPoint < sy + sheight) {
            ifEndShaoeMid({
               startS: startShape,
               start: {
                  height: sheight,
                  midY: startYMidPoint,
                  midX: startXMidPoint,
                  y: sy,
                  x: sx,
                  width: swidth,
               },
               end: {
                  height: eheight,
                  midY: endYMidPoint,
                  midX: endXMidPoint,
                  y: ey,
                  x: ex,
                  width: ewidth,
               },
               line,
            });
         } else {
         }
      }
   } else if (endShape == null) {
      if (!line.curvePoints) return;
      const last = line.curvePoints[line.curvePoints.length - 1];
      const first = line.curvePoints[0];

      if (startEn === "start") {
         const { x, y } = getClosestPoints({
            rect: startShape,
            point: { x: last.x, y: last.y },
         });
         line.curvePoints[0] = { x, y };
         line.curvePoints[1] = {
            x: last.x,
            y,
         };
      } else {
         const { x, y } = getClosestPoints({
            rect: startShape,
            point: { x: first.x, y: first.y },
         });
         line.curvePoints[line.curvePoints.length - 1] = { x, y };
         line.curvePoints[1] = {
            x: first.x,
            y,
         };
      }
   }
}

const ifEndShapeAbove = ({
   startS,
   start,
   end,
   line,
}: {
   startS: ShapeParams;
   start: {
      midX: number;
      midY: number;
      x: number;
      y: number;
      width: number;
      height: number;
   };
   end: {
      midX: number;
      midY: number;
      x: number;
      y: number;
      width: number;
      height: number;
   };
   line: ShapeParams;
}) => {
   if (!line.curvePoints) return;
   let last;

   if (start.midX < end.x) {
      line.curvePoints.length = 3; // length
      last = line.curvePoints.length - 1;

      const d1 = Math.abs(end.x - start.midX);
      const d2 = Math.abs(end.y - start.midY);
      if (d1 > d2) {
         line.curvePoints[0] = { x: end.midX, y: end.y };
         line.curvePoints[1] = { x: end.midX, y: start.midY };
         line.curvePoints[last] = { x: start.x + end.width, y: start.midY };
      } else {
         line.curvePoints[0] = { x: end.x, y: end.midY };
         line.curvePoints[1] = { x: start.midX, y: end.midY };
         line.curvePoints[last] = { x: start.midX, y: start.y + start.height };
      }
   } else if (end.midX > start.x && end.midX < start.x + start.width) {
      if (Math.abs(start.midX - end.midX) <= 10) {
         line.curvePoints.length = 2;
         last = line.curvePoints.length - 1;

         startS.x = end.midX - start.width / 2;
         line.curvePoints[0] = { x: end.midX, y: end.y };
         line.curvePoints[last] = { x: end.midX, y: start.y + start.height };
      } else {
         line.curvePoints.length = 4;
         last = line.curvePoints.length - 1;

         const midY = (end.y - (start.y + start.height)) * 0.5;
         line.curvePoints[1] = { x: end.midX, y: end.y - midY };
         line.curvePoints[2] = { x: start.midX, y: end.y - midY };
         line.curvePoints[last] = { x: start.midX, y: start.y + start.height };
      }
   } else {
      line.curvePoints.length = 3;
      last = line.curvePoints.length - 1;

      const d1 = start.x - (end.x + end.height); // horizontal
      const d2 = end.midY - (start.y + start.height); // vertical

      if (d1 > d2) {
         line.curvePoints[0] = { x: end.x + end.width, y: end.midY };
         line.curvePoints[1] = { x: start.midX, y: end.midY };
         line.curvePoints[last] = { x: start.midX, y: start.y + start.height };
      } else {
         line.curvePoints[0] = { x: end.midX, y: end.y };
         line.curvePoints[1] = { x: end.midX, y: start.midY };
         line.curvePoints[last] = { x: start.x, y: start.midY };
      }
   }
};

const ifEndShaoeMid = ({
   startS,
   start,
   end,
   line,
}: {
   startS: ShapeParams;
   start: {
      midX: number;
      midY: number;
      x: number;
      y: number;
      width: number;
      height: number;
   };
   end: {
      midX: number;
      midY: number;
      x: number;
      y: number;
      width: number;
      height: number;
   };
   line: ShapeParams;
}) => {
   if (!line.curvePoints) return;
   let last;
   if (start.midX < end.x) {
      if (Math.abs(start.midY - end.midY) <= 10) {
         line.curvePoints.length = 2;
         last = line.curvePoints.length - 1;

         startS.y = end.midY - start.height * 0.5;

         line.curvePoints[0] = { x: end.x, y: end.midY };
         line.curvePoints[last] = { x: start.x + start.width, y: end.midY };
      } else {
         line.curvePoints.length = 4;
         last = line.curvePoints.length - 1;

         const midPointX = Math.abs((end.x - (start.x + start.width)) * 0.5);
         line.curvePoints[1] = { x: end.x - midPointX, y: end.midY };
         line.curvePoints[2] = { x: end.x - midPointX, y: start.midY };
         line.curvePoints[last] = { x: start.x + start.width, y: start.midY };
      }
   } else if (start.midX > end.x && start.midX < end.x + end.height) {
   } else {
      if (Math.abs(start.midY - end.midY) <= 10) {
      } else {
      }
   }
};

const ifStartShapeAbove = ({
   start,
   end,
   line,
   startS,
}: {
   startS: ShapeParams;
   start: {
      midX: number;
      midY: number;
      x: number;
      y: number;
      width: number;
      height: number;
   };
   end: {
      midX: number;
      midY: number;
      x: number;
      y: number;
      width: number;
      height: number;
   };
   line: ShapeParams;
}) => {
   if (!line.curvePoints) return;
   let last;
   if (start.midX < end.x) {
      /* if left */
      line.curvePoints.length = 3; // length
      last = line.curvePoints.length - 1;

      const d1 = Math.abs(end.x - start.midX);
      const d2 = Math.abs(end.y - start.midY);
      if (d1 > d2) {
         line.curvePoints[0] = { x: start.x + start.width, y: start.midY };
         line.curvePoints[1] = { x: end.midX, y: start.midY };
         line.curvePoints[last] = { x: end.midX, y: end.y };
      } else {
         line.curvePoints[0] = { x: start.midX, y: start.y + start.height };
         line.curvePoints[1] = { x: start.midX, y: end.midY };
         line.curvePoints[last] = { x: end.x, y: end.midY };
      }
   } else if (start.midX > end.x && start.midX < end.x + end.width) {
      /* if mid */
      if (Math.abs(start.midX - end.midX) < 10) {
         /* if start mid eq to endmid */
         line.curvePoints.length = 2;
         last = line.curvePoints.length - 1;

         startS.x = end.midX - start.width * 0.5;
         line.curvePoints[0] = { x: end.midX, y: start.y + start.height };
      } else {
         // start mid greater than end mid
         line.curvePoints.length = 4;
         last = line.curvePoints.length - 1;

         // first point
         line.curvePoints[0] = { x: start.midX, y: start.y + start.height };

         // mids
         const midPoint = (end.y - (start.y + start.height)) * 0.5;
         line.curvePoints[1] = { x: start.midX, y: end.y - midPoint };
         line.curvePoints[2] = {
            x: end.midX,
            y: end.y - midPoint,
         };
      }

      // last pont
      line.curvePoints[last] = { x: end.midX, y: end.y };
   } else {
      /* if right */
      line.curvePoints.length = 3; // length
      last = line.curvePoints.length - 1;
      const d1 = Math.abs(start.midX - end.x + end.width);
      const d2 = Math.abs(end.y - start.midY);
      if (d1 > d2) {
         line.curvePoints[last] = { x: end.midX, y: end.y };
         line.curvePoints[1] = { x: end.midX, y: start.midY };
         line.curvePoints[0] = { x: start.x, y: start.midY };
      } else {
         line.curvePoints[0] = { x: start.midX, y: start.y + start.height };
         line.curvePoints[1] = { x: start.midX, y: end.midY };
         line.curvePoints[last] = { x: end.x + end.width, y: end.midY };
      }
   }
};

const ifStartInMiddle = ({
   start,
   end,
   line,
   startS,
}: {
   startS: ShapeParams;
   start: {
      midX: number;
      midY: number;
      x: number;
      y: number;
      width: number;
      height: number;
   };
   end: {
      midX: number;
      midY: number;
      x: number;
      y: number;
      width: number;
      height: number;
   };
   line: ShapeParams;
}) => {
   if (!line.curvePoints || !line.curvePoints.length) return;
   let last;
   const conditions = () => {
      if (!line.curvePoints || !line.curvePoints.length) return;
      let last;
      if (Math.abs(start.midY - end.midY) <= 10) {
         line.curvePoints.length = 2;
         last = line.curvePoints?.length - 1;

         startS.y = end.midY - startS.height * 0.5;
         line.curvePoints[0] = { x: start.x + start.width, y: end.midY };
      } else {
         line.curvePoints.length = 4;
         last = line.curvePoints?.length - 1;

         // first
         line.curvePoints[0] = { x: start.x + start.width, y: start.midY };

         //mids
         const midPoint = Math.abs(end.x - (start.x + start.width)) * 0.5;
         line.curvePoints[1] = { x: end.x - midPoint, y: start.midY };
         line.curvePoints[2] = { x: end.x - midPoint, y: end.midY };
      }

      line.curvePoints[last] = { x: end.x, y: end.midY };
   };

   if (start.midX < end.x) {
      conditions();
   } else if (start.midX > end.x && start.midX < end.x + end.width) {
      if (Math.abs(start.midY - end.midY) < 10) {
         /* middle */
         line.curvePoints.length = 2;
         last = line.curvePoints?.length - 1;

         line.curvePoints[0].y = end.midY;
         if (start.midX > end.midX) {
            line.curvePoints[0].x = start.x + start.width;
            line.curvePoints[last] = { x: end.x + end.width, y: end.midY };
         } else {
            line.curvePoints[0].x = start.x;
            line.curvePoints[last] = { x: end.x, y: end.midY };
         }

         startS.y = end.midY - startS.height * 0.5;
      } else {
         /* left or right */
         line.curvePoints.length = 4;
         last = line.curvePoints?.length - 1;

         // points
         if (start.midX > end.midX) {
            const midPoint =
               Math.abs(end.x + end.width - (start.x + start.width)) * 0.5;
            line.curvePoints[0] = { x: start.x + start.width, y: start.midY };
            line.curvePoints[1] = {
               x: start.x + start.width + midPoint,
               y: start.midY,
            };
            line.curvePoints[2] = {
               x: start.x + start.width + midPoint,
               y: end.midY,
            };
            line.curvePoints[last] = { x: end.x + end.width, y: end.midY };
         } else {
            const midPoint = Math.abs(start.x - end.x) * 0.5;
            line.curvePoints[0] = { x: start.x, y: start.midY };
            line.curvePoints[1] = { x: start.x - midPoint, y: start.midY };
            line.curvePoints[2] = { x: start.x - midPoint, y: end.midY };
            line.curvePoints[last] = { x: end.x, y: end.midY };
         }
      }
   } else {
      if (Math.abs(start.midY - end.midY) <= 10) {
         line.curvePoints.length = 2;
         last = line.curvePoints?.length - 1;

         startS.y = end.midY - startS.height * 0.5;
         line.curvePoints[0] = { x: start.x, y: end.midY };
      } else {
         line.curvePoints.length = 4;
         last = line.curvePoints?.length - 1;

         // first
         line.curvePoints[0] = { x: start.x, y: start.midY };

         // mids
         const midPoint = Math.abs(start.x - (end.x + end.width)) * 0.5;
         line.curvePoints[1] = { x: start.x - midPoint, y: start.midY };
         line.curvePoints[2] = { x: start.x - midPoint, y: end.midY };
      }

      line.curvePoints[last] = { x: end.x + end.width, y: end.midY };
   }
};

const ifStartShapeBelow = ({
   startShape,
   start,
   end,
   line,
}: {
   startShape: ShapeParams;
   start: {
      midX: number;
      midY: number;
      x: number;
      y: number;
      width: number;
      height: number;
   };
   end: {
      midX: number;
      midY: number;
      x: number;
      y: number;
      width: number;
      height: number;
   };
   line: ShapeParams;
}) => {
   if (!line.curvePoints) return;
   let last;

   if (start.midX < end.x) {
      /* if left */
      line.curvePoints.length = 3; // length
      last = line.curvePoints.length - 1;

      const d1 = Math.abs(end.x - start.midX);
      const d2 = Math.abs(end.y + end.height - start.midY);
      if (d1 > d2) {
         line.curvePoints[0] = { x: start.x + start.width, y: start.midY };
         line.curvePoints[1] = { x: end.midX, y: start.midY };
         line.curvePoints[last] = { x: end.midX, y: end.y + end.height };
      } else {
         line.curvePoints[0] = { x: start.midX, y: start.y };
         line.curvePoints[1] = { x: start.midX, y: end.midY };
         line.curvePoints[last] = { x: end.x, y: end.midY };
      }
   } else if (start.midX > end.x && start.midX < end.x + end.width) {
      /* if mid */
      if (Math.abs(start.midX - end.midX) < 10) {
         /* if start mid eq to endmid */

         line.curvePoints.length = 2;
         last = line.curvePoints.length - 1;

         startShape.x = end.midX - startShape.width * 0.5;
         line.curvePoints[0] = { x: end.midX, y: start.y };
      } else {
         // start mid greater than end mid
         line.curvePoints.length = 4;
         last = line.curvePoints.length - 1;

         // first point
         line.curvePoints[0] = { x: start.midX, y: start.y };

         // mids
         const midPoint = Math.abs(end.y + end.height - start.y) * 0.5;
         line.curvePoints[1] = {
            x: start.midX,
            y: start.y - midPoint,
         };
         line.curvePoints[2] = {
            x: end.midX,
            y: start.y - midPoint,
         };
      }

      line.curvePoints[last] = { x: end.midX, y: end.y + end.height };
   } else {
      /* if right */
      line.curvePoints.length = 3; // length
      last = line.curvePoints.length - 1;

      const d1 = Math.abs(end.midX - start.x);
      const d2 = Math.abs(end.midY - start.y);
      if (d1 > d2) {
         line.curvePoints[0] = { x: start.midX, y: start.y };
         line.curvePoints[1] = { x: start.midX, y: end.midY };
         line.curvePoints[last] = { x: end.x + end.width, y: end.midY };
      } else {
         line.curvePoints[0] = { x: start.x, y: start.midY };
         line.curvePoints[1] = { x: end.midX, y: start.midY };
         line.curvePoints[last] = { x: end.midX, y: end.y + end.height };
      }
   }
};

function getClosestPoints({
   rect,
   point,
}: {
   rect: { x: number; y: number; width: number; height: number };
   point: { x: number; y: number };
}) {
   const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
   const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
   return { x: closestX, y: closestY };
}

export const lineConnectShape = ({
   theResizeElement,
   direction,
   canvasShapes,
   mouseX,
   mouseY,
   tolerance,
}: {
   theResizeElement: ShapeParams;
   canvasShapes: ShapeParams[];
   direction: "resizeStart" | "resizeEnd";
   mouseX: number;
   mouseY: number;
   tolerance: number;
}) => {
   const key = theResizeElement.id;
   if (direction === "resizeStart") {
      if (!theResizeElement.curvePoints) return;

      let keyUsed = false;
      if (theResizeElement.startTo) {
         let matchedConnection = null;

         for (let i = 0; i < canvasShapes.length; i++) {
            if (!canvasShapes[i]) continue;
            if (
               canvasShapes[i].id === theResizeElement.startTo &&
               canvasShapes[i].type !== shapeTypes.line
            ) {
               matchedConnection = i;
               break;
            }
         }

         if (matchedConnection != null) {
            let theShape = canvasShapes[matchedConnection];

            switch (theShape.type) {
               case "sphere":
                  if (lineDetachCircle({ theResizeElement, theShape, key })) {
                     theResizeElement.startTo = null;
                  }
                  break;
               case "others":
                  if (
                     theResizeElement.curvePoints[0].x <
                        theShape.x - theShape.radius ||
                     theResizeElement.curvePoints[0].x >
                        theShape.x + theShape.radius ||
                     theResizeElement.curvePoints[0].y <
                        theShape.y - theShape.radius ||
                     theResizeElement.curvePoints[0].y >
                        theShape.y + theShape.radius
                  ) {
                     theShape.pointTo = theShape.pointTo?.filter(
                        (p) => p !== key,
                     );
                     theResizeElement.startTo = null;
                  }
                  break;
               default:
                  if (
                     linedetachRect({
                        theResizeElement,
                        index: 0,
                        key,
                        theShape,
                     })
                  ) {
                     theResizeElement.startTo = null;
                  }
                  break;
            }
         }
      }

      canvasShapes.forEach((shape) => {
         if (!shape) return;
         const { type, id } = shape;
         if (keyUsed) return;
         const cond = () => {
            if (shape.pointTo?.includes(key) || theResizeElement.endTo === id)
               return;

            shape.pointTo?.push(key);
            theResizeElement.startTo = id;
            keyUsed = true;
         };

         switch (type) {
            case "rect":
               if (squareLineParams({ obj: shape, mouseX, mouseY }) && !keyUsed)
                  cond();
               break;
            case "sphere":
               lineJoinCircle({ shape, mouseX, mouseY, tolerance, cond });
               break;
            case "text":
               lineJoinText({ theResizeElement, shape, cond, index: 0 });
               break;
            case "image":
               if (
                  squareLineParams({ obj: shape, mouseX, mouseY }) &&
                  !keyUsed
               ) {
                  cond();
               }
               break;
            case "others":
               const { radius } = shape;
               if (
                  mouseX > shape.x - radius &&
                  mouseX < shape.x + radius &&
                  mouseY > shape.y - radius &&
                  mouseY < shape.y + radius
               ) {
                  cond();
               }
               break;
         }
      });

      keyUsed = false;
   } else if (direction === "resizeEnd") {
      if (!theResizeElement.curvePoints) return;
      const length = theResizeElement.curvePoints.length - 1;
      let keyUsed = false;

      if (theResizeElement.endTo) {
         let matchedConnection = null;

         for (let i = 0; i < canvasShapes.length; i++) {
            if (!canvasShapes[i]) continue;
            if (
               canvasShapes[i].id === theResizeElement.endTo &&
               canvasShapes[i].type !== shapeTypes.line
            ) {
               matchedConnection = i;
               break;
            }
         }

         if (!matchedConnection) return;

         const theShape = canvasShapes[matchedConnection];

         const { type } = theShape;

         switch (type) {
            case "sphere":
               if (lineDetachCircle({ theResizeElement, theShape, key }))
                  theResizeElement.endTo = null;
               break;
            case "others":
               if (
                  mouseX < theShape.x - theShape.radius ||
                  mouseX > theShape.x + theShape.radius ||
                  mouseY < theShape.y - theShape.radius ||
                  mouseY > theShape.y + theShape.radius
               ) {
                  theShape.pointTo = theShape.pointTo?.filter((p) => p !== key);
                  theResizeElement.endTo = null;
               }
               break;
            default:
               if (
                  linedetachRect({
                     key,
                     theResizeElement,
                     theShape,
                     index: length,
                  })
               ) {
                  theResizeElement.endTo = null;
               }
               break;
         }
      }

      canvasShapes.forEach((shape) => {
         if (!shape) return;
         const { type, id } = shape;
         if (keyUsed) return;
         const cond = () => {
            if (
               (theResizeElement.startTo === id ||
                  shape.pointTo?.includes(key)) &&
               shape.type === shapeTypes.line
            )
               return;

            shape.pointTo?.push(key);
            theResizeElement.endTo = id;
            keyUsed = true;
         };

         switch (type) {
            case "rect":
               if (squareLineParams({ obj: shape, mouseY, mouseX })) cond();
               break;
            case "sphere":
               lineJoinCircle({ shape, mouseX, mouseY, cond, tolerance });
               break;
            case "text":
               lineJoinText({ theResizeElement, shape, cond, index: length });
               break;
            case "image":
               if (squareLineParams({ obj: shape, mouseX, mouseY }) && !keyUsed)
                  cond();
               break;
            case "others":
               const { radius } = shape;
               if (
                  mouseX > shape.x - radius &&
                  mouseX < shape.x + radius &&
                  mouseY > shape.y - radius &&
                  mouseY < shape.y + radius
               )
                  cond();
               break;
         }
      });

      keyUsed = false;
   }
   theResizeElement.isActive = true;
};

function lineJoinCircle({
   mouseX,
   mouseY,
   shape,
   cond,
   tolerance,
}: {
   tolerance: number;
   mouseX: number;
   mouseY: number;
   cond: () => void;
   shape: ShapeParams;
}) {
   const distance = Math.sqrt(
      (mouseX - shape.x) ** 2 + (mouseY - shape.y) ** 2,
   );
   if (shape.xRadius && shape.yRadius) {
      if (
         Math.abs(distance - shape.xRadius) <= 2 * tolerance &&
         Math.abs(distance - shape.yRadius) <= 2 * tolerance
      ) {
         cond();
      }
   }
}

function lineJoinText({
   theResizeElement,
   shape,
   cond,
   index,
}: {
   theResizeElement: ShapeParams;
   shape: ShapeParams;
   cond: () => void;
   index: number;
}) {
   if (theResizeElement.curvePoints) {
      if (
         theResizeElement.curvePoints[index].x >= shape.x &&
         theResizeElement.curvePoints[index].x <= shape.x + shape.width &&
         theResizeElement.curvePoints[index].y >= shape.y &&
         theResizeElement.curvePoints[index].y <= shape.y + shape.height
      )
         cond();
   }
}

function linedetachRect({
   key,
   theShape,
   theResizeElement,
   index,
}: {
   key: string;
   theShape: ShapeParams;
   theResizeElement: ShapeParams;
   index: number;
}) {
   if (!theResizeElement.curvePoints) return false;
   if (
      theResizeElement.curvePoints[index].x < theShape.x ||
      theResizeElement.curvePoints[index].x > theShape.x + theShape.width ||
      theResizeElement.curvePoints[index].y < theShape.y ||
      theResizeElement.curvePoints[index].y > theShape.y + theShape.height
   ) {
      theShape.pointTo = theShape.pointTo?.filter((r) => {
         return r !== key;
      });
      return true;
   }
   return false;
}

function lineDetachCircle({
   theResizeElement,
   theShape,
   key,
}: {
   theResizeElement: ShapeParams;
   theShape: ShapeParams;
   key: string;
}) {
   if (!theResizeElement.curvePoints) return false;
   const distance = Math.sqrt(
      (theResizeElement.curvePoints[0].x - theShape.x) ** 2 +
         (theResizeElement.curvePoints[0].y - theShape.y) ** 2,
   );
   if (theShape.xRadius && theShape.yRadius) {
      if (distance > theShape.xRadius || distance > theShape.yRadius) {
         theShape.pointTo = theShape.pointTo?.filter((s) => s !== key);

         return true;
      }
   }
   return false;
}

function squareLineParams({
   obj,
   mouseX,
   mouseY,
}: {
   obj: ShapeParams;
   mouseX: number;
   mouseY: number;
}) {
   const { x, y, width, height } = obj;
   const slopeTop1 = findSlope(mouseY, y, mouseX, x);
   const slopeTop2 = findSlope(mouseY, y, mouseX, x + width);

   const slopeBottom1 = findSlope(mouseY, y + height, mouseX, x);
   const slopeBottom2 = findSlope(mouseY, y + height, mouseX, x + width);

   const slopeLeft1 = findSlope(mouseY, y, mouseX, x);
   const slopeLeft2 = findSlope(mouseY, y + height, mouseX, x);

   const slopeRight1 = findSlope(mouseY, y, mouseX, x + width);
   const slopeRight2 = findSlope(mouseY, y + height, mouseX, x + width);

   return (
      (mouseX > x &&
         mouseX < x + width &&
         Math.abs(slopeTop1 - slopeTop2) <= 0.15) ||
      (mouseX > x &&
         mouseX < x + width &&
         Math.abs(slopeBottom1 - slopeBottom2) <= 0.15) ||
      (mouseY > y &&
         mouseY < y + height &&
         Math.abs(slopeLeft1 - slopeLeft2) >= 50) ||
      (mouseY > y &&
         mouseY < y + height &&
         Math.abs(slopeRight1 - slopeRight2) >= 50)
   );
}

export const updateLineParameters = (shape: ShapeParams) => {
   shape.minX = Infinity;
   shape.maxX = -Infinity;
   shape.minY = Infinity;
   shape.maxY = -Infinity;

   shape.curvePoints?.forEach((ele) => {
      if (!shape.minX || !shape.minY || !shape.maxX || !shape.maxY) return;
      if (ele.x < shape.minX) {
         shape.minX = ele.x;
      }
      if (ele.x > shape.maxX) {
         shape.maxX = ele.x;
      }
      if (ele.y < shape.minY) {
         shape.minY = ele.y;
      }
      if (ele.y > shape.maxY) {
         shape.maxY = ele.y;
      }
   });
};
