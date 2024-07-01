import { config, Scale, scrollBar } from "../../../lib/utils.ts";
import Doc from "./Doc.jsx";

export default class Shapes {
   constructor(
      canvas,
      canvasBreakpoints,
      rectMap,
      circleMap,
      textMap,
      lineMap,
      breakpoints,
      currentActive,
      renderCanvas
   ) {
      this.canvas = canvas;
      this.canvasBreakpoints = canvasBreakpoints;
      this.renderCanvas = renderCanvas;
      this.activeColor = "#2165ee";
      this.tolerance = 6;
      this.resizeElement = null;
      this.dragElement = null;
      this.context = this.canvas.getContext("2d");
      this.breakPointsCtx = this.canvasBreakpoints.getContext("2d");
      this.renderCanvasCtx = this.renderCanvas.getContext("2d");
      this.rectMap = rectMap;
      this.circleMap = circleMap;
      this.textMap = textMap;
      this.lineMap = lineMap;
      this.breakpoints = breakpoints;
      this.currentActive = currentActive;
      this.shapeToRender = null;

      document.addEventListener("keydown", (e) => {
         // select all
         if (e.ctrlKey && e.key === "a") {
            e.preventDefault();
            this.rectMap.forEach((rect) => {
               rect.isActive = true;
            });
            this.circleMap.forEach((arc) => {
               arc.isActive = true;
            });
            this.textMap.forEach((text) => {
               text.isActive = true;
            });
            this.draw();
         }
      });

      document.addEventListener("keydown", (e) => {
         if (e.key === "Delete") {
            //remove selected square
            this.rectMap.forEach((rect, key) => {
               if (rect.isActive) {
                  this.rectMap.delete(key);
                  breakpoints.delete(key);
               }
            });

            this.lineMap.forEach((line, key) => {
               if (line.isActive) {
                  if (line.startTo) {
                     const { rect, text, sphere } = this.getShape(line.startTo);
                     if (rect) {
                        rect.pointTo.filter((r) => r !== key);
                     }
                     if (text) {
                        text.pointTo.filter((r) => r !== key);
                     }
                     if (sphere) {
                        sphere.pointTo.filter((r) => r !== key);
                     }
                  } else if (line.endTo) {
                     const { rect, text, sphere } = this.getShape(line.endTo);

                     if (rect) {
                        rect.pointTo.filter((r) => r !== key);
                     }
                     if (text) {
                        text.pointTo.filter((r) => r !== key);
                     }
                     if (sphere) {
                        sphere.pointTo.filter((r) => r !== key);
                     }
                  }
                  this.lineMap.delete(key);
               }
            });

            //remove selected arcs
            this.circleMap.forEach((arc, key) => {
               if (arc.isActive) {
                  this.circleMap.delete(key);
                  breakpoints.delete(key);
               }
            });

            this.textMap.forEach((text, key) => {
               if (text.isActive) {
                  this.textMap.delete(key);
               }
            });
            this.draw();
         }
      });
   }

   canvasClick(e) {
      if (config.mode === "handsFree" || config.mode === "pencil") {
         return;
      }
      // to get the current active shape so to show the shape options
      config.currentActive = null;

      const { x: clickX, y: clickY } = this.getTransformedMouseCoords(e);

      // Reset all shapes to inactive
      const allShapes = [
         ...this.rectMap.values(),
         ...this.circleMap.values(),
         ...this.textMap.values(),
         ...this.lineMap.values(),
      ];
      allShapes.forEach((shape) => {
         shape.isActive = false;
      });

      let circle = null;
      let square = null;
      let text = null;
      let minLine = null;

      // Check if the click is within any rectangle
      for (const [_, rect] of this.rectMap) {
         if (
            clickX >= rect.x &&
            clickX <= rect.x + rect.width &&
            clickY >= rect.y &&
            clickY <= rect.y + rect.height
         ) {
            if (square === null || square.width > rect.width) {
               square = rect;
            }
         }
      }

      // click withinh circle
      for (const [_, arc] of this.circleMap) {
         if (
            clickX > arc.x - arc.xRadius &&
            clickX <= arc.x + arc.xRadius &&
            clickY >= arc.y - arc.yRadius &&
            clickY <= arc.y + arc.yRadius
         ) {
            if (circle === null || arc.xRadius < circle.xRadius) {
               circle = arc;
            }
         }
      }

      //click withinh text
      for (const [_, t] of this.textMap) {
         if (
            clickX >= t.x &&
            clickX <= t.x + t.width &&
            clickY >= t.y &&
            clickY <= t.y + t.height
         ) {
            if (text === null || t.width < text.width) {
               text = t;
            }
         }
      }

      this.lineMap.forEach((l) => {
         const width = l.maxX - l.minX;
         let horizontelParams = width < 5 ? -this.tolerance : +this.tolerance;
         let verticalParams =
            l.maxY - l.minY < 5 ? -this.tolerance : +this.tolerance;

         if (
            clickX >= l.minX + horizontelParams &&
            clickX <= l.maxX - horizontelParams &&
            clickY >= l.minY + verticalParams &&
            clickY <= l.maxY - verticalParams
         ) {
            if (minLine === null || minLine.maxX - minLine.minX > width)
               minLine = l;
         }
      });

      if (
         circle &&
         (!square || circle.xRadius * 2 < square.width) &&
         (!text || circle.xRadius * 2 < text.width)
      ) {
         config.currentActive = circle;
         circle.isActive = true;
      } else if (
         square &&
         (!circle || square.width < circle.xRadius * 2) &&
         (!text || square.width < text.width) &&
         (!minLine || square.width < minLine.maxX - minLine.minX)
      ) {
         config.currentActive = square;
         square.isActive = true;
      } else if (
         text &&
         (!circle || text.width < circle.xRadius * 2) &&
         (!square || text.width < square.width)
      ) {
         config.currentActive = text;
         text.isActive = true;
      } else if (
         minLine &&
         (!square || minLine.maxX - minLine.minX < square.width)
      ) {
         minLine.isActive = true;
         config.currentActive = minLine;
      }
      return config.currentActive;
   }

   draw() {
      // Clear the canvas
      this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      this.context.save();

      //   const centerX = this.canvas.width / 2;
      //   const centerY = this.canvas.height / 2;

      //   // Translate to the center, apply scaling, and then translate back
      //   this.context.translate(centerX, centerY);
      this.context.scale(Scale.scale, Scale.scale);
      //   this.context.translate(-centerX, -centerY);

      this.context.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY
      );
      this.context.lineWidth = this.lineWidth;
      this.context.strokeStyle = "rgb(2, 211, 134)";

      const drawDotsAndRect = (
         x,
         y,
         width,
         height,
         tolerance,
         isActive,
         activeColor
      ) => {
         if (isActive) {
            // Draw dots
            this.dots(
               { x: x - tolerance, y: y - tolerance },
               { x: x + width + tolerance, y: y - tolerance },
               { x: x + width + tolerance, y: y + height + tolerance },
               { x: x - tolerance, y: y + height + tolerance },
               { context: this.context }
            );

            // Draw active rectangle
            this.context.beginPath();
            this.context.strokeStyle = activeColor;
            this.context.rect(
               x - tolerance,
               y - tolerance,
               width + 2 * tolerance,
               height + 2 * tolerance
            );
            this.context.stroke();
            this.context.closePath();
         }
      };

      // Draw rectangles
      this.rectMap.forEach((rect) => {
         const {
            x,
            y,
            width,
            height,
            radius,
            lineWidth,
            borderColor,
            fillStyle,
            text,
            textSize,
            isActive,
         } = rect;

         drawDotsAndRect(
            x,
            y,
            width,
            height,
            this.tolerance,
            isActive,
            this.activeColor
         );

         // Draw rounded rectangle
         this.context.beginPath();
         this.context.lineWidth = lineWidth;
         this.context.strokeStyle = borderColor;
         this.context.fillStyle = fillStyle;
         this.context.moveTo(x + radius, y);
         this.context.arcTo(x + width, y, x + width, y + height, radius);
         this.context.arcTo(x + width, y + height, x, y + height, radius);
         this.context.arcTo(x, y + height, x, y, radius);
         this.context.arcTo(x, y, x + width, y, radius);
         this.context.stroke();
         this.context.fill();
         this.context.closePath();

         // Render text
         this.renderText(text, x, y, textSize, height, width);
      });

      // Draw circles
      this.circleMap.forEach((sphere) => {
         const x = sphere.x - sphere.xRadius;
         const y = sphere.y - sphere.yRadius;
         const width = 2 * sphere.xRadius;
         const height = 2 * sphere.yRadius;

         drawDotsAndRect(
            x,
            y,
            width,
            height,
            this.tolerance,
            sphere.isActive,
            this.activeColor
         );

         // Draw circle
         this.context.beginPath();
         this.context.lineWidth = sphere.lineWidth;
         this.context.fillStyle = sphere.fillStyle;
         this.context.strokeStyle = sphere.borderColor;
         this.context.ellipse(
            sphere.x,
            sphere.y,
            sphere.xRadius,
            sphere.yRadius,
            0,
            0,
            2 * Math.PI
         );
         this.context.fill();
         this.context.stroke();
         this.context.closePath();

         // Render text
         this.renderText(sphere.text, x, y, sphere.textSize, height, width);
      });

      // Draw text blocks
      this.textMap.forEach((t) => {
         const {
            x,
            y,
            width,
            height,
            textSize,
            font,
            fillStyle,
            content,
            isActive,
         } = t;

         drawDotsAndRect(
            x,
            y,
            width,
            height,
            this.tolerance,
            isActive,
            this.activeColor
         );

         // Set the font size and style before measuring the text
         this.context.fillStyle = fillStyle;
         this.context.font = `${textSize}px ${font || "Arial"}`;

         let maxWidth = 0;
         content.forEach((c) => {
            const textMetrics = this.context.measureText(c);
            maxWidth = Math.max(maxWidth, textMetrics.width);
         });

         // Store the measured dimensions
         t.width = maxWidth;
         t.height = content.length * textSize;

         let currentY = y;
         content.forEach((c) => {
            const textMetrics = this.context.measureText(c);
            this.context.fillText(
               c,
               x,
               currentY + textMetrics.actualBoundingBoxAscent
            );
            currentY +=
               textMetrics.actualBoundingBoxAscent +
               textMetrics.actualBoundingBoxDescent +
               this.tolerance;
         });
      });

      // Draw lines
      this.lineMap.forEach((line) => {
         const {
            curvePoints,
            lineWidth,
            lineType,
            borderColor,
            radius,
            isActive,
         } = line;

         this.context.beginPath();
         this.context.lineWidth = lineWidth;

         if (isActive) {
            this.context.strokeStyle = this.activeColor;
            this.dots(...curvePoints, { context: this.context });
         } else {
            this.context.strokeStyle = borderColor;
         }

         this.context.moveTo(curvePoints[0].x, curvePoints[0].y);

         if (lineType === "straight") {
            for (let i = 1; i < curvePoints.length; i++) {
               this.context.lineTo(curvePoints[i].x, curvePoints[i].y);
            }
         } else if (lineType === "elbow") {
            const headlen = 15;

            // Draw the line
            this.context.lineTo(curvePoints[1].x, curvePoints[1].y);

            // Draw the back arrowhead
            const lastPoint = line.curvePoints[line.curvePoints.length - 1];
            const firstPoint = line.curvePoints[0];

            // Calculate the angle of the arrow
            let angle = Math.atan2(
               lastPoint.y - firstPoint.y,
               lastPoint.x - firstPoint.x
            );

            // Draw the first side of the back arrowhead
            this.context.moveTo(lastPoint.x, lastPoint.y);
            this.context.lineTo(
               lastPoint.x - headlen * Math.cos(angle - Math.PI / 6),
               lastPoint.y - headlen * Math.sin(angle - Math.PI / 6)
            );
            this.context.stroke();
            this.context.closePath();

            // Draw the second side of the back arrowhead
            this.context.beginPath();
            this.context.moveTo(lastPoint.x, lastPoint.y);
            this.context.lineTo(
               lastPoint.x - headlen * Math.cos(angle + Math.PI / 6),
               lastPoint.y - headlen * Math.sin(angle + Math.PI / 6)
            );
            this.context.stroke();
            this.context.closePath();

            // Draw the front arrowhead
            angle = Math.atan2(
               firstPoint.y - lastPoint.y,
               firstPoint.x - lastPoint.x
            );

            // Draw the first side of the front arrowhead
            this.context.beginPath();
            this.context.moveTo(firstPoint.x, firstPoint.y);
            this.context.lineTo(
               firstPoint.x - headlen * Math.cos(angle - Math.PI / 6),
               firstPoint.y - headlen * Math.sin(angle - Math.PI / 6)
            );
            this.context.stroke();
            this.context.closePath();

            // Draw the second side of the front arrowhead
            this.context.beginPath();
            this.context.moveTo(firstPoint.x, firstPoint.y);
            this.context.lineTo(
               firstPoint.x - headlen * Math.cos(angle + Math.PI / 6),
               firstPoint.y - headlen * Math.sin(angle + Math.PI / 6)
            );
            this.context.stroke();
            this.context.closePath();
         } else {
            for (let i = 1; i < curvePoints.length - 1; i++) {
               const cp1 = curvePoints[i];
               const cp2 = curvePoints[i + 1];
               const t = 0.8; // Weighting factor, 0.5 for halfway, closer to 1 for closer to cp2
               const midPointX = (1 - t) * cp1.x + t * cp2.x;
               const midPointY = (1 - t) * cp1.y + t * cp2.y;
               this.context.quadraticCurveTo(
                  cp1.x,
                  cp1.y,
                  midPointX,
                  midPointY
               );
            }
            const lastPoint = curvePoints[curvePoints.length - 1];
            this.context.lineTo(lastPoint.x, lastPoint.y);
         }
         this.context.stroke();
         this.context.closePath();
      });

      this.context.restore();
   }

   dots(...sides) {
      this.context.lineWidth = 1.7;
      for (let i = 0; i < sides.length - 1; i++) {
         sides[sides.length - 1].context.beginPath();
         sides[sides.length - 1].context.fillStyle = "transparent";
         sides[sides.length - 1].context.strokeStyle = this.activeColor;
         sides[sides.length - 1].context.arc(
            sides[i].x,
            sides[i].y,
            6,
            0,
            2 * Math.PI,
            false
         );
         sides[sides.length - 1].context.fill();
         sides[sides.length - 1].context.stroke();
         sides[sides.length - 1].context.closePath();
      }
   }

   getTransformedMouseCoords(event) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX =
         (event.clientX - rect.left + scrollBar.scrollPositionX) / Scale.scale;
      const mouseY =
         (event.clientY - rect.top + scrollBar.scrollPositionY) / Scale.scale;
      return { x: mouseX, y: mouseY };

      // Calculate the center of the current view
      //   const centerX = this.canvas.width / 2;
      //   const centerY = this.canvas.height / 2;

      //   // Calculate the mouse position adjusted for scaling and translation
      //   const mouseX =
      //      (event.clientX - rect.left - centerX + scrollBar.scrollPositionX) /
      //         Scale.scale +
      //      centerX;
      //   const mouseY =
      //      (event.clientY - rect.top - centerY + scrollBar.scrollPositionY) /
      //         Scale.scale +
      //      centerY;

      return { x: mouseX, y: mouseY };
   }

   mouseDownDragAndResize(e) {
      if (config.mode === "pencil" || config.mode === "handsFree") return;

      if (e.altKey) return;

      config.currentActive = null;
      let isResizing = false;
      //   this.canvasClick(e);
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

      // line resize
      this.lineMap.forEach((line, key) => {
         let points = line.curvePoints;
         for (let i = 0; i < points.length; i++) {
            if (
               mouseX >= points[i].x - 5 &&
               mouseX <= points[i].x + 5 &&
               mouseY >= points[i].y - 5 &&
               mouseY <= points[i].y + 5 &&
               line.isActive
            ) {
               line.isActive = true;
               if (i == 0) {
                  this.resizeElement = {
                     key,
                     direction: "resizeStart",
                  };
               } else if (i == points.length - 1) {
                  this.resizeElement = {
                     key,
                     direction: "resizeEnd",
                  };
               } else {
                  this.resizeElement = {
                     key,
                     direction: null,
                     index: i,
                  };
               }

               isResizing = true;
            }
         }
      });
      if (isResizing) return;

      // rect resize
      this.rectMap.forEach((rect, key) => {
         // Check for horizontal resizing
         const leftEdge = mouseX >= rect.x - this.tolerance && mouseX <= rect.x;
         const rightEdge =
            mouseX >= rect.x + rect.width &&
            mouseX <= rect.x + rect.width + this.tolerance;
         const verticalBounds =
            mouseY >= rect.y + this.tolerance &&
            mouseY <= rect.y + rect.height - this.tolerance;

         // horizontel resizing parameters
         if (leftEdge && verticalBounds) {
            rect.isActive = true;
            isResizing = true;
            this.isDraggingOrResizing = true;
            this.resizeElement = {
               direction: "left-edge",
               key,
               x: rect.x + rect.width,
            };
         } else if (rightEdge && verticalBounds) {
            rect.isActive = true;
            isResizing = true;
            this.resizeElement = {
               direction: "right-edge",
               key,
               x: rect.x,
            };
         }

         // vertical resizing parameters//
         const withinTopEdge =
            mouseY >= rect.y - this.tolerance &&
            mouseY <= rect.y + this.tolerance;
         const withinBottomEdge =
            mouseY >= rect.y + rect.height - this.tolerance &&
            mouseY <= rect.y + rect.height + this.tolerance;
         const withinHorizontalBounds =
            mouseX > rect.x + this.tolerance &&
            mouseX < rect.x + rect.width - this.tolerance;

         if (withinTopEdge && withinHorizontalBounds) {
            rect.isActive = true;
            rect.verticalResizing = true;
            isResizing = true;
            this.resizeElement = {
               direction: "top-edge",
               key,
               y: rect.y + rect.height,
            };
         } else if (withinBottomEdge && withinHorizontalBounds) {
            rect.isActive = true;
            rect.verticalResizing = true;
            isResizing = true;
            this.resizeElement = {
               direction: "bottom-edge",
               key,
               y: rect.y,
            };
         }

         // Check for corners resize
         const withinTopLeftCorner =
            mouseX >= rect.x - this.tolerance &&
            mouseX <= rect.x + this.tolerance &&
            mouseY >= rect.y - this.tolerance &&
            mouseY <= rect.y + this.tolerance;

         const withinTopRightCorner =
            mouseX >= rect.x + rect.width - this.tolerance &&
            mouseX <= rect.x + rect.width + this.tolerance &&
            mouseY >= rect.y - this.tolerance &&
            mouseY <= rect.y + this.tolerance;

         const withinBottomLeftCorner =
            mouseX >= rect.x - this.tolerance &&
            mouseX <= rect.x + this.tolerance &&
            mouseY >= rect.y + rect.height - this.tolerance &&
            mouseY <= rect.y + rect.height + this.tolerance;

         const withinBottomRightCorner =
            mouseX >= rect.x + rect.width - this.tolerance &&
            mouseX <= rect.x + rect.width + this.tolerance &&
            mouseY >= rect.y + rect.height - this.tolerance &&
            mouseY <= rect.y + rect.height + this.tolerance;

         // resize corners
         [
            { cond: withinBottomLeftCorner, d: "bottom-left" },
            { cond: withinBottomRightCorner, d: "bottom-right" },
            { cond: withinTopLeftCorner, d: "top-left" },
            { cond: withinTopRightCorner, d: "top-right" },
         ].forEach((any) => {
            if (any.cond) {
               isResizing = true;
               this.resizeElement = {
                  key,
                  rectMaxX: rect.x + rect.width,
                  rectMaxY: rect.y + rect.height,
                  direction: any.d,
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
               };
               return;
            }
         });
      });

      if (isResizing) return;
      // sphere resize
      this.circleMap.forEach((arc, key) => {
         const forXless = arc.x - arc.xRadius;
         const forXmore = arc.x + arc.xRadius;
         const forYless = arc.y - arc.yRadius;
         const forYmore = arc.y + arc.yRadius;

         //horizontel resizing
         const leftEdge =
            mouseX >= forXless - this.tolerance && mouseX <= forXless;
         const rightEdge =
            mouseX >= forXmore && mouseX <= forXmore + this.tolerance;
         const verticalBounds =
            mouseY >= forYless + this.tolerance &&
            mouseY <= forYmore - this.tolerance;

         if ((leftEdge || rightEdge) && verticalBounds) {
            arc.isActive = true; // Set the circle as active
            arc.horizontelResizing = true; // Set the horizontal resizing flag
            isResizing = true;
            this.resizeElement = { direction: "horizontel", key };
         }

         //vertical resizing
         const topEdge =
            mouseY >= forYless - this.tolerance && mouseY <= forYless;
         const bottomEdge =
            mouseY >= forYmore && mouseY <= forYmore + this.tolerance;
         const horizontalBounds =
            mouseX >= forXless + this.tolerance &&
            mouseX <= forXmore - this.tolerance;

         if ((topEdge || bottomEdge) && horizontalBounds) {
            arc.isActive = true;
            arc.verticalResizing = true; // set vertical resizing to true
            this.resizeElement = { direction: "vertical", key };
            isResizing = true;
         }

         //full resize
         if (
            // Top-left corner
            (mouseX >= forXless &&
               mouseX < forXless + this.tolerance &&
               mouseY > forYless - this.tolerance &&
               mouseY <= forYless) ||
            // Top-right corner
            (mouseX >= forXmore &&
               mouseX < forXmore + this.tolerance &&
               mouseY > forYless - this.tolerance &&
               mouseY <= forYless) ||
            // Bottom-left corner
            (mouseX >= forXless - this.tolerance &&
               mouseX <= forXless &&
               mouseY >= forYmore &&
               mouseY <= forYmore + this.tolerance) ||
            // Bottom-right corner
            (mouseX >= forXmore &&
               mouseX <= forXmore + this.tolerance &&
               mouseY >= forYmore &&
               mouseY <= forYmore + this.tolerance)
         ) {
            arc.isActive = true;
            arc.isResizing = true;
            this.resizeElement = { direction: "corners", key };
            isResizing = true;
         }
      });

      if (isResizing) return;

      //text resize
      this.textMap.forEach((text, key) => {
         if (
            mouseX > text.x + text.width - this.tolerance &&
            mouseX <= text.x + text.width + this.tolerance &&
            mouseY > text.y + text.height - this.tolerance &&
            mouseY <= text.y + text.height + this.tolerance
         ) {
            isResizing = true;
            // text.isResizing = true;
            this.resizeElement = { key };
         }
      });

      if (isResizing) return;

      let smallestCircle = null;
      let smallestRect = null;
      let smallestText = null;
      let line = null;

      const checkRect = (rect, key) => {
         if (rect.isActive) rect.isActive = false;
         if (
            mouseX >= rect.x &&
            mouseX <= rect.x + rect.width &&
            mouseY >= rect.y &&
            mouseY <= rect.y + rect.height
         ) {
            if (smallestRect === null || rect.width < smallestRect.rect.width) {
               smallestRect = { rect: rect, key };
            }
         }
         if (rect.isActive) rect.isActive = false;
      };

      const checkCircle = (sphere, key) => {
         const distance = Math.sqrt(
            (mouseX - sphere.x) ** 2 + (mouseY - sphere.y) ** 2
         );

         if (sphere.isActive) sphere.isActive = false;
         if (distance < sphere.xRadius && distance < sphere.yRadius) {
            if (
               smallestCircle === null ||
               sphere.xRadius < smallestCircle.circle.xRadius
            ) {
               smallestCircle = { circle: sphere, key };
            }
         }
      };

      const checkText = (text, key) => {
         if (
            mouseX >= text.x &&
            mouseX <= text.x + text.width &&
            mouseY >= text.y &&
            mouseY <= text.y + text.height
         ) {
            if (smallestText === null || text.width < smallestText.text.width) {
               smallestText = { text, key };
            }
         }
         if (text.isActive) text.isActive = false;
      };

      const simpleLine = (l, key) => {
         const width = l.maxX - l.minX;
         let horizontelParams = width < 5 ? -this.tolerance : +this.tolerance;
         let verticalParams =
            l.maxY - l.minY < 5 ? -this.tolerance : +this.tolerance;

         if (l.isActive) l.isActive = false;
         if (
            mouseX >= l.minX + horizontelParams &&
            mouseX <= l.maxX - horizontelParams &&
            mouseY >= l.minY + verticalParams &&
            mouseY <= l.maxY - verticalParams
         ) {
            if (line === null || line.l.maxX - line.l.minX > width) {
               line = { l, key };
            }
         }
      };

      this.rectMap.forEach(checkRect);
      this.circleMap.forEach(checkCircle);
      this.textMap.forEach(checkText);
      this.lineMap.forEach(simpleLine);

      const setDragging = (obj) => {
         obj.isActive = true;
         obj.offsetX = mouseX - obj.x;
         obj.offsetY = mouseY - obj.y;
      };

      if (
         smallestCircle &&
         (!smallestRect ||
            smallestCircle?.circle.xRadius * 2 < smallestRect?.rect.width) &&
         (!smallestText ||
            smallestCircle?.circle.xRadius * 2 < smallestText?.text.width)
      ) {
         setDragging(smallestCircle.circle);
         this.dragElement = smallestCircle.key;
         config.currentActive = smallestCircle.circle;
      } else if (
         smallestRect &&
         (!smallestCircle ||
            smallestRect?.rect.width < smallestCircle?.circle.xRadius * 2) &&
         (!smallestText ||
            smallestRect?.rect.width < smallestText?.text.width) &&
         (!line || smallestRect?.rect.width < line?.l.maxX - line?.l.minX)
      ) {
         setDragging(smallestRect.rect);
         this.dragElement = smallestRect.key;
         config.currentActive = smallestRect.rect;
      } else if (
         line &&
         (!smallestRect || line.l.maxX - line.l.minX < smallestRect?.rect.width)
      ) {
         if (line.l.pointTo && line.l.endTo) return;
         line.l.curvePoints.forEach((e) => {
            e.offsetX = mouseX - e.x;
            e.offsetY = mouseY - e.y;
         });
         line.l.isActive = true;
         this.dragElement = line.key;
         config.currentActive = line.l;
      } else if (smallestText) {
         setDragging(smallestText.text);
         this.dragElement = smallestText.key;
         config.currentActive = smallestText.text;
      }
      this.draw();
   }

   updateCurvePoint = (object, x, y, index) => {
      object.curvePoints[index].x = x;
      object.curvePoints[index].y = y;
   };

   mouseMove(e) {
      if (config.mode === "pencil") return;

      if (!this.resizeElement && !this.dragElement) return;
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

      let rectResize = this.rectMap.get(this.resizeElement?.key);
      let circleResize = this.circleMap.get(this.resizeElement?.key);
      let textResize = this.textMap.get(this.resizeElement?.key);
      let lineResize = this.lineMap.get(this.resizeElement?.key);

      if (rectResize) {
         if (this.resizeElement.direction === "left-edge") {
            const { x } = this.resizeElement;
            if (mouseX < x) {
               rectResize.x = mouseX;
               rectResize.width = x - mouseX;
            } else if (mouseX > x) {
               rectResize.x = x;
               rectResize.width = mouseX - x;
            }
         } else if (this.resizeElement.direction === "right-edge") {
            const { x } = this.resizeElement;
            if (mouseX > x) {
               rectResize.width = mouseX - x;
            } else if (mouseX < x) {
               rectResize.x = mouseX;
               rectResize.width = x - mouseX;
            }
         } else if (this.resizeElement.direction === "top-edge") {
            const { y } = this.resizeElement;
            if (mouseY < y) {
               rectResize.y = mouseY;
               rectResize.height = y - mouseY;
            } else if (mouseY > y) {
               rectResize.y = y;
               rectResize.height = mouseY - y;
            }
         } else if (this.resizeElement.direction === "bottom-edge") {
            const { y } = this.resizeElement;
            if (mouseY > y) {
               rectResize.height = mouseY - y;
            } else if (mouseY < y) {
               rectResize.y = mouseY;
               rectResize.height = y - mouseY;
            }
         } else {
            const direction = this.resizeElement.direction;
            let { rectMaxX, rectMaxY, x, y, height, width } =
               this.resizeElement;

            switch (direction) {
               case "top-left":
                  rectResize.x = Math.min(mouseX, rectMaxX);
                  rectResize.y = Math.min(mouseY, rectMaxY);
                  rectResize.width = Math.abs(rectMaxX - mouseX);
                  rectResize.height = Math.abs(rectMaxY - mouseY);
                  break;

               case "top-right":
                  if (mouseX > x) {
                     rectResize.width = mouseX - x;
                  } else if (mouseX < x) {
                     rectResize.x = mouseX;
                     rectResize.width = x - mouseX;
                  }
                  if (mouseY < y + height) {
                     rectResize.y = mouseY;
                     rectResize.height = y + height - mouseY;
                  } else if (mouseY > height + y) {
                     rectResize.y = y + height;
                     rectResize.height = mouseY - rectResize.y;
                  }

                  break;

               case "bottom-left":
                  if (mouseX < x + width) {
                     rectResize.x = mouseX;
                     rectResize.width = x + width - mouseX;
                  } else if (mouseX > x + width) {
                     rectResize.x = x + width;
                     rectResize.width = mouseX - rectResize.x;
                  }

                  if (mouseY > y) {
                     rectResize.height = mouseY - y;
                  } else if (mouseY < y) {
                     rectResize.height = y - mouseY;
                     rectResize.y = mouseY;
                  }

                  break;

               case "bottom-right":
                  if (mouseX > x) rectResize.width = mouseX - rectResize.x;
                  else if (mouseX < x) {
                     rectResize.x = mouseX;
                     rectResize.width = x - mouseX;
                  }
                  if (mouseY > y) rectResize.height = mouseY - rectResize.y;
                  else if (mouseY < y) {
                     rectResize.y = mouseY;
                     rectResize.height = y - mouseY;
                  }

                  break;

               default:
                  break;
            }
         }
      } else if (circleResize) {
         if (this.resizeElement.direction === "horizontel") {
            circleResize.isActive = true;
            circleResize.xRadius = Math.abs(mouseX - circleResize.x);
         } else if (this.resizeElement.direction === "vertical") {
            circleResize.isActive = true;
            circleResize.yRadius = Math.abs(mouseY - circleResize.y);
         } else {
            circleResize.isActive = true;
            circleResize.xRadius = Math.abs(mouseX - circleResize.x);
            circleResize.yRadius = Math.abs(mouseY - circleResize.y);
         }
      } else if (textResize) {
         textResize.textSize = Math.max(
            mouseX - textResize.x * 1.5,
            mouseY - textResize.y * 1
         ); // Ensure minimum size
      } else if (lineResize) {
         if (this.resizeElement.direction === null) {
            lineResize.curvePoints[this.resizeElement.index].x = mouseX;
            lineResize.curvePoints[this.resizeElement.index].y = mouseY;
            this.updateLineMinMax(this.resizeElement?.key);
         } else if (this.resizeElement.direction === "resizeStart") {
            lineResize.curvePoints[0].x = mouseX;
            lineResize.curvePoints[0].y = mouseY;
            if (mouseX > lineResize.maxX) {
               lineResize.maxX = mouseX;
            }
            if (mouseX < lineResize.minX) {
               lineResize.minX = mouseX;
            }
            if (mouseY > lineResize.maxY) {
               lineResize.maxY = mouseY;
            }
            if (mouseY < lineResize.minY) {
               lineResize.minY = mouseY;
            }
            this.lineConnectParams(mouseX, mouseY);
         } else if (this.resizeElement.direction === "resizeEnd") {
            lineResize.curvePoints[lineResize.curvePoints.length - 1].x =
               mouseX;
            if (Math.abs(lineResize.curvePoints[0].y - mouseY) <= 10) {
               lineResize.curvePoints[lineResize.curvePoints.length - 1].y =
                  lineResize.curvePoints[0].y;
            } else
               lineResize.curvePoints[lineResize.curvePoints.length - 1].y =
                  mouseY;
            this.lineConnectParams(mouseX, mouseY);
            this.updateLineMinMax(this.resizeElement?.key);
         }
      }

      if (this.resizeElement?.key) {
         this.draw();
         return;
      }

      let rect = this.rectMap.get(this.dragElement);
      let arc = this.circleMap.get(this.dragElement);
      let text = this.textMap.get(this.dragElement);
      let line = this.lineMap.get(this.dragElement);

      if (rect) {
         rect.isActive = true;
         rect.x = mouseX - rect.offsetX;
         rect.y = mouseY - rect.offsetY;

         this.showGuides(
            rect.x,
            rect.y,
            rect.width,
            rect.height,
            this.dragElement,
            rect
         );
         //  this.drawRenderCanvas(rect.type, rect);

         if (rect.pointTo?.length > 0) {
            let line = [];
            let arrowEndRect = [];
            let arrowStartRect = [];

            const updateCurvePoint = (object, x, y, index) => {
               object.curvePoints[index].x = x;
               object.curvePoints[index].y = y;
            };

            rect.pointTo.forEach((a) => {
               let l = this.lineMap.get(a);
               if (l) line.push(l);
            });

            // get all the arrows connected to rect

            if (line.length > 0) {
               line.forEach((l) => {
                  let start = this.rectMap.get(l.startTo);
                  let end = this.rectMap.get(l.endTo);
                  if (start) {
                     arrowStartRect.push(start);
                  }
                  if (end) {
                     arrowEndRect.push(end);
                  }
               });
            }

            if (arrowStartRect.length > 0) {
               arrowStartRect.forEach((ar) => {
                  if (ar === rect) {
                     line.forEach((l) => {
                        if (this.rectMap.get(l.startTo) === rect) {
                           const {
                              rect: r,
                              text: t,
                              sphere: s,
                           } = this.getShape(l.endTo);

                           const { curvePoints, lineType } = l;
                           const last = curvePoints.length - 1;
                           const lastPoint = curvePoints[last];
                           const rectMidX = rect.x + rect.width * 0.5;
                           const rectMidY = rect.y + rect.height * 0.5;

                           if (lineType === "elbow") {
                              if (curvePoints[last].y < rect.y) {
                                 updateCurvePoint(
                                    l,
                                    rect.x + rect.width / 2,
                                    rect.y,
                                    0
                                 );
                                 if (r) {
                                    updateCurvePoint(
                                       l,
                                       r.x + r.width / 2,
                                       r.y + r.height,
                                       1
                                    );
                                 } else if (t) {
                                    updateCurvePoint(
                                       l,
                                       t.x + t.width / 2,
                                       t.y + t.height,
                                       1
                                    );
                                 } else if (s) {
                                    updateCurvePoint(
                                       l,
                                       s.x,
                                       s.y + s.yRadius,
                                       1
                                    );
                                 }
                              } else if (
                                 curvePoints[last].y > rect.y &&
                                 curvePoints[last].y < rect.y + rect.height
                              ) {
                                 if (
                                    curvePoints[last].x <
                                    rect.x + rect.width / 2
                                 ) {
                                    curvePoints[0].x = rect.x;
                                    if (r) {
                                       curvePoints[last].x = r.x + r.width;
                                    } else if (t) {
                                       curvePoints[last].x = t.x + t.width;
                                    } else if (s) {
                                       curvePoints[last].x = s.x + s.xRadius;
                                    }
                                 } else {
                                    curvePoints[0].x = rect.x + rect.width;
                                    if (r) {
                                       curvePoints[last].x = r.x;
                                    } else if (t) {
                                       curvePoints[last].x = t.x;
                                    } else if (s) {
                                       curvePoints[last].x = s.x - s.xRadius;
                                    }
                                 }
                                 curvePoints[0].y = rect.y + rect.height / 2;
                                 if (r) {
                                    curvePoints[last].y = r.y + r.height / 2;
                                 } else if (t) {
                                    curvePoints[last].y = t.y + t.height / 2;
                                 } else if (s) {
                                    curvePoints[last].y = s.y;
                                 }
                              } else {
                                 updateCurvePoint(
                                    l,
                                    rect.x + rect.width / 2,
                                    rect.y + rect.height,
                                    0
                                 );

                                 if (r) {
                                    updateCurvePoint(
                                       l,
                                       r.x + r.width / 2,
                                       r.y,
                                       1
                                    );
                                 } else if (t) {
                                    updateCurvePoint(
                                       l,
                                       t.x + t.width / 2,
                                       t.y,
                                       1
                                    );
                                 } else if (s) {
                                    updateCurvePoint(
                                       l,
                                       s.x,
                                       s.y - s.xRadius,
                                       1
                                    );
                                 }
                              }
                           } else {
                              if (lastPoint.y < rect.y) {
                                 updateCurvePoint(rectMidX, rect.y);
                              } else if (
                                 lastPoint.y >= rect.y &&
                                 lastPoint.y <= rect.y + rect.height
                              ) {
                                 if (lastPoint.x > rect.x) {
                                    updateCurvePoint(
                                       rect.x + rect.width,
                                       rectMidY
                                    );
                                 } else {
                                    updateCurvePoint(rect.x, rectMidY);
                                 }
                              } else {
                                 updateCurvePoint(
                                    rectMidX,
                                    rect.y + rect.height
                                 );
                              }
                           }
                        }
                     });
                  }
               });
            }

            if (arrowEndRect.length > 0) {
               arrowEndRect.forEach((ar) => {
                  if (ar === rect) {
                     line.forEach((l) => {
                        if (this.rectMap.get(l.endTo) === rect) {
                           // get the shape if connect to start
                           const {
                              rect: r,
                              text: t,
                              sphere: s,
                           } = this.getShape(l.startTo);
                           const last = l.curvePoints.length - 1;
                           const { curvePoints } = l;
                           if (l.lineType === "elbow") {
                              if (curvePoints[0].y < rect.y) {
                                 curvePoints[last].x = rect.x + rect.width / 2;
                                 curvePoints[last].y = rect.y;
                                 if (r) {
                                    updateCurvePoint(
                                       l,
                                       r.x + r.width / 2,
                                       r.y + r.height,
                                       0
                                    );
                                 } else if (t) {
                                    updateCurvePoint(
                                       l,
                                       t.x + t.width / 2,
                                       t.y + t.height,
                                       0
                                    );
                                 } else if (s) {
                                    updateCurvePoint(
                                       l,
                                       s.x,
                                       s.y + s.yRadius,
                                       0
                                    );
                                 }
                              } else if (
                                 curvePoints[0].y > rect.y &&
                                 curvePoints[0].y < rect.y + rect.height
                              ) {
                                 if (
                                    curvePoints[0].x <
                                    rect.x + rect.width / 2
                                 ) {
                                    curvePoints[last].x = rect.x;
                                    if (r) {
                                       curvePoints[0].x = r.x + r.width;
                                    } else if (t) {
                                       curvePoints[0].x = t.x + t.width;
                                    } else if (s) {
                                       curvePoints[0].x = s.x + s.xRadius;
                                    }
                                 } else {
                                    curvePoints[last].x = rect.x + rect.width;
                                    if (r) {
                                       curvePoints[0].x = r.x;
                                    } else if (t) {
                                       curvePoints[0].x = t.x;
                                    } else if (s) {
                                       curvePoints[0].x = s.x - s.xRadius;
                                    }
                                 }
                                 curvePoints[last].y = rect.y + rect.height / 2;
                                 if (r) {
                                    curvePoints[0].y = r.y + r.height / 2;
                                 } else if (t) {
                                    curvePoints[0].y = t.y + t.height / 2;
                                 } else if (s) {
                                    curvePoints[0].y = s.y;
                                 }
                              } else if (
                                 curvePoints[0].y >
                                 rect.y + rect.height
                              ) {
                                 curvePoints[last].x = rect.x + rect.width / 2;
                                 curvePoints[last].y = rect.y + rect.height;
                                 if (r) {
                                    updateCurvePoint(
                                       l,
                                       r.x + r.width / 2,
                                       r.y,
                                       0
                                    );
                                 } else if (t) {
                                    updateCurvePoint(
                                       l,
                                       t.x + t.width / 2,
                                       t.y,
                                       0
                                    );
                                 } else if (s) {
                                    updateCurvePoint(
                                       l,
                                       s.x,
                                       s.y - s.xRadius,
                                       0
                                    );
                                 }
                              }
                           }
                        }
                     });
                  }
               });
            }
         }
      } else if (arc) {
         arc.isActive = true;
         arc.x = mouseX - arc.offsetX;
         arc.y = mouseY - arc.offsetY;
         this.showGuides(
            arc.x - arc.xRadius,
            arc.y - arc.yRadius,
            2 * arc.xRadius,
            2 * arc.xRadius,
            this.dragElement,
            arc
         );
         //  this.drawRenderCanvas(arc.type, arc);
         if (arc.pointTo?.length > 0) {
            let line = [];
            let arrowStartSphere = [];
            let arrowEndSphere = [];
            arc.pointTo.forEach((a) => {
               let l = this.lineMap.get(a);

               if (l) line.push(l);
            });

            line.forEach((l) => {
               let start = this.circleMap.get(l.startTo);
               let end = this.circleMap.get(l.endTo);
               if (start) {
                  arrowStartSphere.push(start);
               }
               if (end) {
                  arrowEndSphere.push(end);
               }
            });

            if (arrowStartSphere.length > 0) {
               arrowStartSphere.forEach((ar) => {
                  if (ar == arc) {
                     line.forEach((l) => {
                        if (this.circleMap.get(l.startTo) === arc) {
                           const { curvePoints, endTo } = l;
                           const {
                              rect: r,
                              text: t,
                              sphere: s,
                           } = this.getShape(endTo);
                           const last = curvePoints.length - 1;

                           if (curvePoints[last].y < arc.y - arc.yRadius) {
                              this.updateCurvePoint(
                                 l,
                                 arc.x,
                                 arc.y - arc.yRadius,
                                 0
                              );
                              if (r) {
                                 this.updateCurvePoint(
                                    l,
                                    r.x + r.width / 2,
                                    r.y + r.height,
                                    1
                                 );
                              } else if (t) {
                                 this.updateCurvePoint(
                                    l,
                                    t.x + t.width / 2,
                                    t.y + t.height,
                                    1
                                 );
                              } else if (s) {
                                 this.updateCurvePoint(
                                    l,
                                    s.x,
                                    s.y + s.yRadius,
                                    1
                                 );
                              }
                           } else if (
                              curvePoints[last].y > arc.y - arc.yRadius &&
                              curvePoints[last].y < arc.y + arc.yRadius
                           ) {
                              if (curvePoints[last].x < arc.x - arc.xRadius) {
                                 l.curvePoints[0].x = arc.x - arc.xRadius;
                              } else {
                                 l.curvePoints[0].x = arc.x + arc.xRadius;
                              }
                              l.curvePoints[0].y = arc.y;
                           } else if (
                              curvePoints[last].y >
                              arc.y + arc.yRadius
                           ) {
                              l.curvePoints[0].y = arc.y + arc.yRadius;
                              l.curvePoints[0].x = arc.x;
                              if (r) {
                                 this.updateCurvePoint(
                                    l,
                                    r.x + r.width / 2,
                                    r.y,
                                    last
                                 );
                              } else if (t) {
                                 this.updateCurvePoint(
                                    l,
                                    t.x + t.width / 2,
                                    t.y,
                                    last
                                 );
                              } else if (s) {
                                 this.updateCurvePoint(
                                    l,
                                    s.x,
                                    s.y - s.yRadius,
                                    last
                                 );
                              }
                           }
                        }
                     });
                  }
               });
            }
            if (arrowEndSphere.length > 0) {
               arrowEndSphere.forEach((ar) => {
                  if (ar == arc) {
                     line.forEach((l) => {
                        if (this.circleMap.get(l.endTo) === arc) {
                           const { startTo, curvePoints } = l;
                           const {
                              rect: r,
                              text: t,
                              sphere: s,
                           } = this.getShape(startTo);

                           const last = l.curvePoints.length - 1;
                           if (curvePoints[0].y < arc.y - arc.yRadius) {
                              this.updateCurvePoint(
                                 l,
                                 arc.x,
                                 arc.y - arc.yRadius,
                                 last
                              );
                              if (r) {
                                 this.updateCurvePoint(
                                    l,
                                    r.x + r.width / 2,
                                    r.y + r.height,
                                    0
                                 );
                              } else if (t) {
                                 this.updateCurvePoint(
                                    l,
                                    t.x + t.width / 2,
                                    t.y + t.height,
                                    0
                                 );
                              } else if (s) {
                                 this.updateCurvePoint(
                                    l,
                                    s.x,
                                    s.y + s.yRadius,
                                    0
                                 );
                              }
                           } else if (
                              curvePoints[0].y > arc.y - arc.yRadius &&
                              curvePoints[0].y < arc.y + arc.yRadius
                           ) {
                              if (l.curvePoints[0].x < arc.x) {
                                 l.curvePoints[last].x = arc.x - arc.xRadius;
                                 if (r) {
                                    l.curvePoints[0].x = r.x + r.width;
                                 } else if (t) {
                                    l.curvePoints[0].y = t.x + t.width;
                                 } else if (s) {
                                    l.curvePoints[0].y = s.x + s.xRadius;
                                 }
                              } else {
                                 l.curvePoints[last].x = arc.x + arc.xRadius;
                                 if (r) {
                                    l.curvePoints[0].x = r.x;
                                 } else if (t) {
                                    l.curvePoints[0].x = t.x;
                                 } else if (s) {
                                    l.curvePoints[0].x = s.x - s.xRadius;
                                 }
                              }

                              l.curvePoints[last].y = arc.y;
                              if (r) {
                                 l.curvePoints[0].y = r.y + r.height / 2;
                              } else if (t) {
                                 l.curvePoints[0].y = t.y + t.height / 2;
                              } else if (s) {
                                 l.curvePoints[0].y = s.y;
                              }
                           } else {
                              this.updateCurvePoint(
                                 l,
                                 arc.x,
                                 arc.y + arc.yRadius,
                                 last
                              );

                              if (r) {
                                 this.updateCurvePoint(
                                    l,
                                    r.x + r.with / 2,
                                    r.y,
                                    0
                                 );
                              } else if (t) {
                                 this.updateCurvePoint(
                                    l,
                                    t.x + t.with / 2,
                                    t.y,
                                    0
                                 );
                              } else if (s) {
                                 this.updateCurvePoint(
                                    l,
                                    s.x,
                                    s.y - s.yRadius,
                                    0
                                 );
                              }
                           }
                        }
                     });
                  }
               });
            }
         }
      } else if (text) {
         text.x = mouseX - text.offsetX;
         text.y = mouseY - text.offsetY;
         this.showGuides(
            text.x,
            text.y,
            text.width,
            text.height,
            this.dragElement,
            text
         );

         //  this.drawRenderCanvas("text", text);
         if (text.pointTo.length > 0) {
            let arcs = text.pointTo.map((t) => {
               return this.lineMap.get(t);
            });
            let lineStart = [];
            let lineEnd = [];

            arcs.forEach((a) => {
               let start = this.textMap.get(a.startTo);
               let end = this.textMap.get(a.endTo);
               if (start) {
                  lineStart.push(start);
               }
               if (end) {
                  lineEnd.push(end);
               }
            });

            if (lineStart.length > 0) {
               lineStart.forEach((ar) => {
                  if (ar === text) {
                     arcs.forEach((a) => {
                        const length = a.curvePoints.length - 1;
                        if (this.textMap.get(a.startTo) === text) {
                           if (a.curvePoints[length].y < a.curvePoints[0].y) {
                              a.curvePoints[0].y = text.y - this.tolerance;
                           } else
                              a.curvePoints[0].y =
                                 text.y + text.height + this.tolerance;

                           a.curvePoints[0].x =
                              text.x + (text.width + text.x - text.x) * 0.5;
                        }
                     });
                  }
               });
            }

            if (lineEnd.length > 0) {
               lineEnd.forEach((ar) => {
                  if (ar === text) {
                     arcs.forEach((a) => {
                        const length = a.curvePoints.length - 1;
                        if (this.textMap.get(a.endTo) === text) {
                           if (a.curvePoints[0].y < a.curvePoints[length].y) {
                              a.curvePoints[length].x =
                                 text.x + (text.width + text.x - text.x) * 0.5;
                              a.curvePoints[length].y = text.y - this.tolerance;
                           } else {
                              a.curvePoints[length].x =
                                 text.x + (text.width + text.x - text.x) * 0.5;
                              a.curvePoints[length].y =
                                 text.y + text.height + this.tolerance;
                           }
                        }
                     });
                  }
               });
            }
         }
      } else if (line) {
         line.curvePoints.forEach((ele) => {
            const deltaX = mouseX - ele.offsetX;
            const deltaY = mouseY - ele.offsetY;
            this.showGuides(
               line.curvePoints[0].x,
               line.curvePoints[0].y,
               line.maxX - line.minX,
               line.maxY - line.minY,
               this.dragElement,
               line
            );
            ele.x = deltaX;
            ele.y = deltaY;
         });
      }
      this.draw();
   }

   mouseUp(e) {
      if (config.mode === "pencil" || config.mode === "handsFree") return;

      this.canvas.removeEventListener("mousemove", this.mouseMove.bind(this));
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

      const rect = this.rectMap.get(this.resizeElement?.key);
      const line = this.lineMap.get(this.resizeElement?.key);
      const sphere = this.circleMap.get(this.resizeElement?.key);

      if (rect) {
         rect.isActive = true;
         const { x, y, width, height } = rect;
         if (height < 20) rect.height = 25;
         if (width < 20) rect.width = 25;
         if (this.dragElement?.key)
            this.updateGuides(
               this.dragElement.key,
               x,
               y,
               x + width,
               y + height
            );
      } else if (line) {
         const key = this.resizeElement.key;
         if (this.resizeElement.direction === "resizeStart") {
            if (line.startTo) {
               const { rect, sphere, text } = this.getShape(line.startTo);

               if (rect && rect.pointTo.length > 0) {
                  if (
                     line.curvePoints[0].x < rect.x ||
                     line.curvePoints[0].x > rect.x + rect.width ||
                     line.curvePoints[0].y < rect.y ||
                     line.curvePoints[0].y > rect.y + rect.height
                  ) {
                     rect.pointTo.filter((r) => {
                        return r !== key;
                     });
                     line.startTo = null;
                  }
               }

               if (sphere && sphere.pointTo.length > 0) {
                  const distance = Math.sqrt(
                     (line.curvePoints[0].x - sphere.x) ** 2 -
                        (line.curvePoints[0].y - sphere.y) ** 2
                  );
                  if (distance > sphere.xRadius || distance > sphere.yRadius) {
                     sphere.pointTo.filter((s) => s !== key);
                     line.startTo = null;
                  }
               }

               if (text && text.pointTo.length > 0) {
                  if (
                     line.curvePoints[0].x < text.x ||
                     line.curvePoints[0].x > text.x + text.width ||
                     line.curvePoints[0].y < text.y ||
                     line.curvePoints[0].y > text.y + text.height
                  ) {
                     text.pointTo.filter((r) => {
                        return r !== key;
                     });
                     line.startTo = null;
                  }
               }
            }
            this.rectMap.forEach((rect, rectKey) => {
               const { x, y, width, height } = rect;
               if (
                  (mouseX >= x &&
                     mouseX <= x + width &&
                     mouseY >= y &&
                     mouseY <= y + this.tolerance) ||
                  (mouseX >= x &&
                     mouseX <= x + this.tolerance &&
                     mouseY >= y &&
                     mouseY <= y + height) ||
                  (mouseX >= x &&
                     mouseX <= x + width &&
                     mouseY >= y + height - this.tolerance &&
                     mouseY <= y + height) ||
                  (mouseX >= x + width - this.tolerance &&
                     mouseX <= x + width &&
                     mouseY >= y &&
                     mouseY <= y + height)
               ) {
                  let end = this.rectMap.get(line.endTo);
                  if (end && end === rect) return;
                  rect.pointTo.push(key);
                  line.startTo = rectKey;
               }
            });

            this.circleMap.forEach((circle, circleKey) => {
               const { xRadius, yRadius, x, y } = circle;
               const distance = Math.sqrt(
                  (mouseX - x) ** 2 + (mouseY - y) ** 2
               );

               if (
                  Math.abs(distance - xRadius) <= this.tolerance &&
                  Math.abs(distance - yRadius) <= this.tolerance
               ) {
                  if (circleKey === line.endTo) return;
                  circle.pointTo.push(key);
                  line.startTo = circleKey;
               }
            });

            this.textMap.forEach((text, textKey) => {
               if (
                  line.curvePoints[0].x >= text.x &&
                  line.curvePoints[0].x <= text.x + text.width &&
                  line.curvePoints[0].y >= text.y &&
                  line.curvePoints[0].y <= text.y + text.height
               ) {
                  if (textKey === line.endTo) return;
                  text.pointTo.push(key);
                  line.startTo = textKey;
               }
            });
         } else if (this.resizeElement.direction === "resizeEnd") {
            const length = line.curvePoints.length - 1;

            if (line.endTo) {
               const { rect, sphere, text } = this.getShape(line.startTo);
               if (rect && rect.pointTo.length > 0) {
                  if (
                     line.curvePoints[length].x < rect.x ||
                     line.curvePoints[length].x > rect.x + rect.width ||
                     line.curvePoints[length].y < rect.y ||
                     line.curvePoints[length].y > rect.y + rect.height
                  ) {
                     rect.pointTo.filter((r) => {
                        return r !== key;
                     });
                     line.endTo = null;
                  }
               }

               if (sphere && sphere.pointTo.length > 0) {
                  const distance = Math.sqrt(
                     (line.curvePoints[length].x - sphere.x) ** 2 -
                        (line.curvePoints[length].y - sphere.y) ** 2
                  );
                  if (distance > sphere.xRadius || distance > sphere.yRadius) {
                     sphere.pointTo.filter((s) => s !== key);
                     line.endTo = null;
                  }
               }

               if (text && text.pointTo.length > 0) {
                  if (
                     line.curvePoints[length].x < text.x ||
                     line.curvePoints[length].x > text.x + text.width ||
                     line.curvePoints[length].y < text.y ||
                     line.curvePoints[length].y > text.y + text.height
                  ) {
                     text.pointTo.filter((r) => {
                        return r !== key;
                     });
                     line.endTo = null;
                  }
               }
            }

            this.rectMap.forEach((rect, rectKey) => {
               const { x, y, width, height, pointTo } = rect;
               if (
                  (mouseX >= x &&
                     mouseX <= x + width &&
                     mouseY >= y &&
                     mouseY <= y + this.tolerance) ||
                  (mouseX >= x &&
                     mouseX <= x + this.tolerance &&
                     mouseY >= y &&
                     mouseY <= y + height) ||
                  (mouseX >= x &&
                     mouseX <= x + width &&
                     mouseY >= y + height - this.tolerance &&
                     mouseY <= y + height) ||
                  (mouseX >= x + width - this.tolerance &&
                     mouseX <= x + width &&
                     mouseY >= y &&
                     mouseY <= y + height)
               ) {
                  let start = this.rectMap.get(line.startTo);
                  if (start && start === rect) return;
                  pointTo.push(key);
                  line.endTo = rectKey;
               }
            });
            this.circleMap.forEach((circle, circleKey) => {
               const { xRadius, yRadius, x, y, pointTo } = circle;
               const distance = Math.sqrt(
                  (mouseX - x) ** 2 + (mouseY - y) ** 2
               );

               if (
                  Math.abs(distance - xRadius) <= this.tolerance &&
                  Math.abs(distance - yRadius) <= this.tolerance
               ) {
                  if (circleKey === line.startTo) return;
                  pointTo.push(key);
                  line.endTo = circleKey;
               }
            });
            this.textMap.forEach((text, textKey) => {
               if (
                  line.curvePoints[length].x >= text.x &&
                  line.curvePoints[length].x <= text.x + text.width &&
                  line.curvePoints[length].y >= text.y &&
                  line.curvePoints[length].y <= text.y + text.height
               ) {
                  if (textKey === line.startTo) return;
                  text.pointTo.push(key);
                  line.endTo = textKey;
               }
            });
         }
         line.isActive = true;
         this.updateLineMinMax(this.resizeElement.key);
      } else if (sphere) {
         sphere.isActive = true;
         if (this.resizeElement?.key) {
            this.updateGuides(
               this.resizeElement.key,
               sphere.x - sphere.xRadius,
               sphere.y - sphere.yRadius,
               sphere.x + sphere.xRadius,
               sphere.y + sphere.yRadius
            );
         }
      }

      const rectDrag = this.rectMap.get(this.dragElement);
      const arcDrag = this.circleMap.get(this.dragElement);
      const lineDrag = this.lineMap.get(this.dragElement);
      const textDrag = this.textMap.get(this.dragElement);

      if (rectDrag) {
         this.updateGuides(
            this.dragElement,
            rectDrag.x,
            rectDrag.y,
            rectDrag.x + rectDrag.width,
            rectDrag.y + rectDrag.height
         );
         if (rectDrag.pointTo?.length > 0) {
            rectDrag.pointTo.forEach((l) => {
               this.updateLineMinMax(l);
            });
         }
      } else if (arcDrag) {
         this.updateGuides(
            this.dragElement,
            arcDrag.x - arcDrag.xRadius,
            arcDrag.y - arcDrag.yRadius,
            arcDrag.x + arcDrag.xRadius,
            arcDrag.y + arcDrag.yRadius
         );
         if (arcDrag.pointTo?.length > 0) {
            arcDrag.pointTo.forEach((l) => {
               this.updateLineMinMax(l);
            });
         }
      } else if (lineDrag) {
         this.updateLineMinMax(this.dragElement);
         lineDrag.isActive = true;
      } else if (textDrag) {
         if (textDrag.pointTo.length > 0) {
            textDrag.pointTo.forEach((l) => {
               this.updateLineMinMax(l);
            });
         }
      }

      this.breakPointsCtx.clearRect(
         0,
         0,
         this.canvasBreakpoints.width,
         this.canvasBreakpoints.height
      );
      this.renderCanvasCtx.clearRect(
         0,
         0,
         this.renderCanvas.width,
         this.renderCanvas.height
      );
      this.resizeElement = null;
      this.dragElement = null;
      this.draw();
   }

   drawRenderCanvas(shape, object) {
      this.renderCanvasCtx.clearRect(
         0,
         0,
         window.innerWidth,
         window.innerHeight
      );
      this.renderCanvasCtx.save();
      this.renderCanvasCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY
      );
      this.renderCanvasCtx.scale(Scale.scale, Scale.scale);
      const drawDotsAndRect = (
         x,
         y,
         width,
         height,
         tolerance,
         isActive,
         activeColor
      ) => {
         if (isActive) {
            // Draw dots
            this.dots(
               { x: x - tolerance, y: y - tolerance },
               { x: x + width + tolerance, y: y - tolerance },
               { x: x + width + tolerance, y: y + height + tolerance },
               { x: x - tolerance, y: y + height + tolerance },
               { context: this.renderCanvasCtx }
            );

            // Draw active rectangle
            this.renderCanvasCtx.beginPath();
            this.renderCanvasCtx.strokeStyle = activeColor;
            this.renderCanvasCtx.rect(
               x - tolerance,
               y - tolerance,
               width + 2 * tolerance,
               height + 2 * tolerance
            );
            this.renderCanvasCtx.stroke();
            this.renderCanvasCtx.closePath();
         }
      };

      switch (shape) {
         case "rect":
            const {
               x,
               y,
               width,
               height,
               radius,
               lineWidth,
               borderColor,
               fillStyle,
               text,
               textSize,
               isActive,
            } = object;

            drawDotsAndRect(
               x,
               y,
               width,
               height,
               this.tolerance,
               isActive,
               this.activeColor
            );

            // Draw rounded rectangle
            this.renderCanvasCtx.beginPath();
            this.renderCanvasCtx.lineWidth = lineWidth;
            this.renderCanvasCtx.strokeStyle = borderColor;
            this.renderCanvasCtx.fillStyle = fillStyle;
            this.renderCanvasCtx.moveTo(x + radius, y);
            this.renderCanvasCtx.arcTo(
               x + width,
               y,
               x + width,
               y + height,
               radius
            );
            this.renderCanvasCtx.arcTo(
               x + width,
               y + height,
               x,
               y + height,
               radius
            );
            this.renderCanvasCtx.arcTo(x, y + height, x, y, radius);
            this.renderCanvasCtx.arcTo(x, y, x + width, y, radius);
            this.renderCanvasCtx.stroke();
            this.renderCanvasCtx.fill();
            this.renderCanvasCtx.closePath();
            break;
         case "sphere":
            drawDotsAndRect(
               object.x - object.xRadius,
               object.y - object.yRadius,
               2 * object.xRadius,
               2 * object.yRadius,
               this.tolerance,
               object.isActive,
               this.activeColor
            );

            // Draw circle
            this.renderCanvasCtx.beginPath();
            this.renderCanvasCtx.lineWidth = object.lineWidth;
            this.renderCanvasCtx.fillStyle = object.fillStyle;
            this.renderCanvasCtx.strokeStyle = object.borderColor;
            this.renderCanvasCtx.ellipse(
               object.x,
               object.y,
               object.xRadius,
               object.yRadius,
               0,
               0,
               2 * Math.PI
            );
            this.renderCanvasCtx.fill();
            this.renderCanvasCtx.stroke();
            this.renderCanvasCtx.closePath();

            break;
         case "text":
            drawDotsAndRect(
               object.x,
               object.y,
               object.width,
               object.height,
               this.tolerance,
               object.isActive,
               this.activeColor
            );
            // Set the font size and style before measuring the text
            this.renderCanvasCtx.fillStyle = object.fillStyle;
            this.renderCanvasCtx.font = `${object.textSize}px ${
               object.font || "Arial"
            }`;

            let maxWidth = 0;
            object.content.forEach((c) => {
               const textMetrics = this.context.measureText(c);
               maxWidth = Math.max(maxWidth, textMetrics.width);
            });

            // Store the measured dimensions
            object.width = maxWidth;
            object.height = object.content.length * object.textSize;

            let currentY = object.y;
            object.content.forEach((c) => {
               const textMetrics = this.renderCanvasCtx.measureText(c);
               this.renderCanvasCtx.fillText(
                  c,
                  object.x,
                  currentY + textMetrics.actualBoundingBoxAscent
               );
               currentY +=
                  textMetrics.actualBoundingBoxAscent +
                  textMetrics.actualBoundingBoxDescent +
                  this.tolerance;
            });

            break;
         case "line":
            const { curvePoints, lineType } = object;

            this.context.beginPath();
            this.context.lineWidth = object.lineWidth;

            if (object.isActive) {
               this.context.strokeStyle = this.activeColor;
               this.dots(...curvePoints, { context: this.context });
            } else {
               this.context.strokeStyle = object.borderColor;
            }

            this.context.moveTo(curvePoints[0].x, curvePoints[0].y);

            if (lineType === "straight") {
               for (let i = 1; i < curvePoints.length; i++) {
                  this.context.lineTo(curvePoints[i].x, curvePoints[i].y);
               }
            } else if (lineType === "elbow") {
               const headlen = 10;
               this.context.arcTo(
                  curvePoints[1].x,
                  curvePoints[0].y,
                  curvePoints[1].x,
                  curvePoints[1].y,
                  object.radius
               );
               this.context.lineTo(curvePoints[1].x, curvePoints[1].y);

               // Draw the arrowhead
               const lastPoint = line.curvePoints[line.curvePoints.length - 1];
               const firstPoint = line.curvePoints[0];

               // arrow back side
               if (firstPoint.y === lastPoint.y) {
                  if (firstPoint.x < lastPoint.x) {
                     // Draw the first side of the arrowhead
                     this.context.moveTo(lastPoint.x, lastPoint.y);
                     this.context.lineTo(
                        lastPoint.x - headlen,
                        lastPoint.y - 5
                     );
                     this.context.stroke();
                     this.context.closePath();

                     // Draw the second side of the arrowhead
                     this.context.beginPath();
                     this.context.moveTo(lastPoint.x, lastPoint.y);
                     this.context.lineTo(
                        lastPoint.x - headlen,
                        lastPoint.y + 5
                     );
                  } else {
                     // Draw the first side of the arrowhead
                     this.context.moveTo(lastPoint.x, lastPoint.y);
                     this.context.lineTo(
                        lastPoint.x + headlen,
                        lastPoint.y - 5
                     );
                     this.context.stroke();
                     this.context.closePath();

                     // Draw the second side of the arrowhead
                     this.context.beginPath();
                     this.context.moveTo(lastPoint.x, lastPoint.y);
                     this.context.lineTo(
                        lastPoint.x + headlen,
                        lastPoint.y + 5
                     );
                  }
               } else if (firstPoint.y < lastPoint.y) {
                  // Draw the first side of the arrowhead
                  this.context.moveTo(lastPoint.x, lastPoint.y);
                  this.context.lineTo(
                     lastPoint.x + headlen * 0.5,
                     lastPoint.y - headlen
                  );
                  this.context.stroke();
                  this.context.closePath();

                  // Draw the second side of the arrowhead
                  this.context.beginPath();
                  this.context.moveTo(lastPoint.x, lastPoint.y);
                  this.context.lineTo(
                     lastPoint.x - headlen * 0.5,
                     lastPoint.y - headlen
                  );
               } else if (firstPoint.y > lastPoint.y) {
                  // Draw the first side of the arrowhead
                  this.context.moveTo(lastPoint.x, lastPoint.y);
                  this.context.lineTo(
                     lastPoint.x + headlen * 0.5,
                     lastPoint.y + headlen
                  );
                  this.context.stroke();
                  this.context.closePath();

                  // Draw the second side of the arrowhead
                  this.context.beginPath();
                  this.context.moveTo(lastPoint.x, lastPoint.y);
                  this.context.lineTo(
                     lastPoint.x - headlen * 0.5,
                     lastPoint.y + headlen
                  );
               }

               // arrow front
            } else {
               for (let i = 1; i < curvePoints.length - 1; i++) {
                  const cp1 = curvePoints[i];
                  const cp2 = curvePoints[i + 1];
                  const t = 0.8; // Weighting factor, 0.5 for halfway, closer to 1 for closer to cp2
                  const midPointX = (1 - t) * cp1.x + t * cp2.x;
                  const midPointY = (1 - t) * cp1.y + t * cp2.y;
                  this.context.quadraticCurveTo(
                     cp1.x,
                     cp1.y,
                     midPointX,
                     midPointY
                  );
               }
               const lastPoint = curvePoints[curvePoints.length - 1];
               this.context.lineTo(lastPoint.x, lastPoint.y);
            }
            this.context.stroke();
            this.context.closePath();
            break;
         default:
            break;
      }
      this.renderCanvasCtx.restore();
   }

   showGuides(x, y, width, height, key, object) {
      // Clear the entire this.canvas

      this.breakPointsCtx.clearRect(
         0,
         0,
         this.canvasBreakpoints.width,
         this.canvasBreakpoints.height
      );

      this.breakPointsCtx.save();
      this.breakPointsCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY
      );
      this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      this.breakPointsCtx.lineWidth = 1;
      this.breakPointsCtx.strokeStyle = "red";

      // Variable to track if a guide is drawn
      let guideDrawn = false;
      this.breakPointsCtx.beginPath();
      //   this.breakpoints.forEach((point, pointKey) => {
      //      if (key !== pointKey) {
      //         if (Math.abs(point.minX - x) <= this.tolerance) {
      //            object.x =
      //               object.type === "sphere"
      //                  ? point.minX + object.xRadius
      //                  : point.minX;

      //            this.breakPointsCtx.moveTo(point.minX, y);
      //            this.breakPointsCtx.lineTo(point.minX, point.minY);
      //            return (guideDrawn = true);
      //         } else if (Math.abs(point.maxX - x) <= this.tolerance) {
      //            object.x =
      //               object.type === "sphere"
      //                  ? point.maxX + object.xRadius
      //                  : point.maxX;

      //            this.breakPointsCtx.moveTo(point.maxX, y);
      //            this.breakPointsCtx.lineTo(point.maxX, point.minY);
      //            return (guideDrawn = true);
      //         } else if (Math.abs(point.minY - y) <= this.tolerance) {
      //            object.y =
      //               object.type === "sphere"
      //                  ? point.minY + object.yRadius
      //                  : point.minY;

      //            this.breakPointsCtx.moveTo(point.minX, point.minY);
      //            this.breakPointsCtx.lineTo(x, point.minY);
      //            return (guideDrawn = true);
      //         } else if (Math.abs(point.maxY - y) <= this.tolerance) {
      //            object.y =
      //               object.type === "sphere"
      //                  ? point.maxY + object.yRadius
      //                  : point.maxY;
      //            this.breakPointsCtx.moveTo(point.minX, point.maxY);
      //            this.breakPointsCtx.lineTo(x, point.maxY);
      //            return (guideDrawn = true);
      //         } else if (Math.abs(point.minX - (x + width)) <= this.tolerance) {
      //            object.x =
      //               object.type === "sphere"
      //                  ? point.minX - width / 2
      //                  : point.minX - width;

      //            this.breakPointsCtx.moveTo(point.minX, y);
      //            this.breakPointsCtx.lineTo(point.minX, point.minY);
      //            return (guideDrawn = true);
      //         } else if (Math.abs(point.maxX - (x + width)) <= this.tolerance) {
      //            object.x =
      //               object.type === "sphere"
      //                  ? point.maxX - width / 2
      //                  : point.maxX - width;

      //            this.breakPointsCtx.moveTo(point.maxX, y);
      //            this.breakPointsCtx.lineTo(point.maxX, point.minY);
      //            return (guideDrawn = true);
      //         } else if (Math.abs(point.minY - (y + height)) <= this.tolerance) {
      //            object.y =
      //               object.type === "sphere"
      //                  ? point.minY - height / 2
      //                  : point.minY - height;

      //            this.breakPointsCtx.moveTo(point.minX, point.minY);
      //            this.breakPointsCtx.lineTo(x, point.minY);
      //            return (guideDrawn = true);
      //         } else if (Math.abs(point.maxY - (y + height)) <= this.tolerance) {
      //            object.y =
      //               object.type === "sphere"
      //                  ? point.maxY - height / 2
      //                  : point.maxY - height;

      //            this.breakPointsCtx.moveTo(point.minX, point.maxY);
      //            this.breakPointsCtx.lineTo(x, point.maxY);
      //            return (guideDrawn = true);
      //         }
      //      }
      //   });

      for (let [pointKey, point] of this.breakpoints) {
         if (key !== pointKey) {
            if (Math.abs(point.minX - x) <= this.tolerance) {
               object.x =
                  object.type === "sphere"
                     ? point.minX + object.xRadius
                     : point.minX;

               this.breakPointsCtx.moveTo(point.minX, y);
               this.breakPointsCtx.lineTo(point.minX, point.minY);
               guideDrawn = true;
            } else if (Math.abs(point.maxX - x) <= this.tolerance) {
               object.x =
                  object.type === "sphere"
                     ? point.maxX + object.xRadius
                     : point.maxX;

               this.breakPointsCtx.moveTo(point.maxX, y);
               this.breakPointsCtx.lineTo(point.maxX, point.minY);
               guideDrawn = true;
            } else if (Math.abs(point.minY - y) <= this.tolerance) {
               object.y =
                  object.type === "sphere"
                     ? point.minY + object.yRadius
                     : point.minY;

               this.breakPointsCtx.moveTo(point.minX, point.minY);
               this.breakPointsCtx.lineTo(x, point.minY);
               guideDrawn = true;
            } else if (Math.abs(point.maxY - y) <= this.tolerance) {
               object.y =
                  object.type === "sphere"
                     ? point.maxY + object.yRadius
                     : point.maxY;
               this.breakPointsCtx.moveTo(point.minX, point.maxY);
               this.breakPointsCtx.lineTo(x, point.maxY);
               guideDrawn = true;
            } else if (Math.abs(point.minX - (x + width)) <= this.tolerance) {
               object.x =
                  object.type === "sphere"
                     ? point.minX - width / 2
                     : point.minX - width;

               this.breakPointsCtx.moveTo(point.minX, y);
               this.breakPointsCtx.lineTo(point.minX, point.minY);
               guideDrawn = true;
            } else if (Math.abs(point.maxX - (x + width)) <= this.tolerance) {
               object.x =
                  object.type === "sphere"
                     ? point.maxX - width / 2
                     : point.maxX - width;

               this.breakPointsCtx.moveTo(point.maxX, y);
               this.breakPointsCtx.lineTo(point.maxX, point.minY);
               guideDrawn = true;
            } else if (Math.abs(point.minY - (y + height)) <= this.tolerance) {
               object.y =
                  object.type === "sphere"
                     ? point.minY - height / 2
                     : point.minY - height;

               this.breakPointsCtx.moveTo(point.minX, point.minY);
               this.breakPointsCtx.lineTo(x, point.minY);
               guideDrawn = true;
            } else if (Math.abs(point.maxY - (y + height)) <= this.tolerance) {
               object.y =
                  object.type === "sphere"
                     ? point.maxY - height / 2
                     : point.maxY - height;

               this.breakPointsCtx.moveTo(point.minX, point.maxY);
               this.breakPointsCtx.lineTo(x, point.maxY);
               guideDrawn = true;
            }

            if (guideDrawn) {
               break;
            }
         }
      }

      // Only stroke if a guide was drawn
      if (guideDrawn) {
         this.breakPointsCtx.stroke();
      }

      this.breakPointsCtx.closePath();
      this.breakPointsCtx.restore();
   }

   updateGuides(key, x, y, width, height) {
      const adjust = this.breakpoints.get(key);
      if (!adjust) return;
      adjust.minX = x;
      adjust.minY = y;
      adjust.maxX = width;
      adjust.maxY = height;
   }

   getShape(key) {
      const rect = this.rectMap.get(key);
      const sphere = this.circleMap.get(key);
      const text = this.textMap.get(key);
      return { rect, sphere, text };
   }

   updateLineMinMax(key) {
      let line = this.lineMap.get(key);
      if (!line) {
         return;
      }
      line.minX = Infinity;
      line.maxX = -Infinity;
      line.minY = Infinity;
      line.maxY = -Infinity;

      line.curvePoints.forEach((ele) => {
         if (ele.x < line.minX) {
            line.minX = ele.x;
         }
         if (ele.x > line.maxX) {
            line.maxX = ele.x;
         }
         if (ele.y < line.minY) {
            line.minY = ele.y;
         }
         if (ele.y > line.maxY) {
            line.maxY = ele.y;
         }
      });
   }

   lineConnectParams(mouseX, mouseY) {
      this.breakPointsCtx.clearRect(
         0,
         0,
         this.canvasBreakpoints.width,
         this.canvasBreakpoints.height
      );

      this.breakPointsCtx.save();
      this.breakPointsCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY
      );
      this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      this.breakPointsCtx.beginPath();
      const padding = 3; // padding
      this.breakPointsCtx.lineWidth = padding;
      this.breakPointsCtx.strokeStyle = "rgb(2, 211, 134)";

      this.rectMap.forEach((rect) => {
         const { x, y, width, height } = rect;
         if (
            (mouseX >= x &&
               mouseX <= x + width &&
               mouseY >= y &&
               mouseY <= y + this.tolerance) ||
            (mouseX >= x &&
               mouseX <= x + this.tolerance &&
               mouseY >= y &&
               mouseY <= y + height) ||
            (mouseX >= x &&
               mouseX <= x + width &&
               mouseY >= y + height - this.tolerance &&
               mouseY <= y + height) ||
            (mouseX >= x + width - this.tolerance &&
               mouseX <= x + width &&
               mouseY >= y &&
               mouseY <= y + height)
         ) {
            // Start from the top-left corner, slightly offset by padding
            this.breakPointsCtx.moveTo(x - padding + 5, y - padding);

            // Top-right corner
            this.breakPointsCtx.arcTo(
               x + width + padding,
               y - padding,
               x + width + padding,
               y - padding + 5,
               5
            );

            // Bottom-right corner
            this.breakPointsCtx.arcTo(
               x + width + padding,
               y + height + padding,
               x + width + padding - 5,
               y + height + padding,
               5
            );

            // Bottom-left corner
            this.breakPointsCtx.arcTo(
               x - padding,
               y + height + padding,
               x - padding,
               y + height + padding - 5,
               5
            );

            // Top-left corner to close the path
            this.breakPointsCtx.arcTo(
               x - padding,
               y - padding,
               x - padding + 5,
               y - padding,
               5
            );

            this.breakPointsCtx.closePath();
         } else {
            this.breakPointsCtx.clearRect(
               0,
               0,
               this.canvasBreakpoints.width,
               this.canvasBreakpoints.height
            );
         }
      });

      this.circleMap.forEach((circle) => {
         const { x, y, xRadius, yRadius } = circle;
         const dx = mouseX - x;
         const dy = mouseY - y;
         const distance = Math.sqrt(dx * dx + dy * dy);

         if (
            Math.abs(distance - xRadius) <= this.tolerance &&
            Math.abs(distance - yRadius) <= this.tolerance
         ) {
            this.breakPointsCtx.beginPath();
            this.breakPointsCtx.ellipse(
               circle.x,
               circle.y,
               circle.xRadius + padding,
               circle.yRadius + padding,
               0,
               0,
               Math.PI * 2,
               false
            );
            this.breakPointsCtx.closePath();
         } else {
            this.breakPointsCtx.clearRect(
               0,
               0,
               this.canvasBreakpoints.width,
               this.canvasBreakpoints.height
            );
         }
      });

      this.textMap.forEach((text) => {
         const { x, y, width, height } = text;
         if (
            (mouseX >= x &&
               mouseX <= x + width &&
               mouseY >= y &&
               mouseY <= y + this.tolerance) ||
            (mouseX >= x + width - this.tolerance &&
               mouseX <= x + width &&
               mouseY >= y &&
               mouseY <= y + height) ||
            (mouseX >= x &&
               mouseX <= x + this.tolerance &&
               mouseY >= y &&
               mouseY <= y + height) ||
            (mouseX >= x &&
               mouseX <= x + width &&
               mouseY >= y + height - this.tolerance &&
               mouseY <= y + height)
         ) {
            // Start from the top-left corner, slightly offset by padding
            this.breakPointsCtx.moveTo(x - padding + 5, y - padding);

            // Top-right corner
            this.breakPointsCtx.arcTo(
               x + width + padding,
               y - padding,
               x + width + padding,
               y - padding + 5,
               5
            );

            // Bottom-right corner
            this.breakPointsCtx.arcTo(
               x + width + padding,
               y + height + padding,
               x + width + padding - 5,
               y + height + padding,
               5
            );

            // Bottom-left corner
            this.breakPointsCtx.arcTo(
               x - padding,
               y + height + padding,
               x - padding,
               y + height + padding - 5,
               5
            );

            // Top-left corner to close the path
            this.breakPointsCtx.arcTo(
               x - padding,
               y - padding,
               x - padding + 5,
               y - padding,
               5
            );

            this.breakPointsCtx.closePath();
         }
      });
      this.breakPointsCtx.stroke();
      this.breakPointsCtx.restore();
   }

   pointToSegmentDistance(px, py, x1, y1, x2, y2) {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const len_sq = C * C + D * D;
      const param = len_sq !== 0 ? dot / len_sq : -1;

      let xx, yy;

      if (param < 0) {
         xx = x1;
         yy = y1;
      } else if (param > 1) {
         xx = x2;
         yy = y2;
      } else {
         xx = x1 + param * C;
         yy = y1 + param * D;
      }

      const dx = px - xx;
      const dy = py - yy;
      return Math.sqrt(dx * dx + dy * dy);
   }

   initialize() {
      this.canvas.addEventListener("mouseup", this.mouseUp.bind(this));
      this.canvas.addEventListener("mousemove", this.mouseMove.bind(this));
      this.canvas.addEventListener(
         "mousedown",
         this.mouseDownDragAndResize.bind(this)
      );
      this.draw();
   }

   cleanup() {
      this.canvas.removeEventListener("mouseup", this.mouseUp.bind(this));
      this.canvas.removeEventListener("mousemove", this.mouseMove.bind(this));
      this.canvas.removeEventListener(
         "mousedown",
         this.mouseDownDragAndResize.bind(this)
      );
   }

   renderText(textArray, x, y, textSize, height, width) {
      // Calculate the total height of the text block
      let totalTextHeight = textArray.length * textSize;

      // Calculate the starting y-coordinate to center the text block vertically
      let startY = y + (height - totalTextHeight) * 0.5 + textSize;

      // Set the text properties
      this.context.fillStyle = "white";
      this.context.font = `${textSize}px Arial`;

      // Iterate through the text array and render each line
      for (let i = 0; i < textArray.length; i++) {
         // Measure the width of the current line of text
         const metrics = this.context.measureText(textArray[i]);

         // Calculate the x-coordinate to center the text horizontally
         const midPoint = x + (width - metrics.width) * 0.5;

         // Render the text
         this.context.fillText(textArray[i], midPoint, startY);

         // Move to the next line
         startY += textSize;
      }
   }
}

//    draw() {
//       //   this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the this.canvas
//       this.context.clearRect(0, 0, window.innerWidth, window.innerHeight); // Clear the this.canvas

//       this.context.save();
//       this.context.translate(
//          -scrollBar.scrollPositionX,
//          -scrollBar.scrollPositionY
//       );
//       this.context.scale(Scale.scale, Scale.scale);
//       this.context.lineWidth = this.lineWidth;
//       this.context.strokeStyle = "rgb(2, 211, 134)";

//       this.rectMap.forEach((rect) => {
//          const {
//             x,
//             y,
//             width,
//             height,
//             radius,
//             lineWidth,
//             borderColor,
//             fillStyle,
//             text,
//             textSize,
//          } = rect;

//          if (rect.isActive) {
//             //dots
//             this.dots(
//                { x: rect.x - this.tolerance, y: rect.y - this.tolerance },
//                {
//                   x: rect.x + rect.width + this.tolerance,
//                   y: rect.y - this.tolerance,
//                },
//                {
//                   x: rect.x + rect.width + this.tolerance,
//                   y: rect.y + rect.height + this.tolerance,
//                },
//                {
//                   x: rect.x - this.tolerance,
//                   y: rect.y + rect.height + this.tolerance,
//                }
//             );

//             this.context.beginPath();
//             this.context.moveTo(x + width * 0.5, y - this.tolerance);
//             this.context.lineTo(x + width * 0.5, y - 20);
//             this.context.stroke();
//             this.context.closePath();

//             this.dots({ x: x + width * 0.5, y: y - 20 });

//             // Draw the rectangle using this.canvas rect method
//             this.context.beginPath();
//             this.context.strokeStyle = this.activeColor;
//             // this.context.fillStyle = "rgb(2, 211, 134)";
//             this.context.rect(
//                x - this.tolerance,
//                y - this.tolerance,
//                width + 2 * this.tolerance,
//                height + 2 * this.tolerance
//             );
//             this.context.stroke();
//          }

//          this.context.beginPath();
//          this.context.lineWidth = lineWidth;
//          this.context.strokeStyle = borderColor;
//          this.context.fillStyle = fillStyle;
//          this.context.moveTo(x + radius, y);
//          this.context.arcTo(x + width, y, x + width, y + height, radius);
//          this.context.arcTo(x + width, y + height, x, y + height, radius);
//          this.context.arcTo(x, y + height, x, y, radius);
//          this.context.arcTo(x, y, x + width, y, radius);
//          this.context.stroke();
//          this.context.fill();
//          this.context.closePath();

//          // render text
//          this.renderText(text, x, y, textSize, height, width);
//       });

//       this.circleMap.forEach((sphere) => {
//          const x = sphere.x - sphere.xRadius;
//          const y = sphere.y - sphere.yRadius;
//          const width = sphere.x + sphere.xRadius;
//          const height = sphere.y + sphere.yRadius;
//          if (sphere.isActive) {
//             //dots
//             this.dots(
//                { x: x - this.tolerance, y: y - this.tolerance },
//                { x: width + this.tolerance, y: y - this.tolerance },
//                { x: width + this.tolerance, y: height + this.tolerance },
//                { x: x - this.tolerance, y: height + this.tolerance }
//             );

//             // Draw the rectangle using this.canvas rect method
//             this.context.beginPath();
//             this.context.strokeStyle = this.activeColor;
//             // this.context.fillStyle = "rgb(2, 211, 134)";
//             this.context.rect(
//                x - this.tolerance,
//                y - this.tolerance,
//                2 * sphere.xRadius + 2 * this.tolerance,
//                2 * sphere.yRadius + 2 * this.tolerance
//             );
//             this.context.stroke();
//          }
//          this.context.beginPath();
//          this.context.lineWidth = sphere.lineWidth;
//          this.context.fillStyle = sphere.fillStyle;
//          this.context.strokeStyle = sphere.borderColor;
//          this.context.ellipse(
//             sphere.x,
//             sphere.y,
//             sphere.xRadius,
//             sphere.yRadius,
//             0,
//             0,
//             2 * Math.PI
//          );
//          this.context.fill();
//          this.context.closePath();
//          this.context.stroke();

//          //   render text
//          this.renderText(
//             sphere.text,
//             x,
//             y,
//             sphere.textSize,
//             2 * sphere.yRadius,
//             2 * sphere.xRadius
//          );
//       });

//       // this.context.save();
//       // pencilMap.forEach((pencil) => {
//       //   this.context.beginPath();
//       //   pencil.forEach((coor, index) => {
//       //     if (index === 0) {
//       //       this.context.moveTo(coor.x, coor.y); // Move to the first point
//       //     } else {
//       //       // Use quadraticCurveTo for drawing curved lines
//       //       const prevCoor = pencil[index - 1];
//       //       const cx = (coor.x + prevCoor.x) / 2; // Control point x-coordinate
//       //       const cy = (coor.y + prevCoor.y) / 2; // Control point y-coordinate
//       //       this.context.quadraticCurveTo(prevCoor.x, prevCoor.y, cx, cy); // Draw a quadratic curve
//       //     }
//       //   });

//       //   // Set line properties
//       //   this.context.lineCap = "round";
//       //   this.context.lineJoin = "round";
//       //   this.context.lineWidth = 1.6;
//       //   this.context.strokeStyle = "#dcdcdc";
//       //   this.context.stroke();
//       //   this.context.closePath();
//       // });
//       // this.context.restore();
//       // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the this.canvas

//       this.textMap.forEach((t) => {
//          if (t.isActive) {
//             //dots
//             this.dots(
//                { x: t.x - this.tolerance, y: t.y - this.tolerance },
//                {
//                   x: t.x + t.width + this.tolerance,
//                   y: t.y - this.tolerance,
//                },
//                {
//                   x: t.x + t.width + this.tolerance,
//                   y: t.y + t.height + this.tolerance,
//                },
//                {
//                   x: t.x - this.tolerance,
//                   y: t.y + t.height + this.tolerance,
//                }
//             );

//             this.context.beginPath();
//             this.context.strokeStyle = this.activeColor;
//             this.context.rect(
//                t.x - this.tolerance,
//                t.y - this.tolerance,
//                2 * this.tolerance + t.width,
//                2 * this.tolerance + t.height
//             );
//             this.context.stroke();
//          }
//          // Set the font size before measuring the text
//          this.context.fillStyle = t.fillStyle;
//          this.context.font = `${t.textSize}px ${t.font || "Arial"}`;
//          let maxWidth = 0;

//          // Measure each string in the content array
//          t.content.forEach((c) => {
//             const textMetrics = this.context.measureText(c);
//             maxWidth = Math.max(maxWidth, textMetrics.width);
//          });

//          // Store the measured dimensions
//          t.width = maxWidth;
//          t.height = t.content.length * t.textSize;

//          let currentY = t.y;

//          // Draw each string, adjusting the y coordinate

//          t.content.forEach((c) => {
//             const textMetrics = this.context.measureText(c);
//             this.context.fillText(
//                c,
//                t.x,
//                currentY + textMetrics.actualBoundingBoxAscent
//             );
//             currentY +=
//                textMetrics.actualBoundingBoxAscent +
//                textMetrics.actualBoundingBoxDescent +
//                this.tolerance;
//          });
//       });

//       this.lineMap.forEach((line) => {
//          if (line.isActive) {
//             this.context.lineWidth = 3;
//             // this.context.fillStyle = "rgb(2, 211, 134)";
//             this.context.strokeStyle = this.activeColor;

//             this.dots(...line.curvePoints);

//             if (!line.lineType || line.lineType === "straight") {
//                this.context.beginPath();
//                this.context.moveTo(
//                   line.curvePoints[0].x,
//                   line.curvePoints[0].y
//                );
//                for (let i = 1; i < line.curvePoints.length; i++) {
//                   this.context.lineTo(
//                      line.curvePoints[i].x,
//                      line.curvePoints[i].y
//                   );
//                }
//                this.context.stroke();
//                this.context.closePath();
//             }
//          } else {
//             this.context.strokeStyle = line.borderColor;
//          }

//          this.context.beginPath();
//          this.context.lineWidth = line.lineWidth;
//          this.context.moveTo(line.curvePoints[0].x, line.curvePoints[0].y);

//          if (line.lineType === "straight") {
//             for (let i = 0; i < line.curvePoints.length; i++) {
//                this.context.lineTo(
//                   line.curvePoints[i].x,
//                   line.curvePoints[i].y
//                );
//             }
//          } else if (line.lineType === "elbow") {
//             const headlen = 15;

//             this.context.lineWidth = line.lineWidth;

//             this.context.arcTo(
//                line.curvePoints[1].x,
//                line.curvePoints[0].y,
//                line.curvePoints[1].x,
//                line.curvePoints[1].y,
//                line.radius
//             );
//             // Draw a line from the end of the arc to (arrow.tox, arrow.toy)
//             // }
//             this.context.lineTo(line.curvePoints[1].x, line.curvePoints[1].y);

//             this.context.stroke();

//             // Draw the arrowhead
//             const lastPoint = line.curvePoints[line.curvePoints.length - 1];
//             const firstPoint = line.curvePoints[0];

//             // arrow back side
//             this.context.beginPath();
//             if (firstPoint.y === lastPoint.y) {
//                if (firstPoint.x < lastPoint.x) {
//                   // Draw the first side of the arrowhead
//                   this.context.moveTo(lastPoint.x, lastPoint.y);
//                   this.context.lineTo(lastPoint.x - headlen, lastPoint.y - 5);
//                   this.context.stroke();
//                   this.context.closePath();

//                   // Draw the second side of the arrowhead
//                   this.context.beginPath();
//                   this.context.moveTo(lastPoint.x, lastPoint.y);
//                   this.context.lineTo(lastPoint.x - headlen, lastPoint.y + 5);
//                } else {
//                   // Draw the first side of the arrowhead
//                   this.context.moveTo(lastPoint.x, lastPoint.y);
//                   this.context.lineTo(lastPoint.x + headlen, lastPoint.y - 5);
//                   this.context.stroke();
//                   this.context.closePath();

//                   // Draw the second side of the arrowhead
//                   this.context.beginPath();
//                   this.context.moveTo(lastPoint.x, lastPoint.y);
//                   this.context.lineTo(lastPoint.x + headlen, lastPoint.y + 5);
//                }
//             } else if (firstPoint.y < lastPoint.y) {
//                // Draw the first side of the arrowhead
//                this.context.moveTo(lastPoint.x, lastPoint.y);
//                this.context.lineTo(
//                   lastPoint.x + headlen * 0.5,
//                   lastPoint.y - headlen
//                );
//                this.context.stroke();
//                this.context.closePath();

//                // Draw the second side of the arrowhead
//                this.context.beginPath();
//                this.context.moveTo(lastPoint.x, lastPoint.y);
//                this.context.lineTo(
//                   lastPoint.x - headlen * 0.5,
//                   lastPoint.y - headlen
//                );
//             } else if (firstPoint.y > lastPoint.y) {
//                // Draw the first side of the arrowhead
//                this.context.moveTo(lastPoint.x, lastPoint.y);
//                this.context.lineTo(
//                   lastPoint.x + headlen * 0.5,
//                   lastPoint.y + headlen
//                );
//                this.context.stroke();
//                this.context.closePath();

//                // Draw the second side of the arrowhead
//                this.context.beginPath();
//                this.context.moveTo(lastPoint.x, lastPoint.y);
//                this.context.lineTo(
//                   lastPoint.x - headlen * 0.5,
//                   lastPoint.y + headlen
//                );
//             }

//             // arrow front
//             this.context.stroke();
//             this.context.closePath();
//          } else {
//             // Start the path at the first point
//             if (line.curvePoints.length <= 2) {
//                this.context.lineTo(
//                   line.curvePoints[1].x,
//                   line.curvePoints[1].y
//                );
//             } else {
//                for (let i = 1; i < line.curvePoints.length - 1; i++) {
//                   const cp1 = line.curvePoints[i];
//                   const cp2 = line.curvePoints[i + 1];

//                   // Calculate the weighted midpoint (e.g., 80% closer to cp2)
//                   const t = 0.8; // Weighting factor, 0.5 for halfway, closer to 1 for closer to cp2
//                   const midPointX = (1 - t) * cp1.x + t * cp2.x;
//                   const midPointY = (1 - t) * cp1.y + t * cp2.y;

//                   // Use cp1 as the control point and the adjusted midpoint as the end point
//                   this.context.quadraticCurveTo(
//                      cp1.x,
//                      cp1.y,
//                      midPointX,
//                      midPointY
//                   );
//                }
//                // Drawing the last segment to the last point
//                let lastPoint = line.curvePoints[line.curvePoints.length - 1];
//                this.context.lineTo(lastPoint.x, lastPoint.y);
//             }
//          }
//          this.context.stroke();
//          this.context.closePath();
//       });

//       this.context.restore();
//    }
