import { config, Scale, scrollBar } from "../../../lib/utils.ts";
import { Circle, Figure, Line, Rect, Text } from "./stylesClass.js";

const imageMap = new Map();
const rectMap = new Map();
const circleMap = new Map();
const textMap = new Map();
const lineMap = new Map();
const breakPoints = new Map();
const figureMap = new Map();

export default class Shapes {
   constructor(canvas, canvasBreakpoints, renderCanvas) {
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
      this.imageMap = imageMap;
      this.figureMap = figureMap;
      this.breakpoints = breakPoints;
      this.shapeToRender = null;
      this.cache = new Map();

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
            this.lineMap.forEach((line) => {
               line.isActive = true;
            });

            this.imageMap.forEach((image) => {
               image.isActive = true;
            });

            this.draw();
            this.drawImage();
         }
      });

      document.addEventListener("keydown", (e) => {
         if (e.key === "Delete") {
            //remove selected square
            this.rectMap.forEach((rect, key) => {
               if (rect.isActive) {
                  rect.pointTo.forEach((p) => {
                     let line = this.lineMap.get(p);
                     if (line?.startTo === key && !line.isActive) {
                        line.startTo = null;
                     }
                     if (line?.endTo === key && !line.isActive) {
                        line.endTo === null;
                     }
                     console.log(line, key);
                  });
                  this.rectMap.delete(key);
                  this.breakpoints.delete(key);
               }
            });

            this.lineMap.forEach((line, key) => {
               if (line.isActive) {
                  if (line.startTo) {
                     const { rect, text, sphere, image } = this.getShape(
                        line.startTo
                     );
                     if (rect) {
                        rect.pointTo.filter((r) => r !== key);
                     }
                     if (text) {
                        text.pointTo.filter((r) => r !== key);
                     }
                     if (sphere) {
                        sphere.pointTo.filter((r) => r !== key);
                     }

                     if (image) {
                        image.pointTo.filter((i) => i !== key);
                     }
                  } else if (line.endTo) {
                     const { rect, text, sphere, image } = this.getShape(
                        line.endTo
                     );

                     if (rect) {
                        rect.pointTo.filter((r) => r !== key);
                     }
                     if (text) {
                        text.pointTo.filter((r) => r !== key);
                     }
                     if (sphere) {
                        sphere.pointTo.filter((r) => r !== key);
                     }
                     if (image) {
                        image.pointTo.filter((i) => i !== key);
                     }
                  }
                  this.lineMap.delete(key);
               }
            });

            //remove selected arcs
            this.circleMap.forEach((arc, key) => {
               if (arc.isActive) {
                  arc.pointTo.forEach((p) => {
                     let line = this.lineMap.get(p);
                     if (line.startTo === key && !line.isActive) {
                        line.startTo = null;
                     }
                     if (line.endTo === key && !line.isActive) {
                        line.endTo === null;
                     }
                  });
                  this.circleMap.delete(key);
                  this.breakpoints.delete(key);
               }
            });

            this.textMap.forEach((text, key) => {
               if (text.isActive) {
                  text.pointTo.forEach((p) => {
                     let line = this.lineMap.get(p);
                     if (line.startTo === key && !line.isActive) {
                        line.startTo = null;
                     }
                     if (line.endTo === key && !line.isActive) {
                        line.endTo === null;
                     }
                  });
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

   drawArrows(startPoint, endPoint, arrowLength) {
      // Draw the back arrowhead
      const firstPoint = startPoint;
      const lastPoint = endPoint;

      // Calculate the angle of the arrow
      let angle = Math.atan2(
         lastPoint.y - firstPoint.y,
         lastPoint.x - firstPoint.x
      );

      // Draw the first side of the back arrowhead
      this.context.moveTo(lastPoint.x, lastPoint.y);
      this.context.lineTo(
         lastPoint.x - arrowLength * Math.cos(angle - Math.PI / 6),
         lastPoint.y - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      this.context.stroke();
      this.context.closePath();

      // Draw the second side of the back arrowhead
      this.context.beginPath();
      this.context.moveTo(lastPoint.x, lastPoint.y);
      this.context.lineTo(
         lastPoint.x - arrowLength * Math.cos(angle + Math.PI / 6),
         lastPoint.y - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      this.context.stroke();
      this.context.closePath();
   }

   draw() {
      // Clear the canvas
      this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      this.context.save();

      this.context.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY
      );
      //   const centerX = this.canvas.width / 2;
      //   const centerY = this.canvas.height / 2;

      //   // Translate to the center, apply scaling, and then translate back
      //   this.context.translate(centerX, centerY);
      //   this.context.translate(-centerX, -centerY);
      this.context.scale(Scale.scale, Scale.scale);

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
            fillType,
            textPosition,
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
         let parttern;
         //  if()

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
         this.renderText(text, x, y, textSize, height, width, textPosition);
      });

      // Draw circles
      this.circleMap.forEach((sphere) => {
         const {
            xRadius,
            yRadius,
            text,
            textPosition,
            lineWidth,
            fillStyle,
            borderColor,
            textSize,
         } = sphere;
         const x = sphere.x - xRadius;
         const y = sphere.y - yRadius;
         const width = 2 * xRadius;
         const height = 2 * yRadius;

         drawDotsAndRect(
            x,
            y,
            width,
            height,
            this.tolerance,
            isActive,
            this.activeColor
         );

         // Draw circle
         this.context.beginPath();
         this.context.lineWidth = lineWidth;
         this.context.fillStyle = fillStyle;
         this.context.strokeStyle = borderColor;
         this.context.ellipse(
            sphere.x,
            sphere.y,
            xRadius,
            yRadius,
            0,
            0,
            2 * Math.PI
         );
         this.context.fill();
         this.context.stroke();
         this.context.closePath();

         // Render text
         this.renderText(text, x, y, textSize, height, width, textPosition);
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

         drawDotsAndRect(
            x,
            y,
            width,
            height,
            this.tolerance,
            isActive,
            this.activeColor
         );
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
            arrowLeft,
            arrowRight,
            text,
            minX,
            maxX,
            minY,
            maxY,
            textSize,
            textPosition,
         } = line;

         this.context.beginPath();
         this.context.lineWidth = lineWidth;

         if (isActive) {
            this.context.strokeStyle = this.activeColor;
            this.dots(...curvePoints, { context: this.context });
         } else {
            this.context.strokeStyle = borderColor;
         }

         const headlen = 10;

         if (lineType === "straight") {
            this.context.moveTo(curvePoints[0].x, curvePoints[0].y);
            for (let i = 1; i < curvePoints.length; i++) {
               this.context.lineTo(curvePoints[i].x, curvePoints[i].y);
            }
            if (arrowLeft) {
               this.drawArrows(
                  {
                     x: curvePoints[curvePoints.length - 1].x,
                     y: curvePoints[curvePoints.length - 1].y,
                  },
                  {
                     x: curvePoints[0].x,
                     y: curvePoints[0].y,
                  },
                  headlen
               );
            }
            if (arrowRight) {
               this.drawArrows(
                  {
                     x: curvePoints[0].x,
                     y: curvePoints[0].y,
                  },
                  {
                     x: curvePoints[curvePoints.length - 1].x,
                     y: curvePoints[curvePoints.length - 1].y,
                  },
                  headlen
               );
            }
         } else if (lineType === "elbow") {
            const first = curvePoints[0];
            const last = curvePoints[curvePoints.length - 1];
            const mid = {
               x: (first.x + last.x) / 2,
               y: (first.y + last.y) / 2,
            };

            // Start from the first point
            this.context.moveTo(first.x, first.y);

            // Draw the first arc: From first to mid horizontally
            this.context.arcTo(mid.x, first.y, mid.x, mid.y, radius);

            // Draw the second arc: From mid horizontally to mid vertically aligned with last
            this.context.arcTo(mid.x, last.y, last.x, last.y, radius);

            // Draw final line: From the end of the second arc to the last point
            this.context.lineTo(last.x, last.y);

            if (arrowLeft) {
               mid.x == first.x
                  ? this.drawArrows(mid, first, headlen)
                  : this.drawArrows({ x: mid.x, y: first.y }, first, headlen);
            }
            if (arrowRight) {
               mid.x == first.x
                  ? this.drawArrows(mid, last, headlen)
                  : this.drawArrows({ x: mid.x, y: last.y }, last, headlen);
            }
         } else {
            this.context.moveTo(curvePoints[0].x, curvePoints[0].y);
            const t = 0.8; // Weighting factor, 0.5 for halfway, closer to 1 for closer to cp2
            for (let i = 1; i < curvePoints.length - 1; i++) {
               const cp1 = curvePoints[i];
               const cp2 = curvePoints[i + 1];
               const midPointX = (1 - t) * cp1.x + t * cp2.x;
               const midPointY = (1 - t) * cp1.y + t * cp2.y;
               this.context.quadraticCurveTo(
                  cp1.x,
                  cp1.y,
                  midPointX,
                  midPointY
               );
            }
            const secondToLastPoint = curvePoints[curvePoints.length - 2];
            const lastPoint = curvePoints[curvePoints.length - 1];
            const controlPointX =
               (1 - t) * secondToLastPoint.x + t * lastPoint.x;
            const controlPointY =
               (1 - t) * secondToLastPoint.y + t * lastPoint.y;
            this.context.quadraticCurveTo(
               controlPointX,
               controlPointY,
               lastPoint.x,
               lastPoint.y
            );

            //arrows
            if (arrowLeft) {
               this.drawArrows(
                  {
                     x: curvePoints[1].x,
                     y: curvePoints[1].y,
                  },
                  {
                     x: curvePoints[0].x,
                     y: curvePoints[0].y,
                  },
                  headlen
               );
            }

            if (arrowRight) {
               this.drawArrows(
                  {
                     x: curvePoints[curvePoints.length - 2].x,
                     y: curvePoints[curvePoints.length - 2].y,
                  },
                  {
                     x: curvePoints[curvePoints.length - 1].x,
                     y: curvePoints[curvePoints.length - 1].y,
                  },
                  headlen
               );
            }
         }

         //render text
         this.renderText(
            text,
            minX,
            minY,
            textSize,
            maxY - minY,
            maxX - minX,
            textPosition
         );

         this.context.stroke();
         this.context.closePath();
      });

      this.context.restore();
   }

   drawImage() {
      this.renderCanvasCtx.clearRect(
         0,
         0,
         this.renderCanvas.width,
         this.renderCanvas.height
      );
      this.renderCanvasCtx.save();
      this.renderCanvasCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY
      );
      this.renderCanvasCtx.scale(Scale.scale, Scale.scale);

      this.imageMap.forEach((image, key) => {
         const { x, y, width, height, radius, isActive, src } = image;

         if (!this.cache.has(key)) {
            const img = new Image();
            img.src = src;
            img.style.borderRadius = radius + "px";
            this.cache.set(key, img);
            img.onload = () => {
               this.drawImageOnCanvas(img, x, y, width, height, isActive);
            };
         } else {
            const img = this.cache.get(key);
            this.drawImageOnCanvas(img, x, y, width, height, isActive);
         }
      });

      this.renderCanvasCtx.restore();
   }

   drawImageOnCanvas(img, x, y, width, height, isActive) {
      if (isActive) {
         this.dots(
            { x: x - this.tolerance, y: y - this.tolerance },
            { x: x + width + this.tolerance, y: y - this.tolerance },
            { x: x + width + this.tolerance, y: y + height + this.tolerance },
            { x: x - this.tolerance, y: y + height + this.tolerance },
            {
               context: this.renderCanvasCtx,
            }
         );

         this.renderCanvasCtx.beginPath();
         this.renderCanvasCtx.strokeStyle = this.activeColor;
         this.renderCanvasCtx.rect(
            x - this.tolerance,
            y - this.tolerance,
            width + 2 * this.tolerance,
            height + 2 * this.tolerance
         );
         this.renderCanvasCtx.stroke();
         this.renderCanvasCtx.closePath();
      }
      this.renderCanvasCtx.drawImage(img, x, y, width, height);
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

      //image resize
      this.imageMap.forEach((image, key) => {
         const { x, y, width, height } = image;
         // left right
         const leftEdge = mouseX >= x - this.tolerance && mouseX <= x;
         const rightEdge =
            mouseX >= x + width && mouseX <= x + width + this.tolerance;
         const verticalBounds =
            mouseY >= y + this.tolerance &&
            mouseY <= y + height - this.tolerance;

         if (leftEdge && verticalBounds) {
            object.isActive = true;
            isResizing = true;
            const img = new Image();
            img.src = image.src;
            config.currentActive = image;
            this.resizeElement = {
               direction: "left-edge",
               key,
               x: x + width,
               img,
            };
         } else if (rightEdge && verticalBounds) {
            image.isActive = true;
            isResizing = true;
            const img = new Image();
            img.src = image.src;
            config.currentActive = image;

            this.resizeElement = {
               direction: "right-edge",
               key,
               x: x,
               img,
            };
         }

         //  // top - bottom
         const withinTopEdge =
            mouseY >= y - this.tolerance && mouseY <= y + this.tolerance;
         const withinBottomEdge =
            mouseY >= y + height - this.tolerance &&
            mouseY <= y + height + this.tolerance;
         const withinHorizontalBounds =
            mouseX > x + this.tolerance && mouseX < x + width - this.tolerance;

         if (withinTopEdge && withinHorizontalBounds) {
            image.isActive = true;
            isResizing = true;
            const img = new Image();
            img.src = image.src;
            config.currentActive = image;

            this.resizeElement = {
               direction: "top-edge",
               key,
               y: y + height,
               img,
            };
         } else if (withinBottomEdge && withinHorizontalBounds) {
            image.isActive = true;
            isResizing = true;
            const img = new Image();
            img.src = image.src;
            config.currentActive = image;

            this.resizeElement = {
               direction: "bottom-edge",
               key,
               y: y,
               img,
            };
         }

         // Check for corners resize
         const withinTopLeftCorner =
            mouseX >= x - this.tolerance &&
            mouseX <= x + this.tolerance &&
            mouseY >= y - this.tolerance &&
            mouseY <= y + this.tolerance;

         const withinTopRightCorner =
            mouseX >= x + width - this.tolerance &&
            mouseX <= x + width + this.tolerance &&
            mouseY >= y - this.tolerance &&
            mouseY <= y + this.tolerance;

         const withinBottomLeftCorner =
            mouseX >= x - this.tolerance &&
            mouseX <= x + this.tolerance &&
            mouseY >= y + height - this.tolerance &&
            mouseY <= y + height + this.tolerance;

         const withinBottomRightCorner =
            mouseX >= x + width - this.tolerance &&
            mouseX <= x + width + this.tolerance &&
            mouseY >= y + height - this.tolerance &&
            mouseY <= y + height + this.tolerance;

         // resize corners
         [
            { cond: withinBottomLeftCorner, d: "bottom-left" },
            { cond: withinBottomRightCorner, d: "bottom-right" },
            { cond: withinTopLeftCorner, d: "top-left" },
            { cond: withinTopRightCorner, d: "top-right" },
         ].forEach((any) => {
            if (any.cond) {
               isResizing = true;
               const img = new Image();
               img.src = image.src;
               config.currentActive = image;

               this.resizeElement = {
                  key,
                  rectMaxX: x + width,
                  rectMaxY: y + height,
                  direction: any.d,
                  x: x,
                  y: y,
                  width: width,
                  height: height,
                  img,
               };
               return;
            }
         });
      });
      if (isResizing) return;

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
               config.currentActive = line;
               isResizing = true;
            }
         }
      });
      if (isResizing) return;

      // rect resize
      this.rectMap.forEach((rect, key) => {
         const { x, y, width, height } = rect;
         // left right
         const leftEdge = mouseX >= x - this.tolerance && mouseX <= x;
         const rightEdge =
            mouseX >= x + width && mouseX <= x + width + this.tolerance;
         const verticalBounds =
            mouseY >= y + this.tolerance &&
            mouseY <= y + height - this.tolerance;

         if (leftEdge && verticalBounds) {
            object.isActive = true;
            isResizing = true;
            this.isDraggingOrResizing = true;
            config.currentActive = rect;

            this.resizeElement = {
               direction: "left-edge",
               key,
               x: x + width,
            };
         } else if (rightEdge && verticalBounds) {
            rect.isActive = true;
            isResizing = true;
            config.currentActive = rect;

            this.resizeElement = {
               direction: "right-edge",
               key,
               x: x,
            };
         }

         //  // top - bottom
         const withinTopEdge =
            mouseY >= y - this.tolerance && mouseY <= y + this.tolerance;
         const withinBottomEdge =
            mouseY >= y + height - this.tolerance &&
            mouseY <= y + height + this.tolerance;
         const withinHorizontalBounds =
            mouseX > x + this.tolerance && mouseX < x + width - this.tolerance;

         if (withinTopEdge && withinHorizontalBounds) {
            rect.isActive = true;
            isResizing = true;
            config.currentActive = rect;

            this.resizeElement = {
               direction: "top-edge",
               key,
               y: y + height,
            };
         } else if (withinBottomEdge && withinHorizontalBounds) {
            rect.isActive = true;
            isResizing = true;
            config.currentActive = rect;

            this.resizeElement = {
               direction: "bottom-edge",
               key,
               y: y,
            };
         }

         // Check for corners resize
         const withinTopLeftCorner =
            mouseX >= x - this.tolerance &&
            mouseX <= x + this.tolerance &&
            mouseY >= y - this.tolerance &&
            mouseY <= y + this.tolerance;

         const withinTopRightCorner =
            mouseX >= x + width - this.tolerance &&
            mouseX <= x + width + this.tolerance &&
            mouseY >= y - this.tolerance &&
            mouseY <= y + this.tolerance;

         const withinBottomLeftCorner =
            mouseX >= x - this.tolerance &&
            mouseX <= x + this.tolerance &&
            mouseY >= y + height - this.tolerance &&
            mouseY <= y + height + this.tolerance;

         const withinBottomRightCorner =
            mouseX >= x + width - this.tolerance &&
            mouseX <= x + width + this.tolerance &&
            mouseY >= y + height - this.tolerance &&
            mouseY <= y + height + this.tolerance;

         // resize corners
         [
            { cond: withinBottomLeftCorner, d: "bottom-left" },
            { cond: withinBottomRightCorner, d: "bottom-right" },
            { cond: withinTopLeftCorner, d: "top-left" },
            { cond: withinTopRightCorner, d: "top-right" },
         ].forEach((any) => {
            if (any.cond) {
               isResizing = true;
               config.currentActive = rect;
               this.resizeElement = {
                  key,
                  rectMaxX: x + width,
                  rectMaxY: y + height,
                  direction: any.d,
                  x: x,
                  y: y,
                  width: width,
                  height: height,
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
            config.currentActive = arc;
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
            config.currentActive = arc;
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
            config.currentActive = arc;
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
            config.currentActive = text;
         }
      });

      if (isResizing) return;

      let smallestCircle = null;
      let smallestRect = null;
      let smallestText = null;
      let line = null;
      let smallestImage = null;

      //   image drag params
      this.imageMap.forEach((image, key) => {
         const { x, y, width, height } = image;
         if (
            mouseX > x &&
            mouseX < x + width &&
            mouseY > y &&
            mouseY < y + height
         ) {
            if (smallestImage == null || smallestImage.width > width) {
               smallestImage = { image, key };
            }
         }
         if (image.isActive) {
            image.isActive = false;
         }
      });

      if (smallestImage?.key) {
         const img = new Image();
         img.src = smallestImage.image.src;
         img.style.borderRadius = smallestImage.image.radius + "px";

         smallestImage.image.offsetX = mouseX - smallestImage.image.x;
         smallestImage.image.offsetY = mouseY - smallestImage.image.y;
         smallestImage.image.isActive = true;
         this.dragElement = { src: img, key: smallestImage.key };

         this.drawImage();
         config.currentActive = smallestImage?.image;
         return;
      }

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
         if (line.l.startTo && line.l.endTo) {
            line.l.isActive = true;
            this.draw();
            config.currentActive = line;
            return;
         }

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
      this.drawImage();
   }

   updateCurvePoint = (object, x, y, index) => {
      object.curvePoints[index].x = x;
      object.curvePoints[index].y = y;
   };

   getClosestPointOnSphere(sphere, point) {
      const dx = point.x - sphere.x;
      const dy = point.y - sphere.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const closestX = sphere.x + (dx / dist) * sphere.xRadius;
      const closestY = sphere.y + (dy / dist) * sphere.yRadius;
      return { x: closestX, y: closestY };
   }

   getClosestPoints(rect, point) {
      const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
      const closestY = Math.max(
         rect.y,
         Math.min(point.y, rect.y + rect.height)
      );
      return { x: closestX, y: closestY };
   }

   updateLinesPointTo(object) {
      if (object.pointTo?.length > 0) {
         let line = [];
         let arrowEndRect = [];
         let arrowStartRect = [];

         object.pointTo.forEach((a) => {
            let l = this.lineMap.get(a);
            if (l) line.push(l);
         });

         // get all the arrows connected to rect

         if (line.length > 0) {
            line.forEach((l) => {
               let start = null;
               let end = null;
               if (object.type === "rect") {
                  start = this.rectMap.get(l.startTo);
                  end = this.rectMap.get(l.endTo);
               } else if (object.type === "text") {
                  start = this.textMap.get(l.startTo);
                  end = this.textMap.get(l.endTo);
               } else if (object.type === "sphere") {
                  start = this.circleMap.get(l.startTo);
                  end = this.circleMap.get(l.endTo);
               } else if (object.type === "image") {
                  start = this.imageMap.get(l.startTo);
                  end = this.imageMap.get(l.endTo);
               }

               if (start && !arrowStartRect.includes(start)) {
                  arrowStartRect.push(start);
               }
               if (end && !arrowEndRect.includes(end)) {
                  arrowEndRect.push(end);
               }
            });
         }

         const whichMap = (type, pos) => {
            switch (type) {
               case "rect":
                  return this.rectMap.get(pos);
               case "text":
                  return this.textMap.get(pos);
               case "sphere":
                  return this.circleMap.get(pos);
               case "image":
                  return this.imageMap.get(pos);
               default:
                  break;
            }
         };

         if (arrowStartRect.length > 0) {
            arrowStartRect.forEach((ar) => {
               if (ar === object) {
                  line.forEach((l) => {
                     if (whichMap(object.type, l.startTo) === object) {
                        const {
                           rect: r,
                           text: t,
                           sphere: s,
                           image: i,
                        } = this.getShape(l.endTo);

                        const { curvePoints, lineType } = l;
                        const last = curvePoints.length - 1;

                        if (object.type === "sphere") {
                           const { x, y } = this.getClosestPointOnSphere(
                              object,
                              {
                                 x: curvePoints[last].x,
                                 y: curvePoints[last].y,
                              }
                           );
                           this.updateCurvePoint(l, x, y, 0);
                        } else {
                           const { x, y } = this.getClosestPoints(object, {
                              x: curvePoints[last].x,
                              y: curvePoints[last].y,
                           });
                           this.updateCurvePoint(l, x, y, 0);
                        }

                        if (r) {
                           const { x, y } = this.getClosestPoints(r, {
                              x: curvePoints[0].x,
                              y: curvePoints[0].y,
                           });
                           curvePoints[last].x = x;
                           curvePoints[last].y = y;
                        } else if (t) {
                           const { x, y } = this.getClosestPoints(t, {
                              x: curvePoints[0].x,
                              y: curvePoints[0].y,
                           });
                           curvePoints[last].x = x;
                           curvePoints[last].y = y;
                        } else if (s) {
                           const { x, y } = this.getClosestPointOnSphere(s, {
                              x: curvePoints[0].x,
                              y: curvePoints[0].y,
                           });
                           curvePoints[last].x = x;
                           curvePoints[last].y = y;
                        } else if (i) {
                           const { x, y } = this.getClosestPoints(i, {
                              x: curvePoints[0].x,
                              y: curvePoints[0].y,
                           });
                           curvePoints[last].x = x;
                           curvePoints[last].y = y;
                        }
                     }
                  });
               }
            });
         }

         if (arrowEndRect.length > 0) {
            arrowEndRect.forEach((ar) => {
               if (ar === object) {
                  line.forEach((l) => {
                     if (whichMap(object.type, l.endTo) === object) {
                        // get the shape if connect to start
                        const {
                           rect: r,
                           text: t,
                           sphere: s,
                           image: i,
                        } = this.getShape(l.startTo);

                        const { curvePoints } = l;
                        const last = curvePoints.length - 1;

                        if (object.type == "sphere") {
                           const { x, y } = this.getClosestPointOnSphere(
                              object,
                              { x: curvePoints[0].x, y: curvePoints[0].y }
                           );
                           this.updateCurvePoint(l, x, y, last);
                        } else {
                           const { x, y } = this.getClosestPoints(
                              {
                                 x: object.x,
                                 y: object.y,
                                 width: object.width,
                                 height: object.height,
                              },
                              { x: curvePoints[0].x, y: curvePoints[0].y }
                           );
                           this.updateCurvePoint(l, x, y, last);
                        }

                        if (r) {
                           const { x, y } = this.getClosestPoints(r, {
                              x: curvePoints[last].x,
                              y: curvePoints[last].y,
                           });
                           this.updateCurvePoint(l, x, y, 0);
                        } else if (t) {
                           const { x, y } = this.getClosestPoints(t, {
                              x: curvePoints[last].x,
                              y: curvePoints[last].y,
                           });
                           this.updateCurvePoint(l, x, y, 0);
                        } else if (s) {
                           const { x, y } = this.getClosestPointOnSphere(s, {
                              x: curvePoints[last].x,
                              y: curvePoints[last].y,
                           });
                           this.updateCurvePoint(l, x, y, 0);
                        } else if (i) {
                           const { x, y } = this.getClosestPoints(i, {
                              x: curvePoints[last].x,
                              y: curvePoints[last].y,
                           });
                           this.updateCurvePoint(l, x, y, 0);
                        }
                     }
                  });
               }
            });
         }
      }
   }

   mouseMove(e) {
      if (config.mode === "pencil") return;

      if (!this.resizeElement && !this.dragElement) return;
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

      let rectResize = this.rectMap.get(this.resizeElement?.key);
      let circleResize = this.circleMap.get(this.resizeElement?.key);
      let textResize = this.textMap.get(this.resizeElement?.key);
      let lineResize = this.lineMap.get(this.resizeElement?.key);
      let imageResize = this.imageMap.get(this.resizeElement?.key);

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
         this.updateLinesPointTo(rectResize);
      } else if (imageResize) {
         if (this.resizeElement.direction === "left-edge") {
            const { x } = this.resizeElement;
            if (mouseX < x) {
               imageResize.x = mouseX;
               imageResize.width = x - mouseX;
            } else if (mouseX > x) {
               imageResize.x = x;
               imageResize.width = mouseX - x;
            }
         } else if (this.resizeElement.direction === "right-edge") {
            const { x } = this.resizeElement;
            if (mouseX > x) {
               imageResize.width = mouseX - x;
            } else if (mouseX < x) {
               imageResize.x = mouseX;
               imageResize.width = x - mouseX;
            }
         } else if (this.resizeElement.direction === "top-edge") {
            const { y } = this.resizeElement;
            if (mouseY < y) {
               imageResize.y = mouseY;
               imageResize.height = y - mouseY;
            } else if (mouseY > y) {
               imageResize.y = y;
               imageResize.height = mouseY - y;
            }
         } else if (this.resizeElement.direction === "bottom-edge") {
            const { y } = this.resizeElement;
            if (mouseY > y) {
               imageResize.height = mouseY - y;
            } else if (mouseY < y) {
               imageResize.y = mouseY;
               imageResize.height = y - mouseY;
            }
         } else {
            const direction = this.resizeElement.direction;
            let { rectMaxX, rectMaxY, x, y, height, width } =
               this.resizeElement;

            switch (direction) {
               case "top-left":
                  imageResize.x = Math.min(mouseX, rectMaxX);
                  imageResize.y = Math.min(mouseY, rectMaxY);
                  imageResize.width = Math.abs(rectMaxX - mouseX);
                  imageResize.height = Math.abs(rectMaxY - mouseY);
                  break;

               case "top-right":
                  if (mouseX > x) {
                     imageResize.width = mouseX - x;
                  } else if (mouseX < x) {
                     imageResize.x = mouseX;
                     imageResize.width = x - mouseX;
                  }
                  if (mouseY < y + height) {
                     imageResize.y = mouseY;
                     imageResize.height = y + height - mouseY;
                  } else if (mouseY > height + y) {
                     imageResize.y = y + height;
                     imageResize.height = mouseY - imageResize.y;
                  }

                  break;

               case "bottom-left":
                  if (mouseX < x + width) {
                     imageResize.x = mouseX;
                     imageResize.width = x + width - mouseX;
                  } else if (mouseX > x + width) {
                     imageResize.x = x + width;
                     imageResize.width = mouseX - imageResize.x;
                  }

                  if (mouseY > y) {
                     imageResize.height = mouseY - y;
                  } else if (mouseY < y) {
                     imageResize.height = y - mouseY;
                     imageResize.y = mouseY;
                  }

                  break;

               case "bottom-right":
                  if (mouseX > x) imageResize.width = mouseX - imageResize.x;
                  else if (mouseX < x) {
                     imageResize.x = mouseX;
                     imageResize.width = x - mouseX;
                  }
                  if (mouseY > y) imageResize.height = mouseY - imageResize.y;
                  else if (mouseY < y) {
                     imageResize.y = mouseY;
                     imageResize.height = y - mouseY;
                  }

                  break;

               default:
                  break;
            }
         }
         this.updateLinesPointTo(imageResize);
         const { x, y, width, height, isActive } = imageResize;
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
         if (isActive) {
            this.dots(
               { x: x - this.tolerance, y: y - this.tolerance },
               { x: x + width + this.tolerance, y: y - this.tolerance },
               {
                  x: x + width + this.tolerance,
                  y: y + height + this.tolerance,
               },
               { x: x - this.tolerance, y: y + height + this.tolerance },
               { context: this.breakPointsCtx }
            );

            this.breakPointsCtx.strokeStyle = this.activeColor;
            this.breakPointsCtx.rect(
               x - this.tolerance,
               y - this.tolerance,
               width + 2 * this.tolerance,
               height + 2 * this.tolerance
            );
            this.breakPointsCtx.stroke();
         }
         this.breakPointsCtx.scale(Scale.scale, Scale.scale);
         this.breakPointsCtx.drawImage(
            this.resizeElement?.img,
            x,
            y,
            width,
            height
         );
         this.breakPointsCtx.restore();
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
         this.updateLinesPointTo(circleResize);
      } else if (textResize) {
         textResize.textSize = Math.max(
            mouseX - textResize.x * 1.5,
            mouseY - textResize.y * 1
         ); // Ensure minimum size

         this.updateLinesPointTo(textResize);
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
      let image = this.imageMap.get(this.dragElement?.key);

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

         this.updateLinesPointTo(rect);
         //  if (rect.pointTo?.length > 0) {
         //     let line = [];
         //     let arrowEndRect = [];
         //     let arrowStartRect = [];

         //     const updateCurvePoint = (object, x, y, index) => {
         //        object.curvePoints[index].x = x;
         //        object.curvePoints[index].y = y;
         //     };

         //     rect.pointTo.forEach((a) => {
         //        let l = this.lineMap.get(a);
         //        if (l) line.push(l);
         //     });

         //     // get all the arrows connected to rect

         //     if (line.length > 0) {
         //        line.forEach((l) => {
         //           let start = this.rectMap.get(l.startTo);
         //           let end = this.rectMap.get(l.endTo);
         //           if (start) {
         //              arrowStartRect.push(start);
         //           }
         //           if (end) {
         //              arrowEndRect.push(end);
         //           }
         //        });
         //     }

         //     if (arrowStartRect.length > 0) {
         //        arrowStartRect.forEach((ar) => {
         //           if (ar === rect) {
         //              line.forEach((l) => {
         //                 if (this.rectMap.get(l.startTo) === rect) {
         //                    const {
         //                       rect: r,
         //                       text: t,
         //                       sphere: s,
         //                    } = this.getShape(l.endTo);

         //                    const { curvePoints, lineType } = l;
         //                    const last = curvePoints.length - 1;

         //                    const { x, y } = this.getClosestPoints(
         //                       {
         //                          x: rect.x + rect.width / 2,
         //                          y: rect.y,
         //                          width: 5,
         //                          height: rect.height,
         //                       },
         //                       { x: curvePoints[last].x, y: curvePoints[last].y }
         //                    );
         //                    this.updateCurvePoint(l, x, y, 0);
         //                    if (r) {
         //                       const { x, y } = this.getClosestPoints(r, {
         //                          x: curvePoints[0].x,
         //                          y: curvePoints[0].y,
         //                       });
         //                       curvePoints[last].x = x;
         //                       curvePoints[last].y = y;
         //                    } else if (t) {
         //                       const { x, y } = this.getClosestPoints(t, {
         //                          x: curvePoints[0].x,
         //                          y: curvePoints[0].y,
         //                       });
         //                       curvePoints[last].x = x;
         //                       curvePoints[last].y = y;
         //                    } else if (s) {
         //                       const { x, y } = this.getClosestPointOnSphere(s, {
         //                          x: curvePoints[0].x,
         //                          y: curvePoints[0].y,
         //                       });
         //                       curvePoints[last].x = x;
         //                       curvePoints[last].y = y;
         //                    }
         //                 }
         //              });
         //           }
         //        });
         //     }

         //     if (arrowEndRect.length > 0) {
         //        arrowEndRect.forEach((ar) => {
         //           if (ar === rect) {
         //              line.forEach((l) => {
         //                 if (this.rectMap.get(l.endTo) === rect) {
         //                    // get the shape if connect to start
         //                    const {
         //                       rect: r,
         //                       text: t,
         //                       sphere: s,
         //                    } = this.getShape(l.startTo);

         //                    const { curvePoints } = l;
         //                    const last = curvePoints.length - 1;

         //                    const { x, y } = this.getClosestPoints(
         //                       {
         //                          x: rect.x + rect.width / 2,
         //                          y: rect.y,
         //                          width: 5,
         //                          height: rect.height,
         //                       },
         //                       { x: curvePoints[0].x, y: curvePoints[0].y }
         //                    );
         //                    updateCurvePoint(l, x, y, last);
         //                    if (r) {
         //                       const { x, y } = this.getClosestPoints(r, {
         //                          x: curvePoints[last].x,
         //                          y: curvePoints[last].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, 0);
         //                    } else if (t) {
         //                       const { x, y } = this.getClosestPoints(t, {
         //                          x: curvePoints[last].x,
         //                          y: curvePoints[last].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, 0);
         //                    } else if (s) {
         //                       const { x, y } = this.getClosestPointOnSphere(s, {
         //                          x: curvePoints[last].x,
         //                          y: curvePoints[last].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, 0);
         //                    }
         //                 }
         //              });
         //           }
         //        });
         //     }
         //  }
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

         this.updateLinesPointTo(arc);
         //  if (arc.pointTo?.length > 0) {
         //     let line = [];
         //     let arrowStartSphere = [];
         //     let arrowEndSphere = [];
         //     arc.pointTo.forEach((a) => {
         //        let l = this.lineMap.get(a);

         //        if (l) line.push(l);
         //     });

         //     line.forEach((l) => {
         //        let start = this.circleMap.get(l.startTo);
         //        let end = this.circleMap.get(l.endTo);
         //        if (start) {
         //           arrowStartSphere.push(start);
         //        }
         //        if (end) {
         //           arrowEndSphere.push(end);
         //        }
         //     });

         //     if (arrowStartSphere.length > 0) {
         //        arrowStartSphere.forEach((ar) => {
         //           if (ar == arc) {
         //              line.forEach((l) => {
         //                 if (this.circleMap.get(l.startTo) === arc) {
         //                    const { curvePoints, endTo } = l;
         //                    const {
         //                       rect: r,
         //                       text: t,
         //                       sphere: s,
         //                    } = this.getShape(endTo);
         //                    const last = curvePoints.length - 1;

         //                    const { x, y } = this.getClosestPointOnSphere(arc, {
         //                       x: curvePoints[last].x,
         //                       y: curvePoints[last].y,
         //                    });
         //                    this.updateCurvePoint(l, x, y, 0);

         //                    if (r) {
         //                       const { x, y } = this.getClosestPoints(r, {
         //                          x: curvePoints[0].x,
         //                          y: curvePoints[0].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, last);
         //                    } else if (t) {
         //                       const { x, y } = this.getClosestPoints(t, {
         //                          x: curvePoints[0].x,
         //                          y: curvePoints[0].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, last);
         //                    } else if (s) {
         //                       const { x, y } = this.getClosestPointOnSphere(s, {
         //                          x: curvePoints[0].x,
         //                          y: curvePoints[0].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, last);
         //                    }
         //                 }
         //              });
         //           }
         //        });
         //     }
         //     if (arrowEndSphere.length > 0) {
         //        arrowEndSphere.forEach((ar) => {
         //           if (ar == arc) {
         //              line.forEach((l) => {
         //                 if (this.circleMap.get(l.endTo) === arc) {
         //                    const { startTo, curvePoints } = l;
         //                    const {
         //                       rect: r,
         //                       text: t,
         //                       sphere: s,
         //                    } = this.getShape(startTo);

         //                    const last = l.curvePoints.length - 1;

         //                    const { x, y } = this.getClosestPointOnSphere(arc, {
         //                       x: curvePoints[0].x,
         //                       y: curvePoints[0].y,
         //                    });
         //                    this.updateCurvePoint(l, x, y, last);

         //                    if (r) {
         //                       const { x, y } = this.getClosestPoints(r, {
         //                          x: curvePoints[last].x,
         //                          y: curvePoints[last].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, 0);
         //                    } else if (t) {
         //                       const { x, y } = this.getClosestPoints(t, {
         //                          x: curvePoints[last].x,
         //                          y: curvePoints[last].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, 0);
         //                    } else if (s) {
         //                       const { x, y } = this.getClosestPointOnSphere(s, {
         //                          x: curvePoints[last].x,
         //                          y: curvePoints[last].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, 0);
         //                    }
         //                 }
         //              });
         //           }
         //        });
         //     }
         //  }
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
         this.updateLinesPointTo(text);
         //  if (text.pointTo.length > 0) {
         //     let arcs = text.pointTo.map((t) => {
         //        return this.lineMap.get(t);
         //     });
         //     let lineStart = [];
         //     let lineEnd = [];

         //     arcs.forEach((a) => {
         //        let start = this.textMap.get(a.startTo);
         //        let end = this.textMap.get(a.endTo);
         //        if (start) {
         //           lineStart.push(start);
         //        }
         //        if (end) {
         //           lineEnd.push(end);
         //        }
         //     });

         //     if (lineStart.length > 0) {
         //        lineStart.forEach((ar) => {
         //           if (ar === text) {
         //              arcs.forEach((a) => {
         //                 if (this.textMap.get(a.startTo) === text) {
         //                    const { curvePoints, endTo } = a;
         //                    const last = curvePoints.length - 1;
         //                    const {
         //                       rect: r,
         //                       text: t,
         //                       sphere: s,
         //                    } = this.getShape(endTo);

         //                    const { x, y } = this.getClosestPoints(
         //                       {
         //                          x: text.x + text.width / 2 - this.tolerance,
         //                          y: text.y,
         //                          width: this.tolerance,
         //                          height: text.height,
         //                       },
         //                       {
         //                          x: curvePoints[last].x,
         //                          y: curvePoints[last].y,
         //                       }
         //                    );
         //                    this.updateCurvePoint(a, x, y, 0);

         //                    if (r) {
         //                       //tail
         //                       const { x, y } = this.getClosestPoints(r, {
         //                          x: curvePoints[0].x,
         //                          y: curvePoints[0].y,
         //                       });
         //                       this.updateCurvePoint(a, x, y, last);
         //                    } else if (t) {
         //                       //tail
         //                       const { x, y } = this.getClosestPoints(t, {
         //                          x: curvePoints[0].x,
         //                          y: curvePoints[0].y,
         //                       });
         //                       this.updateCurvePoint(a, x, y, last);
         //                    } else if (t) {
         //                       //tail
         //                       const { x, y } = this.getClosestPointOnSphere(s, {
         //                          x: curvePoints[0].x,
         //                          y: curvePoints[0].y,
         //                       });
         //                       this.updateCurvePoint(a, x, y, last);
         //                    }
         //                 }
         //              });
         //           }
         //        });
         //     }

         //     if (lineEnd.length > 0) {
         //        lineEnd.forEach((ar) => {
         //           if (ar === text) {
         //              arcs.forEach((l) => {
         //                 if (this.textMap.get(l.endTo) === text) {
         //                    const { curvePoints, startTo } = l;
         //                    const last = curvePoints.length - 1;

         //                    const {
         //                       rect: r,
         //                       text: t,
         //                       sphere: s,
         //                    } = this.getShape(startTo);

         //                    const { x, y } = this.getClosestPoints(
         //                       {
         //                          x: text.x + text.width / 2 - this.tolerance,
         //                          y: text.y,
         //                          width: this.tolerance,
         //                          height: text.height,
         //                       },
         //                       {
         //                          x: curvePoints[0].x,
         //                          y: curvePoints[0].y,
         //                       }
         //                    );
         //                    this.updateCurvePoint(a, x, y, last);

         //                    if (r) {
         //                       const { x, y } = this.getClosestPoints(r, {
         //                          x: curvePoints[last].x,
         //                          y: curvePoints[last].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, 0);
         //                    } else if (t) {
         //                       const { x, y } = this.getClosestPoints(t, {
         //                          x: curvePoints[last].x,
         //                          y: curvePoints[last].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, 0);
         //                    } else if (s) {
         //                       const { x, y } = this.getClosestPointOnSphere(s, {
         //                          x: curvePoints[last].x,
         //                          y: curvePoints[last].y,
         //                       });
         //                       this.updateCurvePoint(l, x, y, 0);
         //                    }
         //                 }
         //              });
         //           }
         //        });
         //     }
         //  }
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
      } else if (image) {
         image.x = mouseX - image.offsetX;
         image.y = mouseY - image.offsetY;

         this.updateLinesPointTo(image);
         const { x, y, width, height, isActive } = image;
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
         if (isActive) {
            this.dots(
               { x: x - this.tolerance, y: y - this.tolerance },
               { x: x + width + this.tolerance, y: y - this.tolerance },
               {
                  x: x + width + this.tolerance,
                  y: y + height + this.tolerance,
               },
               { x: x - this.tolerance, y: y + height + this.tolerance },
               { context: this.breakPointsCtx }
            );

            this.breakPointsCtx.strokeStyle = this.activeColor;
            this.breakPointsCtx.rect(
               x - this.tolerance,
               y - this.tolerance,
               width + 2 * this.tolerance,
               height + 2 * this.tolerance
            );
            this.breakPointsCtx.stroke();
         }

         this.breakPointsCtx.scale(Scale.scale, Scale.scale);
         this.breakPointsCtx.drawImage(
            this.dragElement?.src,
            x,
            y,
            width,
            height
         );
         this.breakPointsCtx.restore();
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
      const imageResize = this.imageMap.get(this.resizeElement?.key);

      if (rect) {
         rect.isActive = true;
         const { x, y, width, height } = rect;
         if (height < 20) rect.height = 25;
         if (width < 20) rect.width = 25;
         if (this.resizeElement?.key)
            this.updateGuides(
               this.resizeElement.key,
               x,
               y,
               x + width,
               y + height
            );
      } else if (imageResize) {
         imageResize.isActive = true;
         this.breakPointsCtx.clearRect(
            0,
            0,
            this.canvasBreakpoints.width,
            this.canvasBreakpoints.height
         );
         this.drawImage();
         this.resizeElement = null;
         return;
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
               if (this.squareLineParams(rect, mouseX, mouseY)) {
                  if (rect.pointTo.includes(key) || line.endTo === rectKey) {
                     return;
                  }
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
                  if (
                     circle.pointTo.includes(key) ||
                     circleKey === line.endTo
                  ) {
                     return;
                  }
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
                  if (text.pointTo.includes(key) || textKey === line.endTo)
                     return;
                  text.pointTo.push(key);
                  line.startTo = textKey;
               }
            });

            this.imageMap.forEach((image, imageKey) => {
               if (this.squareLineParams(image, mouseX, mouseY)) {
                  if (image.pointTo.includes(key) || line.endTo === imageKey) {
                     return;
                  }

                  image.pointTo.push(key);
                  line.startTo = imageKey;
                  console.log(image);
               }
            });
         } else if (this.resizeElement.direction === "resizeEnd") {
            const length = line.curvePoints.length - 1;

            if (line.endTo) {
               const { rect, sphere, text } = this.getShape(line.endTo);
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
               const { pointTo } = rect;
               if (this.squareLineParams(rect, mouseX, mouseY)) {
                  if (line.startTo === rectKey || pointTo.includes(key)) return;
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
                  if (pointTo.includes(key) || circleKey === line.startTo)
                     return;
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
                  if (text.pointTo.includes(key) || textKey === line.startTo)
                     return;
                  text.pointTo.push(key);
                  line.endTo = textKey;
               }
            });

            this.imageMap.forEach((img, imgKey) => {
               if (this.squareLineParams(img, mouseX, mouseY)) {
                  if (line.startTo === imgKey || img.pointTo.includes(key))
                     return;
                  img.pointTo.push(key);
                  line.endTo = imgKey;
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
      const image = this.imageMap.get(this.dragElement?.key);

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
      } else if (image) {
         this.updateGuides(
            this.dragElement.key,
            image.x,
            image.y,
            image.x + image.width,
            image.y + image.height
         );
         this.dragElement = null;
         this.breakPointsCtx.clearRect(
            0,
            0,
            this.canvasBreakpoints.width,
            this.canvasBreakpoints.height
         );

         this.drawImage();
         if (image.pointTo.length > 0) this.draw();
         return;
      }

      this.breakPointsCtx.clearRect(
         0,
         0,
         this.canvasBreakpoints.width,
         this.canvasBreakpoints.height
      );
      if (!this.resizeElement && !this.dragElement) return;
      this.resizeElement = null;
      this.dragElement = null;
      this.draw();
      //   this.drawImage();
   }

   renderImageMove(object) {
      const { x, y, width, height, src, isActive } = object;
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
      if (isActive) {
         this.dots(
            { x: x - this.tolerance, y: y - this.tolerance },
            { x: x + this.tolerance, y: y - this.tolerance },
            { x: x + width + this.tolerance, y: y + height + this.tolerance },
            { x: x - this.tolerance, y: y + height + this.tolerance },
            { context: this.breakPointsCtx }
         );
         this.breakPointsCtx.rect(
            x - this.tolerance,
            y - this.tolerance,
            width + 2 * this.tolerance,
            height + 2 * this.tolerance
         );
      }
      this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      this.breakPointsCtx.drawImage(src, x, y, width, height);
      this.breakPointsCtx.restore();
   }

   insertNewAsset(e, setMode, setCurrentActive, currentActive, handler) {
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);
      if (config.mode === "rect") {
         const newRect = new Rect(mouseX, mouseY, 100, 100, [], 15, true);
         rectMap.set(newRect.id, newRect);
         // change modes
         setMode("free");
         config.mode = "free";

         // add breakpoint
         breakPoints.set(newRect.id, {
            minX: newRect.x,
            minY: newRect.y,
            maxX: newRect.x + newRect.width,
            maxY: newRect.y + newRect.height,
            midX: newRect.x + newRect.width / 2,
            midY: newRect.y + newRect.height / 2,
         });
         config.currentActive = newRect;
         this.draw();
      } else if (config.mode === "sphere") {
         const newSphere = new Circle(mouseX, mouseY, 50, 50);

         circleMap.set(newSphere.id, newSphere);

         // change modes
         setMode("free");
         config.mode = "free";

         // add breakpoint
         breakPoints.set(newSphere.id, {
            minX: newSphere.x - newSphere.xRadius,
            minY: newSphere.y - newSphere.yRadius,
            maxX: newSphere.x + newSphere.xRadius,
            maxY: newSphere.y + newSphere.yRadius,
            midX: newSphere.x,
            midY: newSphere.y,
         });

         config.currentActive = newSphere;
         this.draw();
      } else if (config.mode === "arrowLine") {
         const newArr = new Line(
            "elbow",
            mouseX,
            mouseY,
            mouseX + 100,
            mouseY,
            [
               { x: mouseX, y: mouseY },
               { x: mouseX + 100, y: mouseY },
            ],
            true
         );
         lineMap.set(newArr.id, newArr);
         config.mode = "free";
         setMode(config.mode);
         config.currentActive = newArr;

         this.draw();
      } else if (config.mode === "figure") {
         const newFigure = new Figure(mouseX, mouseY, "Figure", 100, 100);
         this.figureMap.set(newFigure.id, newFigure);
         renderFigure();
         config.mode = "free";
         setMode(config.mode);
         config.currentActive = newFigure;

         this.draw();
      }
      if (config.currentActive !== currentActive) {
         setCurrentActive(config.currentActive);
      }
   }

   insertImage(imageFile) {
      const id = Date.now();
      this.imageMap.set(id, imageFile);
      breakPoints.set(id, {
         minX: imageFile.x,
         minY: imageFile.y,
         maxX: imageFile.x + imageFile.width,
         maxY: imageFile.y + imageFile.height,
      });
      this.drawImage();
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
      const image = this.imageMap.get(key);
      return { rect, sphere, text, image };
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

   squareLineParams(obj, mouseX, mouseY) {
      const { x, y, width, height } = obj;
      return (
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
      );
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

      const draw = (obj) => {
         const { x, y, width, height } = obj;
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
      };

      this.rectMap.forEach((rect) => {
         if (this.squareLineParams(rect, mouseX, mouseY)) {
            draw(rect);
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

      this.imageMap.forEach((image) => {
         if (this.squareLineParams(image, mouseX, mouseY)) {
            draw(image);
         } else {
            this.breakPointsCtx.clearRect(
               0,
               0,
               this.canvasBreakpoints.width,
               this.canvasBreakpoints.height
            );
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

   canvasZoomInOutAndScroll(e, setScale) {
      // Get the bounding rectangle of the canvas
      const rect = this.canvas.getBoundingClientRect();
      // Calculate the mouse position relative to the canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      if (
         mouseX >= 0 &&
         mouseX <= this.canvas.width &&
         mouseY >= 0 &&
         mouseY <= this.canvas.height
      ) {
         if (e.ctrlKey) {
            e.preventDefault();

            if (e.deltaY > 0) {
               // zoom out
               Scale.scale /= Scale.scalingFactor;
            } else {
               //zoom in
               Scale.scale *= Scale.scalingFactor;
            }
            if (mouseX > rect.width / 2) {
               scrollBar.scrollPositionX += 10;
            } else if (mouseX < rect.width / 2) {
               scrollBar.scrollPositionX -= 10;
            }
            Scale.scale = Math.round(Scale.scale * 10) / 10;
            setScale(Scale.scale);
            //    e.preventDefault();
            //    // Calculate the mouse position in the canvas coordinates before scaling
            //    const mouseCanvasX =
            //       (mouseX + scrollBar.scrollPositionX) / Scale.scale;
            //    const mouseCanvasY =
            //       (mouseY + scrollBar.scrollPositionY) / Scale.scale;

            //    // Save the old scale
            //    const oldScale = Scale.scale;

            //    // Adjust the scale
            //    if (e.deltaY > 0) {
            //       // Zoom out
            //       Scale.scale /= Scale.scalingFactor;
            //    } else {
            //       // Zoom in
            //       Scale.scale *= Scale.scalingFactor;
            //    }

            //    // Round the scale
            //    Scale.scale = Math.round(Scale.scale * 10) / 10;
            //    setScale(Scale.scale);

            //    // Calculate the new scroll positions to keep the mouse position stationary
            //    scrollBar.scrollPositionX = mouseCanvasX * Scale.scale - mouseX;
            // //    scrollBar.scrollPositionY = mouseCanvasY * Scale.scale - mouseY;
         } else {
            if (e.deltaY > 0) {
               scrollBar.scrollPositionY += 40; // Adjust this value as needed
            } else {
               scrollBar.scrollPositionY -= 40; // Adjust this value as needed
            }
         }
         this.draw();
         this.drawImage();
      }
   }

   getCurrentShape(current) {
      switch (current.type) {
         case "rect":
            const newShape = new Rect(
               current.x,
               current.y,
               current.width,
               current.height,
               current.text,
               current.textSize
            );
            rectMap.set(newShape.id, newShape);
            return newShape;
         case "sphere":
            const newSphere = new Circle(
               current.x,
               current.y,
               current.xRadius,
               current.yRadius,
               current.text,
               current.textSize
            );
            circleMap.set(newSphere.id, newSphere);
            return newSphere;
         case "text":
            const newText = new Text(
               current.x,
               current.y,
               current.textSize,
               current.content,
               current.font,
               true
            );
            newText.height = newText.content.length * newText.textSize;
            textMap.set(newText.id, newText);
            return newText;
         default:
            break;
      }
   }

   duplicate(e) {
      if (e.altKey && config.mode !== "handsFree") {
         const current = this.canvasClick(e);

         if (current) {
            const newShape = this.getCurrentShape(current);

            const mouseMoveHandler = (moveEvent) => {
               const { x, y } = this.getTransformedMouseCoords(moveEvent);
               newShape.x = x;
               newShape.y = y;
               this.draw();
            };

            const mouseUpHandler = () => {
               if (newShape.type === "rect") {
                  breakPoints.set(newShape.id, {
                     minX: newShape.x,
                     maxX: newShape.x + newShape.width,
                     minY: newShape.y,
                     maxX: newShape.y + newShape.height,
                  });
               } else if (newShape.type === "sphere") {
                  breakPoints.set(newShape.id, {
                     minX: newShape.x - newShape.xRadius,
                     maxX: newShape.x + newShape.xRadius,
                     minY: newShape.y - newShape.yRadius,
                     maxX: newShape.y + newShape.yRadius,
                  });
               }
               this.canvas.removeEventListener("mousemove", mouseMoveHandler);
               this.canvas.removeEventListener("mouseup", mouseUpHandler);
               this.canvas.removeEventListener("click", this.canvasClick);
            };

            this.canvas.addEventListener("mousemove", mouseMoveHandler);
            this.canvas.addEventListener("mouseup", mouseUpHandler);
         }
      } else if (config.mode === "handsFree") {
         let { x, y } = this.getTransformedMouseCoords(e);
         const MAX_SCROLL_CHANGE = 2;
         const handlermove = (event) => {
            const { x: moveX, y: moveY } =
               this.getTransformedMouseCoords(event);
            if (moveX > x) {
               scrollBar.scrollPositionX =
                  scrollBar.scrollPositionX - (moveX - x);
            } else {
               scrollBar.scrollPositionX =
                  scrollBar.scrollPositionX + (x - moveX);
            }

            if (moveY > y) {
               scrollBar.scrollPositionY =
                  scrollBar.scrollPositionY - (moveY - y);
            } else {
               scrollBar.scrollPositionY =
                  scrollBar.scrollPositionY + (y - moveY);
            }

            this.draw();
            this.drawImage();
         };
         const handlerUp = () => {
            this.canvas.removeEventListener("mousemove", handlermove);
            this.canvas.removeEventListener("mouseup", handlerUp);
         };
         this.canvas.addEventListener("mousemove", handlermove);
         this.canvas.addEventListener("mouseup", handlerUp);
      }
   }

   duplicateCtrl_D(e) {
      if (e.ctrlKey && e.key === "d") {
         const padding = 10;
         e.preventDefault();
         this.rectMap.forEach((rect) => {
            if (rect.isActive) {
               let newRect = new Rect(
                  rect.x + padding,
                  rect.y + padding,
                  rect.width,
                  rect.height,
                  rect.text,
                  rect.textSize,
                  true
               );
               rectMap.set(newRect.id, newRect);
               breakPoints.set(newRect.id, {
                  minX: rect.x,
                  minY: rect.y,
                  maxX: rect.x + rect.width,
                  maxY: rect.y + rect.height,
               });
               rect.isActive = false;
            }
         });
         this.circleMap.forEach((sphere) => {
            if (sphere.isActive) {
               const newSphere = new Circle(
                  sphere.x + padding,
                  sphere.y + padding,
                  sphere.xRadius,
                  sphere.yRadius,
                  sphere.text,
                  sphere.textSize,
                  false
               );
               circleMap.set(newSphere.id, newSphere);
               breakPoints.set(newSphere.id, {
                  minX: newSphere.x - newSphere.xRadius,
                  minY: newSphere.y - newSphere.yRadius,
                  maxX: newSphere.x + newSphere.xRadius,
                  maxY: newSphere.y + newSphere.xRadius,
               });
               sphere.isActive = false;
            }
         });
         this.textMap.forEach((text) => {
            if (text.isActive) {
               const newText = new Text(
                  text.x + padding,
                  text.y + padding,
                  text.size,
                  text.content,
                  true
               );
               textMap.set(newText.id, newText);
               text.isActive = false;
            }
         });
         this.lineMap.forEach((line) => {
            if (line.isActive) {
               const newLine = new Line(
                  line.lineType,
                  line.minX,
                  line.minY,
                  line.maxX,
                  line.maxY,
                  line.curvePoints,
                  true
               );
               lineMap.set(newLine.id, newLine);
               console.log(lineMap);
               Line.isActive = false;
            }
         });
         this.draw();
      }
   }

   renderText(textArray, x, y, textSize, height, width, position = "left") {
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
         let midPoint;

         switch (position) {
            case "center":
               midPoint = x + (width - metrics.width) * 0.5;
               break;
            case "left":
               midPoint = x;
               break;
            case "right":
               midPoint = x + (width - metrics.width);
               break;
            default:
               break;
         }

         // Render the text
         this.context.fillText(textArray[i], midPoint, startY);

         // Move to the next line
         startY += textSize;
      }
   }

   //    newShape(shape) {
   //       this.rectMap.set(shape.id, shape);
   //       this.draw();
   //    }

   newText(event) {
      if (event.target.tagName === "TEXTAREA") return;

      if (config.mode === "free" || config.mode === "text") {
         const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(event);

         const html = `<textarea class="w-fit absolute px-[3px] text-[14px] outline-none z-[999] h-fit shadow-sm bg-transparent" id="input"></textarea>`;

         const canvasDiv = document.getElementById("canvas-div");
         canvasDiv.insertAdjacentHTML("afterbegin", html);
         const input = document.getElementById("input");
         input.style.left = mouseX + "px";
         input.style.top = mouseY + "px";
         input.style.fontSize = "18px";
         input.focus();
         const changeEvent = (e) => {
            const content = e.target.value.split("\n");
            const newText = new Text(mouseX, mouseY, 15, content, "Monoscope");
            this.textMap.set(newText.id, newText);
            input.remove();
         };

         input.addEventListener("change", changeEvent);

         input.addEventListener("blur", (e) => {
            input.removeEventListener("change", changeEvent);
            input.remove();
            this.draw();
         });
      }
   }

   initialize() {
      this.canvas.addEventListener("mouseup", this.mouseUp.bind(this));
      this.canvas.addEventListener("mousemove", this.mouseMove.bind(this));
      this.canvas.addEventListener("mousedown", (e) => {
         this.mouseDownDragAndResize(e);
         this.duplicate(e);
      });
      this.canvas.addEventListener("dblclick", this.newText.bind(this));
      window.addEventListener("keydown", this.duplicateCtrl_D.bind(this), {
         passive: false,
      });
   }

   cleanup() {
      this.canvas.removeEventListener("mouseup", this.mouseUp.bind(this));
      this.canvas.removeEventListener("mousemove", this.mouseMove.bind(this));
      this.canvas.removeEventListener("mousedown", (e) => {
         this.mouseDownDragAndResize(e);
         this.duplicate(e);
      });
      this.canvas.removeEventListener("dblclick", this.newText.bind(this));
      window.removeEventListener("keydown", this.duplicateCtrl_D.bind(this));
   }
}
