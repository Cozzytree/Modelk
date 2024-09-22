import { shapeTypes } from "@/lib/utils";

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
   storEn = "start",
}: {
   line: Line;
   endShape: any;
   startShape: any;
   storEn: "start" | "end";
}) {
   const { curvePoints } = line;
   let sx, sy, swidth, sheight, ex, ey, ewidth, eheight;

   if (line.lineType !== "elbow") return;
   if (endShape) {
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
      const horizontalCenter =
         sx + swidth / 2 > ex && sx + swidth / 2 < ex + ewidth;
      const horizontalLeft = sx + swidth / 2 < ex;
      const verticalMid =
         sy + sheight * 0.5 > ey && sy + sheight * 0.5 < ey + eheight;
      const verticalTop = sy + sheight * 0.5 < ey;
      const verticalBottom = sy + sheight * 0.5 > ey + eheight;

      // const horizontalRight = sx + swidth / 2 < ex + ewidth;
      if (storEn === "start") {
         if (sy >= ey + eheight / 2) {
            if (horizontalCenter) {
               line.curvePoints.length = 4;
               if (Math.abs(ex + ewidth * 0.5 - (sx + swidth * 0.5)) <= 10) {
                  startShape.x =
                     startShape.type === shapeTypes.circle
                        ? ex + ewidth * 0.5
                        : ex + ewidth * 0.5 - swidth * 0.5;

                  line.curvePoints[1] = {
                     x: ex + ewidth / 2,
                     y: ey + eheight + (sy - (ey + eheight)) * 0.5,
                  };
                  line.curvePoints[2] = {
                     x: ex + ewidth / 2,
                     y: ey + eheight + (sy - (ey + eheight)) * 0.5,
                  };
               } else {
                  line.curvePoints[1] = {
                     x: sx + swidth / 2,
                     y: ey + eheight + (sy - (ey + eheight)) * 0.5,
                  };
                  line.curvePoints[2] = {
                     x: ex + ewidth / 2,
                     y: ey + eheight + (sy - (ey + eheight)) * 0.5,
                  };
               }
               line.curvePoints[0] = { x: sx + swidth / 2, y: sy };
               line.curvePoints[3] = {
                  x: ex + ewidth / 2,
                  y: ey + eheight,
               };
            } else if (horizontalLeft) {
               line.curvePoints.length = 2;
               if (verticalMid) {
                  line.curvePoints[0] = {
                     x: sx + swidth,
                     y: ey + eheight * 0.6,
                  };
                  line.curvePoints[1] = {
                     x: sx + swidth + 1,
                     y: ey + eheight * 0.5,
                  };
               } else if (verticalTop) {
                  line.curvePoints[0] = { x: sx + swidth * 0.5, y: sy };
                  line.curvePoints[1] = {
                     x: sx + swidth * 0.5,
                     y: ey + eheight * 0.5,
                  };
               } else {
                  line.curvePoints[1] = {
                     x: sx + swidth * 0.5,
                     y: ey + eheight * 0.5,
                  };
                  line.curvePoints[0] = {
                     x: sx + swidth * 0.5,
                     y: ey,
                  };
               }

               line.curvePoints[2] = { x: ex, y: ey + eheight * 0.5 };
            } else {
               line.curvePoints.length = 2;

               // if (verticalMid) {
               //    line.curvePoints[0] = { x: sx, y: ey + eheight * 0.5 };
               //    line.curvePoints[1] = {
               //       x: sx + swidth - 1,
               //       y: ey + eheight * 0.5,
               //    };
               // } else if (verticalTop) {
               //    line.curvePoints[0] = { x: sx, y: sy + sheight * 0.5 };
               //    line.curvePoints[1] = {
               //       x: ex + ewidth * 0.5,
               //       y: sy + sheight * 0.5,
               //    };
               // } else {
               //    line.curvePoints[0] = { x: sx, y: sy + sheight * 0.5 };
               //    line.curvePoints[1] = {
               //       x: ex + ewidth * 0.5,
               //       y: sy + sheight * 0.5,
               //    };
               // }

               line.curvePoints[0] = { x: sx + swidth * 0.5, y: sy };
               line.curvePoints[1] = {
                  x: sx + swidth * 0.5,
                  y: ey + eheight * 0.5,
               };

               line.curvePoints[2] = {
                  x: ex + ewidth,
                  y: ey + eheight * 0.5,
               };
            }
         } else {
            if (horizontalCenter) {
               line.curvePoints.length = 3;
               if (Math.abs(ex + ewidth * 0.5 - (sx + swidth * 0.5)) <= 10) {
                  startShape.x =
                     startShape.type === shapeTypes.circle
                        ? ex + ewidth * 0.5
                        : ex + ewidth * 0.5 - swidth * 0.5;

                  line.curvePoints[1] = {
                     x: ex + ewidth * 0.5,
                     y: sy + sheight + sy * 0.5,
                  };
                  line.curvePoints[2] = {
                     x: ex + ewidth * 0.5,
                     y: sy + sheight + sy * 0.5,
                  };
               } else {
                  line.curvePoints[1] = {
                     x: sx + swidth * 0.5,
                     y: sy + sheight + (ey - (sy + sheight)) * 0.5,
                  };
                  line.curvePoints[2] = {
                     x: ex + ewidth * 0.5,
                     y: sy + sheight + (ey - (sy + sheight)) * 0.5,
                  };
               }

               line.curvePoints[0] = {
                  x: sx + swidth * 0.5,
                  y: sy + sheight,
               };

               line.curvePoints[3] = { x: ex + ewidth * 0.5, y: ey };
            } else if (horizontalLeft) {
               line.curvePoints.length = 3;
               if (verticalMid) {
                  line.curvePoints[0] = { x: sx, y: ey + eheight * 0.5 };
                  line.curvePoints[1] = {
                     x: sx + swidth - 1,
                     y: ey + eheight * 0.5,
                  };
               } else if (verticalTop) {
                  line.curvePoints[0] = {
                     x: sx + swidth * 0.5,
                     y: sy + sheight,
                  };
                  line.curvePoints[1] = {
                     x: sx + swidth * 0.5,
                     y: ey + eheight * 0.5,
                  };
               } else {
                  line.curvePoints[0] = { x: sx, y: sy + sheight * 0.5 };
                  line.curvePoints[1] = {
                     x: ex + ewidth * 0.5,
                     y: sy + sheight * 0.5,
                  };
               }

               line.curvePoints[2] = {
                  x: ex,
                  y: ey + eheight * 0.5,
               };
            } else {
               line.curvePoints.length = 3;

               if (verticalMid) {
                  line.curvePoints[0] = {
                     x: sx,
                     y: ey + eheight * 0.5,
                  };
                  line.curvePoints[1] = {
                     x: sx - 2,
                     y: ey + eheight * 0.5,
                  };
               } else if (verticalTop) {
                  line.curvePoints[0] = {
                     x: sx + swidth * 0.5,
                     y: sy + sheight,
                  };
                  line.curvePoints[1] = {
                     x: sx + swidth * 0.5,
                     y: ey + eheight * 0.5,
                  };
               } else {
                  line.curvePoints[0] = {
                     x: sx,
                     y: sy + sheight * 0.5,
                  };
                  line.curvePoints[1] = {
                     x: ex + ewidth * 0.5,
                     y: sy + sheight * 0.5,
                  };
               }

               line.curvePoints[2] = {
                  x: ex + ewidth,
                  y: ey + eheight * 0.5,
               };
            }
         }
      } else {
         if (sy >= ey + eheight / 2) {
            if (horizontalCenter) {
               line.curvePoints.length = 3;
               if (Math.abs(ex + ewidth * 0.5 - (sx + swidth * 0.5)) <= 10) {
                  startShape.x =
                     startShape.type === shapeTypes.circle
                        ? ex + ewidth * 0.5
                        : ex + ewidth * 0.5 - swidth * 0.5;

                  line.curvePoints[1] = {
                     x: ex + ewidth / 2,
                     y: ey + eheight + (sy - (ey + eheight)) * 0.5,
                  };
                  line.curvePoints[2] = {
                     x: ex + ewidth / 2,
                     y: ey + eheight + (sy - (ey + eheight)) * 0.5,
                  };
               } else {
                  line.curvePoints[1] = {
                     x: ex + ewidth / 2,
                     y: ey + eheight + (sy - (ey + eheight)) * 0.5,
                  };
                  line.curvePoints[2] = {
                     x: sx + swidth / 2,
                     y: ey + eheight + (sy - (ey + eheight)) * 0.5,
                  };
               }

               line.curvePoints[0] = {
                  x: ex + ewidth / 2,
                  y: ey + eheight,
               };
               line.curvePoints[3] = { x: sx + swidth / 2, y: sy };
            } else if (horizontalLeft) {
               line.curvePoints.length = 2;

               line.curvePoints[0] = {
                  x: ex + ewidth * 0.5,
                  y: ey + eheight,
               };
               line.curvePoints[1] = {
                  x: ex + ewidth * 0.5,
                  y: sy + sheight * 0.5,
               };

               line.curvePoints[2] = {
                  x: sx + swidth,
                  y: sy + sheight * 0.5,
               };
            } else {
               line.curvePoints.length = 2;

               line.curvePoints[0] = {
                  x: ex + ewidth * 0.5,
                  y: ey + eheight,
               };
               line.curvePoints[1] = {
                  x: ex + ewidth * 0.5,
                  y: sy + sheight * 0.5,
               };

               line.curvePoints[2] = { x: sx, y: sy + sheight * 0.5 };
            }
         } else {
            if (horizontalCenter) {
               line.curvePoints.length = 3;
               if (Math.abs(ex + ewidth * 0.5 - (sx + swidth * 0.5)) <= 10) {
                  startShape.x =
                     startShape.type === shapeTypes.circle
                        ? ex + ewidth * 0.5
                        : ex + ewidth * 0.5 - swidth * 0.5;

                  line.curvePoints[1] = {
                     x: ex + ewidth / 2,
                     y: ey + eheight + (sy - (ey + eheight)) * 0.5,
                  };
                  line.curvePoints[2] = {
                     x: ex + ewidth / 2,
                     y: ey + eheight + (sy - (ey + eheight)) * 0.5,
                  };
               } else {
                  line.curvePoints[1] = {
                     x: ex + ewidth / 2,
                     y: sy + sheight + (ey - (sy + sheight)) * 0.5,
                  };
                  line.curvePoints[2] = {
                     x: sx + swidth / 2,
                     y: sy + sheight + (ey - (sy + sheight)) * 0.5,
                  };
               }

               line.curvePoints[3] = {
                  x: sx + swidth / 2,
                  y: sy + sheight,
               };
               line.curvePoints[0] = { x: ex + ewidth / 2, y: ey };
            } else if (horizontalLeft) {
               line.curvePoints.length = 2;

               if (verticalMid) {
                  line.curvePoints[0] = {
                     x: ex,
                     y: sy + sheight * 0.5,
                  };
                  line.curvePoints[1] = {
                     x: ex,
                     y: sy + sheight * 0.5,
                  };
               } else if (verticalTop) {
                  line.curvePoints[0] = {
                     x: ex + ewidth * 0.5,
                     y: ey,
                  };
                  line.curvePoints[1] = {
                     x: ex + ewidth * 0.5,
                     y: sy + sheight * 0.5,
                  };
               } else {
                  line.curvePoints[0] = {
                     x: ex + ewidth * 0.5,
                     y: ey + eheight,
                  };
                  line.curvePoints[1] = {
                     x: ex + ewidth * 0.5,
                     y: sy + sheight * 0.5,
                  };
               }

               line.curvePoints[2] = {
                  x: sx + swidth,
                  y: sy + sheight * 0.5,
               };
            } else {
               line.curvePoints.length = 2;

               if (verticalMid) {
                  line.curvePoints[0] = {
                     x: ex + ewidth,
                     y: sy + sheight * 0.5,
                  };
                  line.curvePoints[1] = {
                     x: ex + ewidth + 2,
                     y: sy + sheight * 0.5,
                  };
               } else if (verticalTop) {
                  line.curvePoints[0] = {
                     x: ex + ewidth * 0.5,
                     y: ey,
                  };
                  line.curvePoints[1] = {
                     x: ex + ewidth * 0.5,
                     y: sy + sheight * 0.5,
                  };
               } else {
                  line.curvePoints[0] = {
                     x: ex + ewidth * 0.5,
                     y: ey + eheight,
                  };
                  line.curvePoints[1] = {
                     x: ex + ewidth * 0.5,
                     y: sy + sheight * 0.5,
                  };
               }

               line.curvePoints[2] = { x: sx, y: sy + sheight * 0.5 };
            }
         }
      }
   } else if (endShape == null) {
      line.curvePoints[1] = {
         x:
            startShape.type === shapeTypes.circle
               ? startShape.x
               : startShape.x + startShape.width / 2,
         y:
            storEn === "end"
               ? curvePoints[0].y
               : curvePoints[curvePoints.length - 1].y,
      };
   }
}

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
