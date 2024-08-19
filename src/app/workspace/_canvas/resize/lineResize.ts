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
   // Calculate distance between the last point and the mouse position
   let lastPoint;
   if (direction === "start") {
      lastPoint = curvePoints[curvePoints.length - 1];
   } else {
      lastPoint = curvePoints[0];
   }
   const distance = Math.sqrt(
      (lastPoint.x - mouseX) ** 2 + (lastPoint.y - mouseY) ** 2,
   );

   if (distance >= 250) {
      // Set up for four points when distance is 250 or more
      // Ensure the array has at least 4 points
      if (line.curvePoints.length < 4) {
         line.curvePoints.length = 4;
      }

      if (direction === "start") {
         // Set points based on distance
         line.curvePoints[1] = {
            x: (curvePoints[0].x + lastPoint.x) / 2,
            y: mouseY,
         };
         line.curvePoints[2] = {
            x: (curvePoints[0].x + lastPoint.x) / 2,
            y: lastPoint.y,
         };
         line.curvePoints[3] = {
            x: lastPoint.x,
            y: lastPoint.y,
         };
      } else {
         // Set points based on distance
         line.curvePoints[1] = {
            x: (mouseX + curvePoints[0].x) / 2,
            y: lastPoint.y,
         };
         line.curvePoints[2] = {
            x: (mouseX + curvePoints[0].x) / 2,
            y: mouseY,
         };
         line.curvePoints[0] = {
            x: lastPoint.x,
            y: lastPoint.y,
         };
      }
   } else {
      // ensure three points;
      if (line.curvePoints.length > 3) {
         line.curvePoints.length = 3;
      }
      if (direction === "start") {
         line.curvePoints[1] = {
            x: lastPoint.x,
            y: mouseY,
         };

         line.curvePoints[2] = {
            x: lastPoint.x,
            y: lastPoint.y,
         };
      } else {
         line.curvePoints[1] = {
            x: curvePoints[curvePoints.length - 1].x,
            y: curvePoints[0].y,
         };
         line.curvePoints[0] = {
            x: lastPoint.x,
            y: lastPoint.y,
         };
      }
   }

   // Update the first point of the lineResize.curvePoints
   if (direction === "start") {
      line.curvePoints[0] = { x: mouseX, y: mouseY };
   } else {
      line.curvePoints[curvePoints.length - 1] = { x: mouseX, y: mouseY };
   }
}
