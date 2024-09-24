import { Scale, config, scrollBar, shapeTypes } from "@/lib/utils.ts";
import getStroke from "perfect-freehand";
import { canvasRecord } from "../_canvas/canvasRecord";
import {
   Circle,
   Figure,
   Line,
   Pencil,
   Polygons,
   Rect,
   Text,
} from "../_component/stylesClass.js";
import { Bin, Restore, redoType } from "./../_recycleBin.js";
import { lineResizeLogic, lineResizeWhenConnected } from "./resize/lineResize";
import {
   drawLine,
   drawRect,
   drawSHapes,
   drawSphere,
   drawText,
   findSlope,
} from "./utilsFunc.js";

const getStrokeOptions = {
   size: 3,
   thinning: 0.5,
   streamline: 0.5,
   // easing: (t) => t,
   // simulatePressure: true,
   last: true,
   start: {
      cap: true,
      taper: 0,
      easing: (t) => t,
   },
   end: {
      cap: true,
      taper: 0,
      easing: (t) => t,
   },
};

export default class Shapes {
   lastPoint = null;
   mouseCurrentPosition = { x: 0, y: 0 };
   canvasShapes = [];
   containers = [];

   constructor(canvas, canvasbreakPoints, renderCanvas, initialData, onChange) {
      this.onChange = onChange;
      this.initialData = initialData;
      this.canvas = canvas;
      this.canvasDiv = document.getElementById("canvas-div");
      this.canvasbreakPoints = canvasbreakPoints;
      this.renderCanvas = renderCanvas;
      this.isDrawing = false;
      this.mewShapeParams = null;
      this.activeColor = "hsl(95,78%,49%)";
      this.tolerance = 5;
      this.resizeElement = null;
      this.dragElement = null;
      this.context = this.canvas.getContext("2d");
      this.breakPointsCtx = this.canvasbreakPoints.getContext("2d");
      this.renderCanvasCtx = this.renderCanvas.getContext("2d");
      this.rectMap = new Map();
      this.circleMap = new Map();
      this.textMap = new Map();
      this.lineMap = new Map();
      this.imageMap = new Map();
      this.figureMap = new Map();
      this.breakPoints = new Map();
      this.pencilMap = new Map();
      this.otherShapes = new Map();
      this.cache = new Map();
      this.copies = [];
      this.massiveSelection = {
         isDown: false,
         startX: null,
         startY: null,
         isSelectedDown: false,
         isSelected: false,
         isSelectedMinX: Infinity,
         isSelectedMinY: Infinity,
         isSelectedMaxX: -Infinity,
         isSelectedMaxY: -Infinity,
         width: null,
         height: null,
      };
      this.copyShapes = [];
      this.setupInitialData();
   }

   setupInitialData() {
      this.initialData.forEach((val) => {
         const { Params, _id } = val;
         if (Params.type === shapeTypes.rect) {
            this.rectMap.set(Params.id, { ...Params, shapeId: _id });
         } else if (Params.type === shapeTypes.line) {
            this.lineMap.set(Params.id, { ...Params, shapeId: _id });
         } else if (Params.type === shapeTypes.circle) {
            this.circleMap.set(Params.id, { ...Params, shapeId: _id });
         } else if (Params.type === shapeTypes.text) {
            this.textMap.set(Params.id, { ...Params, shapeId: _id });
         } else if (Params.type === shapeTypes.figure) {
            this.figureMap.set(Params.id, { ...Params, shapeId: _id });
         } else if (Params.type === shapeTypes.image) {
            this.imageMap.set(Params.id, { ...Params, shapeId: _id });
         } else if (Params.type === shapeTypes.pencil) {
            this.pencilMap.set(Params.id, { ...Params, shapeId: _id });
         }
      });
   }

   newShape(x, y) {
      if (
         config.mode == "free" ||
         config.mode == "handsFree" ||
         config.mode == "image"
      )
         return;

      const shapeConfig = {
         rect: () => new Rect(x, y),
         sphere: () => new Circle(x, y),
         pencil: () => new Pencil(),
         arrowLine: () => {
            if (!this.newShapeParams) return new Line("elbow");
         },
         figure: () => new Figure(x, y, `Figure ${this.figureMap.size}`),
         line: () => {
            if (!this.newShapeParams) return new Line("curve");
         },
         hexagon: () => new Polygons(x, y, 1, 3),
         diamond: () => new Polygons(x, y, 1, 2),
         star: () => new Polygons(x, y, 0.6, 6),
         triangle: () => new Polygons(x, y, 0.5, 2),
      };

      const createShape = shapeConfig[config.mode];

      if (createShape) {
         const shape = createShape();
         if (shape) {
            this.lastPoint = { x, y };
            this.isDrawing = true;
            shape.isActive = config.mode !== "figure"; // Special case for figure
            this.newShapeParams = shape;
         }
      }
   }

   isBuildingShape(x, y) {
      const adjust = () => {
         if (this.lastPoint.x < x) {
            this.newShapeParams.width = x - this.lastPoint.x;
         } else if (this.lastPoint.x > x) {
            this.newShapeParams.width = this.lastPoint.x - x;
            this.newShapeParams.x = x;
         }
         if (this.lastPoint.y < y) {
            this.newShapeParams.height = y - this.lastPoint.y;
         } else if (this.lastPoint.y > y) {
            this.newShapeParams.height = this.lastPoint.y - y;
            this.newShapeParams.y = y;
         }
      };
      switch (this.newShapeParams?.type) {
         case shapeTypes.rect:
            adjust();
            return;
         case shapeTypes.circle:
            this.newShapeParams.xRadius = Math.abs(this.newShapeParams.x - x);
            this.newShapeParams.yRadius = Math.abs(this.newShapeParams.y - y);
            return;
         case shapeTypes.pencil:
            if (x < this.newShapeParams.minX) {
               this.newShapeParams.minX = x;
            }
            if (x > this.newShapeParams.maxX) {
               this.newShapeParams.maxX = x;
            }
            if (y < this.newShapeParams.minY) {
               this.newShapeParams.minY = y;
            }
            if (y > this.newShapeParams.maxY) {
               this.newShapeParams.maxY = y;
            }
            this.newShapeParams.points.push({ x, y });
            return;
         case shapeTypes.figure:
            adjust();
            return;
         case shapeTypes.others:
            this.newShapeParams.radius =
               Math.max(this.lastPoint.x, x) - Math.min(this.lastPoint.x, x);
            return;
      }
   }

   insertNew() {
      if (
         this.newShapeParams &&
         this.newShapeParams.type !== shapeTypes.line &&
         this.isDrawing
      ) {
         switch (this.newShapeParams?.type) {
            case shapeTypes.rect:
               this.newShapeParams.width = Math.max(
                  this.newShapeParams.width,
                  20,
               );
               this.newShapeParams.height = Math.max(
                  this.newShapeParams.height,
                  20,
               );

               this.rectMap.set(this.newShapeParams.id, this.newShapeParams);
               this.breakPoints.set(this.newShapeParams.id, {
                  minX: this.newShapeParams.x,
                  minY: this.newShapeParams.y,
                  maxX: this.newShapeParams.x + this.newShapeParams.width,
                  maxY: this.newShapeParams.y + this.newShapeParams.height,
               });
               config.mode = "free";
               this.isDrawing = false;
               break;
            case shapeTypes.circle:
               this.newShapeParams.xRadius = Math.max(
                  this.newShapeParams.xRadius,
                  15,
               );
               this.newShapeParams.yRadius = Math.max(
                  this.newShapeParams.yRadius,
                  15,
               );

               this.circleMap.set(this.newShapeParams.id, this.newShapeParams);
               this.breakPoints.set(this.newShapeParams.id, {
                  minX: this.newShapeParams.x - this.newShapeParams.xRadius,
                  minY: this.newShapeParams.y - this.newShapeParams.yRadius,
                  maxX: this.newShapeParams.x + this.newShapeParams.xRadius,
                  maxY: this.newShapeParams.y + this.newShapeParams.yRadius,
               });
               config.mode = "free";
               this.isDrawing = false;
               break;
            case shapeTypes.pencil:
               this.pencilMap.set(this.newShapeParams.id, this.newShapeParams);
               this.lastPoint = null;
               this.isDrawing = false;
               break;
            case shapeTypes.figure:
               this.newShapeParams.width = Math.max(
                  this.newShapeParams.width,
                  20,
               );
               this.newShapeParams.height = Math.max(
                  this.newShapeParams.height,
                  20,
               );

               this.figureMap.set(this.newShapeParams.id, this.newShapeParams);
               this.breakPoints.set(this.newShapeParams.id, {
                  minX: this.newShapeParams.x,
                  minY: this.newShapeParams.y,
                  maxX: this.newShapeParams.x + this.newShapeParams.width,
                  maxY: this.newShapeParams.y + this.newShapeParams.height,
               });
               this.isDrawing = false;
               config.mode = "free";
               break;
            case shapeTypes.others:
               this.isDrawing = false;
               this.newShapeParams.width = Math.abs(
                  2 * this.newShapeParams.radius,
               );
               this.newShapeParams.height = Math.abs(
                  2 * this.newShapeParams.radius,
               );
               // set breakpoints
               this.breakPoints.set(this.newShapeParams.id, {
                  minX: this.newShapeParams.x - this.newShapeParams.radius,
                  maxX: this.newShapeParams.x + this.newShapeParams.radius,
                  minY: this.newShapeParams.y - this.newShapeParams.radius,
                  maxY: this.newShapeParams.y + this.newShapeParams.radius,
               });

               this.otherShapes.set(
                  this.newShapeParams.id,
                  this.newShapeParams,
               );
               config.mode = "free";

               break;
            default:
               break;
         }
         if (this.newShapeParams.type !== "pencil") {
            this.breakPointsCtx.clearRect(
               0,
               0,
               this.canvasbreakPoints.width,
               this.canvasbreakPoints.height,
            );
         }
         canvasRecord.updateCurrentState();
         // insert to shapes
         this.canvasShapes.push(this.newShapeParams);

         config.currentActive = this.newShapeParams;
         this.newShapeParams = null;
         this.lastPoint = null;
         this.draw();
      }
   }

   insertNewLine() {
      if (
         this.newShapeParams &&
         this.newShapeParams.type === "line" &&
         this.isDrawing
      ) {
         this.breakPointsCtx.clearRect(
            0,
            0,
            this.canvasbreakPoints.width,
            this.canvasbreakPoints.height,
         );
         this.newShapeParams.curvePoints.pop();
         this.lineMap.set(this.newShapeParams.id, this.newShapeParams);
         this.draw();
         this.isDrawing = false;
         config.mode = "free";

         // insert line
         this.canvasShapes.push(this.newShapeParams);

         this.newShapeParams = null;
         this.lastPoint = null;
      }
   }

   insertAPointToLine(x, y) {
      if (
         this.newShapeParams &&
         this.newShapeParams.type === "line" &&
         this.isDrawing
      ) {
         if (x > this.newShapeParams.maxX) {
            this.newShapeParams.maxX = x;
         }
         if (x < this.newShapeParams.minX) {
            this.newShapeParams.minX = x;
         }
         if (y > this.newShapeParams.maxY) {
            this.newShapeParams.maxY = y;
         }
         if (y < this.newShapeParams.minY) {
            this.newShapeParams.minY = y;
         }

         if (this.newShapeParams.lineType === "elbow") {
            this.newShapeParams.curvePoints.push({ x, y });

            if (this.newShapeParams.curvePoints.length === 2) {
               // adding points
               let last = {
                  x: this.newShapeParams.curvePoints[1].x,
                  y: this.newShapeParams.curvePoints[1].y,
               };

               const midpoint = {
                  x: this.newShapeParams.curvePoints[1].x,
                  y: this.newShapeParams.curvePoints[0].y,
               };
               this.newShapeParams.curvePoints[1] = midpoint;
               this.newShapeParams.curvePoints[2] = last;

               this.lineMap.set(this.newShapeParams.id, this.newShapeParams);
               this.isDrawing = false;
               config.mode = "free";

               // inser the line
               this.canvasShapes.push(this.newShapeParams);

               this.newShapeParams = null;
               this.lastPoint = null;
               this.draw();
            }
         } else {
            this.newShapeParams.curvePoints.push({ x, y });
         }
      }
   }

   deleteAndSeletAll(e) {
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
         this.pencilMap.forEach((pencil) => {
            pencil.isActive = true;
         });
         this.otherShapes.forEach((o) => {
            o.isActive = true;
         });

         this.draw();
         this.drawImage();
      } else if (e.key === "Delete") {
         const deletebp = (key) => {
            if (this.breakPoints.has(key)) {
               this.breakPoints.delete(key);
            }
         };
         this.copies = [];
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
               });
               deletebp(key);
               this.copies.push(rect);
               this.rectMap.delete(key);
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
               deletebp(key);
               this.copies.push(arc);
               this.circleMap.delete(key);
            }
         });

         this.textMap.forEach((text, key) => {
            if (text.isActive) {
               text.pointTo.forEach((p) => {
                  let line = this.lineMap.get(p);
                  if (line) {
                     if (line.startTo === key && !line.isActive) {
                        line.startTo = null;
                     }
                     if (line.endTo === key && !line.isActive) {
                        line.endTo === null;
                     }
                  }
               });
               this.copies.push(text);
               this.textMap.delete(key);
            }
         });

         //remove image
         this.imageMap.forEach((image, key) => {
            if (image.isActive) {
               image.pointTo.forEach((p) => {
                  let line = this.lineMap.get(p);

                  if (line?.startTo === key && !line.isActive) {
                     line.startTo = null;
                  }
                  if (line?.endTo === key && !line.isActive) {
                     line.endTo === null;
                  }
                  deletebp(key);
                  this.copies.push(image);
                  this.imageMap.delete(key);
               });
            }
         });

         this.pencilMap.forEach((pencil, key) => {
            if (pencil.isActive) {
               this.pencilMap.delete(key);
               this.copies.push(pencil);
            }
         });

         this.otherShapes.forEach((o, key) => {
            if (!o.isActive) return;
            if (o.pointTo.length > 0) {
               o.pointTo.forEach((p) => {
                  const point = this.lineMap.get(p);
                  if (point) {
                     if (point.startTo === key) {
                        point.startTo = null;
                     } else {
                        point.endTo = null;
                     }
                  }
               });
            }
            deletebp(key);
            this.copies.push(JSON.parse(JSON.stringify(o)));
            this.otherShapes.delete(key);
         });

         this.massiveSelection = this.massiveSelection;

         this.breakPointsCtx.clearRect(
            0,
            0,
            this.canvasbreakPoints.width,
            this.canvasbreakPoints.height,
         );

         this.lineMap.forEach((line, key) => {
            if (line.isActive) {
               if (line.startTo) {
                  const { rect, text, sphere, image } = this.getShape(
                     line.startTo,
                  );
                  if (rect) {
                     rect.pointTo = rect.pointTo.filter((r) => r !== key);
                  }
                  if (text) {
                     text.pointTo = text.pointTo.filter((r) => r !== key);
                  }
                  if (sphere) {
                     sphere.pointTo = sphere.pointTo.filter((r) => r !== key);
                  }

                  if (image) {
                     image.pointTo = image.pointTo.filter((i) => i !== key);
                  }
               } else if (line.endTo) {
                  const { rect, text, sphere, image } = this.getShape(
                     line.endTo,
                  );

                  if (rect) {
                     rect.pointTo = rect.pointTo.filter((r) => r !== key);
                  }
                  if (text) {
                     text.pointTo = text.pointTo.filter((r) => r !== key);
                  }
                  if (sphere) {
                     sphere.pointTo = sphere.pointTo.filter((r) => r !== key);
                  }
                  if (image) {
                     image.pointTo = image.pointTo.filter((i) => i !== key);
                  }
               }
               this.copies.push(line);
               this.lineMap.delete(key);
            }
         });

         if (!this.copies.length) return;

         Bin.insert({ type: redoType.delete, shapes: this.copies });
         this.draw();
         this.drawImage();
      }
   }

   canvasClick(e) {
      if (config.mode === "handsFree" || config.mode === "pencil") {
         return;
      }
      // to get the current active shape so to show the shape options
      config.currentActive = null;

      const { x: clickX, y: clickY } = this.getTransformedMouseCoords(e);

      let circle = null;
      let square = null;
      let text = null;
      let minLine = null;
      let otherS = null;

      let smallestShape = null;
      const allSphape = [
         ...this.rectMap.values(),
         ...this.circleMap.values(),
         ...this.textMap.values(),
         ...this.lineMap.values(),
         ...this.otherShapes.values(),
      ];

      allSphape.forEach((value) => {
         let x = 0;
         let y = 0;
         let width = 0;
         let height = 0;
         switch (value.type) {
            case "polygon":
               x = value.x - value.radius;
               y = value.y - value.radius;
               width = value.width;
               height = value.height;
               break;
            case "sphere":
               x = value.x - value.xRadius;
               y = value.y - value.yRadius;
               width = 2 * value.xRadius;
               height = 2 * value.xRadius;
               break;
            case "line":
               x = value.minX;
               y = value.minY;
               width = value.maxX - value.minX;
               height = value.maxY - value.minY;
               break;
            default:
               x = value.x;
               y = value.y;
               width = value.width;
               height = value.height;
               break;
         }
         if (this.isIn(clickX, clickY, 0, 0, x, y, width, height)) {
            if (smallestShape == null || smallestShape.width > width) {
               smallestShape = value;
            }
         }
      });

      if (!smallestShape) return;
      if (!e.ctrlKey) this.removeActiveForAll();
      smallestShape.isActive = true;
      config.currentActive = smallestShape;
      return config.currentActive;
   }

   drawArrows(startPoint, endPoint, arrowLength, context = this.context) {
      // Draw the back arrowhead
      const firstPoint = startPoint;
      const lastPoint = endPoint;

      // Calculate the angle of the arrow
      let angle = Math.atan2(
         lastPoint.y - firstPoint.y,
         lastPoint.x - firstPoint.x,
      );

      // Draw the first side of the back arrowhead
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(
         lastPoint.x - arrowLength * Math.cos(angle - Math.PI / 6),
         lastPoint.y - arrowLength * Math.sin(angle - Math.PI / 6),
      );
      context.stroke();
      context.closePath();

      // Draw the second side of the back arrowhead
      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(
         lastPoint.x - arrowLength * Math.cos(angle + Math.PI / 6),
         lastPoint.y - arrowLength * Math.sin(angle + Math.PI / 6),
      );
      context.stroke();
      context.closePath();
   }

   createRectPath(rect) {
      const { x, y, width, height, radius = 0 } = rect;
      const path = new Path2D();
      if (radius > 0) {
         path.moveTo(x + radius, y);
         path.lineTo(x + width - radius, y);
         path.arcTo(x + width, y, x + width, y + radius, radius);
         path.lineTo(x + width, y + height - radius);
         path.arcTo(
            x + width,
            y + height,
            x + width - radius,
            y + height,
            radius,
         );
         path.lineTo(x + radius, y + height);
         path.arcTo(x, y + height, x, y + height - radius, radius);
         path.lineTo(x, y + radius);
         path.arcTo(x, y, x + radius, y, radius);
      } else {
         path.rect(x, y, width, height);
      }
      return path;
   }

   draw() {
      // Clear the canvas
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.context.save();
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;

      this.context.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY,
      );

      // Translate to the center
      this.context.translate(centerX, centerY);
      // Apply scaling
      this.context.scale(Scale.scale, Scale.scale);
      // Translate back from the center
      this.context.translate(-centerX, -centerY);
      // Enable anti-aliasing
      this.context.imageSmoothingEnabled = true;

      this.context.lineWidth = this.lineWidth;
      this.context.strokeStyle = "rgb(2, 211, 134)";

      const drawDotsAndRect = (x, y, width, height, tolerance, isActive) => {
         if (isActive) {
            // Draw dots
            if (!this.massiveSelection.isSelected)
               this.dots(
                  { x: x - tolerance, y: y - tolerance },
                  { x: x + width + tolerance, y: y - tolerance },
                  { x: x + width + tolerance, y: y + height + tolerance },
                  { x: x - tolerance, y: y + height + tolerance },
                  { context: this.context },
               );

            // Draw active rectangle
            this.context.beginPath();
            this.context.lineWidth = 1.5;
            this.context.strokeStyle = this.activeColor;
            this.context.rect(
               x - tolerance,
               y - tolerance,
               width + 2 * tolerance,
               height + 2 * tolerance,
            );
            this.context.stroke();
            this.context.closePath();
         }
      };

      const allShapes = [
         ...this.rectMap.values(),
         ...this.circleMap.values(),
         ...this.textMap.values(),
         ...this.lineMap.values(),
         ...this.figureMap.values(),
         ...this.otherShapes.values(),
      ];

      // allShapes.forEach(( [key, shape])  ) => {
      //    switch (shape.type) {
      //       case shapeTypes.rect:
      //          break;
      //    }
      // });

      // other shapes
      this.otherShapes.forEach((shape) => {
         const { x, y, inset, lines, radius, isActive, width, height } = shape;
         const r = Math.abs(radius);

         drawDotsAndRect(x - r, y - r, width, height, this.tolerance, isActive);

         drawSHapes(shape, this.context);
      });

      let figPath = [];
      let linePath = [];

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
            fontVarient,
            font,
            fontWeight,
            allignVertical,
         } = rect;

         drawDotsAndRect(x, y, width, height, this.tolerance, isActive);

         // Draw rounded rectangle
         drawRect(rect, this.context);
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
            isActive,
            fontWeight,
            fontVarient,
            font,
            allignVertical,
         } = sphere;
         const x = sphere.x - xRadius;
         const y = sphere.y - yRadius;
         const width = 2 * xRadius;
         const height = 2 * yRadius;

         drawDotsAndRect(x, y, width, height, this.tolerance, isActive);

         drawSphere(sphere, this.context);
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
            fontWeight,
            fontVarient,
         } = t;

         // Set the font size and style before measuring the text
         drawText(t, this.tolerance, this.context);

         drawDotsAndRect(
            x,
            y,
            width,
            height,
            this.tolerance,
            isActive,
            this.activeColor,
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
            fontVarient,
            fontWeight,
            font,
            allignVertical,
         } = line;

         this.context.beginPath();
         this.context.lineWidth = lineWidth;

         if (isActive) {
            if (lineType === "curve") {
               // Apply dotted line style
               this.context.setLineDash([5, 15]); // Adjust the pattern if needed
               this.context.lineWidth = 1; // Ensure this is the desired width for dotted lines
               this.context.strokeStyle = "red"; // Use a specific color for dotted lines

               // Draw the curve with the dotted line style
               this.context.moveTo(curvePoints[0].x, curvePoints[0].y);
               for (let i = 1; i < curvePoints.length; i++) {
                  this.context.lineTo(curvePoints[i].x, curvePoints[i].y);
               }
               this.context.stroke();
               this.context.setLineDash([]); // Reset the line dash to solid lines for other drawing operations
               this.context.closePath();
            }

            this.context.strokeStyle = this.activeColor;
            if (!this.massiveSelection.isSelected) {
               if (lineType === "curve") {
                  this.dots(...curvePoints, { context: this.context });
               } else {
                  if (curvePoints[curvePoints.length - 1])
                     this.dots(
                        { x: curvePoints[0].x, y: curvePoints[0].y },
                        {
                           x: curvePoints[curvePoints.length - 1].x,
                           y: curvePoints[curvePoints.length - 1].y,
                        },
                        { context: this.context },
                     );
               }
            }
         } else {
            this.context.strokeStyle = borderColor;
         }

         const headlen = 12;

         const path = drawLine({
            line,
            headlen,
            context: this.context,
            activeColor: this.activeColor,
         });
         linePath.push({ path, borderColor, isActive, lineWidth });

         //render text
         this.renderText(
            text,
            minX,
            minY,
            textSize,
            maxY - minY,
            maxX - minX,
            textPosition,
            fontWeight,
            fontVarient,
            font,
            allignVertical,
         );

         this.context.stroke();
         this.context.closePath();
      });

      // figures
      this.figureMap.forEach((figure) => {
         const { id, y, x, title, width, height, radius, isActive } = figure;
         let ele = document.querySelector(`[data-containerId="${id}"]`);

         if (!ele) {
            // If the element does not exist, create a new one
            ele = document.createElement("div");
            ele.setAttribute("data-containerId", id);
            ele.classList.add("z-[2]", "text-xs", "text-zinc-400", "p-[3px]");
            this.canvasDiv.append(ele);
         }
         ele.style.pointerEvents = isActive ? "none" : "visible";
         ele.textContent = title;
         ele.style.padding = "2px 3px";
         ele.style.position = "absolute";
         ele.style.width = `${width} px`;
         ele.style.height = `${height} px`;
         ele.style.border = isActive ? `1px solid ${this.activeColor}` : "none";
         ele.style.borderRadius = "3px";

         // Compute the unscaled position
         const unscaledY = y - scrollBar.scrollPositionY / Scale.scale;
         const unscaledX = x - scrollBar.scrollPositionX / Scale.scale;

         // Adjust position inversely related to the scaling factor
         ele.style.top = `${y - 32 - scrollBar.scrollPositionY / Scale.scale}px`;
         ele.style.left = `${x - scrollBar.scrollPositionX / Scale.scale}px`;

         // Apply scaling and translation using transform
         ele.style.transform = `scale(${Scale.scale})`;
         // ele.style.translate = `${scrollBar.scrollPositionX}px;`;
         ele.style.transformOrigin = "top left"; // Ensure scaling from the top-left corner

         if (isActive) {
            this.dots(
               { x: x, y: y },
               { x: x + width, y: y },
               {
                  x: x + width,
                  y: y + height,
               },
               { x: x, y: y + height },
               { context: this.context },
            );
         }

         //rect
         const path = drawRect(figure, this.context, this.activeColor, true);
         figPath.push({ path, isActive });
      });

      linePath.forEach(({ path, borderColor, isActive, lineWidth }) => {
         this.context.lineWidth = lineWidth;
         this.context.strokeStyle = isActive ? this.activeColor : borderColor;
         this.context.stroke(path);
      });
      figPath.forEach(({ path, isActive }) => {
         this.context.lineWidth = 1.2;
         this.context.strokeStyle = isActive ? this.activeColor : "grey";
         this.context.fillStyle = "black";
         // this.context.fill(path);
         this.context.stroke(path);
      });

      this.context.restore();
   }

   drawImage() {
      // Clear the canvas
      this.renderCanvasCtx.clearRect(
         0,
         0,
         this.renderCanvas.width,
         this.renderCanvas.height,
      );
      this.renderCanvasCtx.save();
      const centerX = this.renderCanvas.width / 2;
      const centerY = this.renderCanvas.height / 2;

      this.renderCanvasCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY,
      );
      // Translate to the center
      this.renderCanvasCtx.translate(centerX, centerY);
      // Apply scaling
      this.renderCanvasCtx.scale(Scale.scale, Scale.scale);

      this.renderCanvasCtx.translate(-centerX, -centerY);

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

      this.pencilMap.forEach((pencil) => {
         const {
            points,
            isActive,
            minX,
            minY,
            maxX,
            maxY,
            lineWidth,
            borderColor,
         } = pencil;
         if (isActive) {
            if (!this.massiveSelection.isSelected)
               this.dots(
                  { x: minX - this.tolerance, y: minY - this.tolerance },
                  { x: maxX + this.tolerance, y: minY - this.tolerance },
                  { x: maxX + this.tolerance, y: maxY + this.tolerance },
                  { x: minX - this.tolerance, y: maxY + this.tolerance },
                  { context: this.renderCanvasCtx },
               );

            this.renderCanvasCtx.beginPath();
            this.renderCanvasCtx.strokeStyle = this.activeColor;
            this.renderCanvasCtx.rect(
               minX - this.tolerance,
               minY - this.tolerance,
               maxX - minX + 2 * this.tolerance,
               maxY - minY + 2 * this.tolerance,
            );
            this.renderCanvasCtx.stroke();
            this.renderCanvasCtx.closePath();
         }
         const outline = getStroke(points, {
            size: lineWidth,
            thinning: 0.5,
            streamline: 0.5,
            // easing: (t) => t,
            // simulatePressure: true,
            last: true,
            start: {
               cap: true,
               taper: 0,
               easing: (t) => t,
            },
            end: {
               cap: true,
               taper: 0,
               easing: (t) => t,
            },
         });
         const stroke = this.getSvgPathFromStroke(outline);
         this.renderCanvasCtx.fillStyle = borderColor;
         this.renderCanvasCtx.fill(new Path2D(stroke));
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
            },
         );

         this.renderCanvasCtx.beginPath();
         this.renderCanvasCtx.strokeStyle = this.activeColor;
         this.renderCanvasCtx.rect(
            x - this.tolerance,
            y - this.tolerance,
            width + 2 * this.tolerance,
            height + 2 * this.tolerance,
         );
         this.renderCanvasCtx.stroke();
         this.renderCanvasCtx.closePath();
      }
      this.renderCanvasCtx.drawImage(img, x, y, width, height);
   }

   dots(...sides) {
      for (let i = 0; i < sides.length - 1; i++) {
         sides[sides.length - 1].context.beginPath();
         sides[sides.length - 1].context.lineWidth = 1.7;
         sides[sides.length - 1].context.strokeStyle = this.activeColor;
         sides[sides.length - 1].context.fillStyle = this.activeColor;
         sides[sides.length - 1].context.arc(
            sides[i].x,
            sides[i].y,
            5,
            0,
            2 * Math.PI,
            false,
         );
         sides[sides.length - 1].context.fill();
         sides[sides.length - 1].context.stroke();
         sides[sides.length - 1].context.closePath();
      }
   }

   getTransformedMouseCoords(event) {
      const rect = this.canvas.getBoundingClientRect();
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;

      // Adjust for canvas position on the page
      let mouseX = event.clientX - rect.left;
      let mouseY = event.clientY - rect.top;

      // Adjust for scroll positions and scale
      mouseX =
         (mouseX + scrollBar.scrollPositionX - centerX) / Scale.scale + centerX;
      mouseY =
         (mouseY + scrollBar.scrollPositionY - centerY) / Scale.scale + centerY;

      return { x: mouseX, y: mouseY };
   }

   rectResizeParams(x, y, width, height, mouseX, mouseY) {
      const leftEdge = mouseX >= x - this.tolerance && mouseX <= x;
      const rightEdge =
         mouseX >= x + width && mouseX <= x + width + this.tolerance;
      const verticalBounds =
         mouseY >= y + this.tolerance && mouseY <= y + height - this.tolerance;
      //  // top - bottom
      const withinTopEdge =
         mouseY >= y - this.tolerance && mouseY <= y + this.tolerance;
      const withinBottomEdge =
         mouseY >= y + height - this.tolerance &&
         mouseY <= y + height + this.tolerance;
      const withinHorizontalBounds =
         mouseX > x + this.tolerance && mouseX < x + width - this.tolerance;
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
      return [
         { condition: leftEdge && verticalBounds, side: "left-edge" },
         { condition: rightEdge && verticalBounds, side: "right-edge" },
         {
            condition: withinTopEdge && withinHorizontalBounds,
            side: "top-edge",
         },
         {
            condition: withinBottomEdge && withinHorizontalBounds,
            side: "bottom-edge",
         },
         { condition: withinTopLeftCorner, side: "top-left" },
         { condition: withinBottomLeftCorner, side: "bottom-left" },
         { condition: withinTopRightCorner, side: "top-right" },
         { condition: withinBottomRightCorner, side: "bottom-right" },
         { condition: withinTopRightCorner, side: "top-right" },
      ];
   }

   mouseDownDragAndResize(e) {
      if (e.altKey || e.ctrlKey || config.mode === "handsFree") return;
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

      // to sore the shape which have changed for undo and redo
      this.copies = [];

      this.newShape(mouseX, mouseY);
      if (this.isDrawing || this.newShapeParams) return;

      // check if multiple selected exist
      if (
         this.massiveSelection.isSelected &&
         mouseX >= this.massiveSelection.isSelectedMinX &&
         mouseX <= this.massiveSelection.isSelectedMaxX &&
         mouseY >= this.massiveSelection.isSelectedMinY &&
         mouseY <= this.massiveSelection.isSelectedMaxY
      ) {
         const total = [];

         this.rectMap.forEach((rect) => {
            if (rect.isActive) {
               rect.offsetX = rect.x - mouseX;
               rect.offsetY = rect.y - mouseY;
               this.copies.push(JSON.parse(JSON.stringify(rect)));
               if (rect.pointTo.length) {
                  rect.pointTo.forEach((p) => {
                     const line = this.lineMap.get(p);
                     if (!line) return;
                     this.copies.push(JSON.parse(JSON.stringify(line)));
                  });
               }
            }
         });

         this.circleMap.forEach((circle) => {
            if (circle.isActive) {
               circle.offsetX = circle.x - mouseX;
               circle.offsetY = circle.y - mouseY;
               this.copies.push(JSON.parse(JSON.stringify(circle)));
               if (circle.pointTo.length) {
                  circle.pointTo.forEach((p) => {
                     const l = this.lineMap.get(p);
                     if (!l) return;
                     this.copies.push(JSON.parse(JSON.stringify(l)));
                  });
               }
            }
         });

         this.textMap.forEach((text) => {
            if (text.isActive) {
               text.offsetX = text.x - mouseX;
               text.offsetY = text.y - mouseY;
               this.copies.push(JSON.parse(JSON.stringify(text)));
            }
         });

         this.lineMap.forEach((line) => {
            if (line.isActive) {
               line.curvePoints.forEach((p) => {
                  p.offsetX = p.x - mouseX;
                  p.offsetY = p.y - mouseY;
                  total.push({ s: line, bp: null });
               });
            }
         });

         this.figureMap.forEach((fig) => {
            if (fig.isActive) {
               fig.isActive = true;
               fig.offsetX = fig.x - mouseX;
               fig.offsetY = fig.y - mouseY;
            }
         });

         this.pencilMap.forEach((pencil) => {
            if (pencil.isActive) {
               pencil.offsetX = pencil.minX - mouseX;
               pencil.offsetY = pencil.minY - mouseY;
               pencil.width = pencil.maxX - pencil.minX;
               pencil.height = pencil.maxY - pencil.minY;
               pencil.points.forEach((point) => {
                  point.offsetX = point.x - mouseX;
                  point.offsetY = point.y - mouseY;
               });
            }
         });

         this.imageMap.forEach((image) => {
            const { x, y, width, height, isActive } = image;
            if (isActive) {
               image.offsetX = x - mouseX;
               image.offsetY = y - mouseY;
            }
         });

         this.otherShapes.forEach((other) => {
            const { x, y, width, height, isActive } = other;
            if (isActive) {
               other.offsetX = mouseX - x;
               other.offsetY = mouseY - y;
            }
         });

         this.massiveSelection.isSelectedDown = true;
         //calculatin offset and width
         this.massiveSelection.offsetX =
            this.massiveSelection.isSelectedMinX - mouseX;
         this.massiveSelection.offsetY =
            this.massiveSelection.isSelectedMinY - mouseY;
         this.massiveSelection.width =
            this.massiveSelection.isSelectedMaxX -
            this.massiveSelection.isSelectedMinX;
         this.massiveSelection.height =
            this.massiveSelection.isSelectedMaxY -
            this.massiveSelection.isSelectedMinY;
         return;
      } else {
         this.breakPointsCtx.clearRect(
            0,
            0,
            this.canvasbreakPoints.width,
            this.canvasbreakPoints.height,
         );
         this.massiveSelection.isDown = false;
         this.massiveSelection.startX = null;
         this.massiveSelection.startY = null;
         this.massiveSelection.isSelectedDown = false;
         this.massiveSelection.isSelected = false;
         this.massiveSelection.isSelectedMinX = Infinity;
         this.massiveSelection.isSelectedMinY = Infinity;
         this.massiveSelection.isSelectedMaxX = -Infinity;
         this.massiveSelection.isSelectedMaxY = -Infinity;
         this.massiveSelection.width = null;
         this.massiveSelection.height = null;
      }

      config.currentActive = null;
      let isResizing = false;

      this.canvasShapes.forEach((shape, index) => {
         const { x, y, width, height, isActive, containerId } = shape;
         if (isResizing || !isActive) return;

         // find container if in
         const findContainer = this.containers.find(
            (v) => v.id === containerId,
         );

         const setActiveResizing = (resizeParams) => {
            shape.isActive = true;
            isResizing = true;
            config.currentActive = shape;
            this.resizeElement = { ...resizeParams, index, type: shape.type };
            this.copies.push(JSON.parse(JSON.stringify(shape)));
         };

         const checkAndSetActiveResizing = (resizeParams) => {
            if (findContainer || !findContainer?.isActive) {
               setActiveResizing(resizeParams);
            }
         };

         switch (shape.type) {
            case shapeTypes.image:
               const resizeProps = (param) => {
                  shape.isActive = true;
                  isResizing = true;
                  const img = new Image();
                  img.src = shape.src;
                  config.currentActive = shape;
                  this.resizeElement = {
                     ...param,
                     img,
                     index,
                  };
               };
               const arr = this.rectResizeParams(
                  x,
                  y,
                  width,
                  height,
                  mouseX,
                  mouseY,
               );

               const resize = (param) => {
                  if (findContainer && !findContainer.isActive) {
                     resizeProps(param);
                  } else if (!containerId) {
                     resizeProps(param);
                  }
               };

               arr.forEach((c) => {
                  if (c.condition === true) {
                     resize({ x, y, width, height, key, direction: c.side });
                  }
               });

               break;
            case shapeTypes.rect:
               const rectResizeParams = this.rectResizeParams(
                  x,
                  y,
                  width,
                  height,
                  mouseX,
                  mouseY,
               );
               rectResizeParams.forEach((condition) => {
                  if (condition.condition) {
                     checkAndSetActiveResizing({
                        x,
                        y,
                        width,
                        height,
                        direction: condition.side,
                     });
                     return;
                  }
               });
               break;
            case shapeTypes.circle:
               const forXless = shape.x - shape.xRadius;
               const forXmore = shape.x + shape.xRadius;
               const forYless = shape.y - shape.yRadius;
               const forYmore = shape.y + shape.yRadius;

               //horizontel resizing
               const leftEdge =
                  mouseX >= forXless - this.tolerance && mouseX <= forXless;
               const rightEdge =
                  mouseX >= forXmore && mouseX <= forXmore + this.tolerance;
               const verticalBounds =
                  mouseY >= forYless + this.tolerance &&
                  mouseY <= forYmore - this.tolerance;
               //vertical resizing
               const topEdge =
                  mouseY >= forYless - this.tolerance && mouseY <= forYless;
               const bottomEdge =
                  mouseY >= forYmore && mouseY <= forYmore + this.tolerance;
               const horizontalBounds =
                  mouseX >= forXless + this.tolerance &&
                  mouseX <= forXmore - this.tolerance;

               if ((leftEdge || rightEdge) && verticalBounds) {
                  checkAndSetActiveResizing({ direction: "horizontel", key });
               } else if ((topEdge || bottomEdge) && horizontalBounds) {
                  checkAndSetActiveResizing({ direction: "vertical", key });
               } else if (
                  // Top-left corner
                  (mouseX >= forXless - this.tolerance &&
                     mouseX <= forXless + this.tolerance &&
                     mouseY >= forYless - this.tolerance &&
                     mouseY <= forYless + this.tolerance) ||
                  // Top-right corner
                  (mouseX >= forXmore - this.tolerance &&
                     mouseX <= forXmore + this.tolerance &&
                     mouseY >= forYless - this.tolerance &&
                     mouseY <= forYless + this.tolerance) ||
                  // Bottom-left corner
                  (mouseX >= forXless - this.tolerance &&
                     mouseX <= forXless + this.tolerance &&
                     mouseY >= forYmore - this.tolerance &&
                     mouseY <= forYmore + this.tolerance) ||
                  // Bottom-right corner
                  (mouseX >= forXmore - this.tolerance &&
                     mouseX <= forXmore + this.tolerance &&
                     mouseY >= forYmore - this.tolerance &&
                     mouseY <= forYmore + this.tolerance)
               ) {
                  checkAndSetActiveResizing({ direction: "corners" });
               }
               break;
            case shapeTypes.pencil:
               const { maxX, minY, maxY, minX, isActive, containerId } = shape;

               if (!isActive) return;

               const container = this.figureMap.get(containerId);

               const setActiveResizing = (resizeParams) => {
                  shape.isActive = true;
                  isResizing = true;
                  config.currentActive = shape;
                  this.resizeElement = { ...resizeParams, index };
               };

               // resize params
               const pencilResizeParams = this.rectResizeParams(
                  minX,
                  minY,
                  maxX - minX,
                  maxY - minY,
                  mouseX,
                  mouseY,
               );
               pencilResizeParams.forEach((cond) => {
                  if (cond.condition) {
                     checkAndSetActiveResizing({
                        direction: cond.side,
                        initialMaxX: maxX,
                        initialMinX: minX,
                        initialMaxY: maxY,
                        initialMinY: minY,
                     });
                     shape.points.forEach((point) => {
                        point.offsetX = point.x - mouseX;
                        point.offsetY = point.y - mouseY;
                     });
                  }
               });
               break;
            case shapeTypes.line:
               let points = shape.curvePoints;
               for (let i = 0; i < points.length; i++) {
                  if (
                     mouseX >= points[i].x - 5 &&
                     mouseX <= points[i].x + 5 &&
                     mouseY >= points[i].y - 5 &&
                     mouseY <= points[i].y + 5
                  ) {
                     if (i == 0) {
                        checkAndSetActiveResizing({ direction: "resizeStart" });
                     } else if (i == points.length - 1) {
                        checkAndSetActiveResizing({ direction: "resizeEnd" });
                     } else {
                        checkAndSetActiveResizing({
                           direction: null,
                           i,
                        });
                     }
                  }
               }
               break;
            default:
               break;
         }
      });

      if (isResizing) return;

      //image resize
      this.imageMap.forEach((image, key) => {
         const { x, y, width, height, isActive, containerId } = image;
         if (!isActive) return;

         const container = this.figureMap.get(containerId);
         const resizeProps = (param) => {
            image.isActive = true;
            isResizing = true;
            const img = new Image();
            img.src = image.src;
            config.currentActive = image;
            this.resizeElement = {
               ...param,
               img,
            };
         };

         const resize = (param) => {
            if (container && !container.isActive) {
               resizeProps(param);
            } else if (!containerId) {
               resizeProps(param);
            }
         };

         // check which side to resize
         const arr = this.rectResizeParams(x, y, width, height, mouseX, mouseY);
         arr.forEach((c) => {
            if (c.condition === true) {
               resize({ x, y, width, height, key, direction: c.side });
            }
         });
      });
      if (isResizing) return;

      // figure resize
      this.figureMap.forEach((fig, key) => {
         const { x, y, width, height, isActive } = fig;
         if (!isActive) return;

         const arr = this.rectResizeParams(x, y, width, height, mouseX, mouseY);
         arr.forEach((cond) => {
            if (cond.condition) {
               fig.isActive = true;
               isResizing = true;
               config.currentActive = fig;
               this.resizeElement = {
                  direction: cond.side,
                  key,
                  x,
                  y,
                  width,
                  height,
               };
               return;
            }
         });
      });
      if (isResizing) return;

      // line resize
      this.lineMap.forEach((line, key) => {
         if (!line.isActive) return;

         let points = line.curvePoints;

         const container = this.figureMap.get(line.containerId);

         for (let i = 0; i < points.length; i++) {
            if (
               mouseX >= points[i].x - 5 &&
               mouseX <= points[i].x + 5 &&
               mouseY >= points[i].y - 5 &&
               mouseY <= points[i].y + 5 &&
               line.isActive
            ) {
               if (container && !container.isActive) {
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
                  this.copies.push(JSON.parse(JSON.stringify(line)));
                  config.currentActive = line;
                  isResizing = true;
               } else if (!line.containerId) {
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
                  this.copies.push(JSON.parse(JSON.stringify(line)));
                  config.currentActive = line;
                  isResizing = true;
               }
            }
         }
      });
      if (isResizing) return;

      // rect resize
      this.rectMap.forEach((rect, key) => {
         const { isActive, x, y, width, height, containerId } = rect;
         if (!isActive) return;

         const container = this.figureMap.get(containerId);

         const setActiveResizing = (resizeParams) => {
            rect.isActive = true;
            isResizing = true;
            config.currentActive = rect;
            this.resizeElement = resizeParams;
         };

         const checkAndSetActiveResizing = (resizeParams) => {
            if (container && !container.isActive) {
               setActiveResizing(resizeParams);
            } else if (!containerId) {
               setActiveResizing(resizeParams);
            }
         };

         const arr = this.rectResizeParams(x, y, width, height, mouseX, mouseY);
         arr.forEach((condition) => {
            if (condition.condition) {
               checkAndSetActiveResizing({
                  x,
                  y,
                  width,
                  height,
                  key,
                  direction: condition.side,
               });
               this.copies.push(JSON.parse(JSON.stringify(rect)));
               return;
            }
         });
      });

      if (isResizing) return;

      // sphere resize
      this.circleMap.forEach((arc, key) => {
         if (!arc.isActive) return;

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
         //vertical resizing
         const topEdge =
            mouseY >= forYless - this.tolerance && mouseY <= forYless;
         const bottomEdge =
            mouseY >= forYmore && mouseY <= forYmore + this.tolerance;
         const horizontalBounds =
            mouseX >= forXless + this.tolerance &&
            mouseX <= forXmore - this.tolerance;

         const arcResize = (resizeParams) => {
            arc.isActive = true; // Set the circle as active
            arc.horizontelResizing = true; // Set the horizontal resizing flag
            isResizing = true;
            this.resizeElement = resizeParams;
            config.currentActive = arc;
         };

         const checkAndResize = (resizeParams) => {
            if (container && !container.isActive) {
               arcResize(resizeParams);
            } else if (!arc.containerId) {
               arcResize(resizeParams);
            }
         };

         const container = this.figureMap.get(arc.containerId);

         if ((leftEdge || rightEdge) && verticalBounds) {
            checkAndResize({ direction: "horizontel", key });
            this.copies.push(JSON.parse(JSON.stringify(arc)));
         } else if ((topEdge || bottomEdge) && horizontalBounds) {
            checkAndResize({ direction: "vertical", key });
            this.copies.push(JSON.parse(JSON.stringify(arc)));
         } else if (
            // Top-left corner
            (mouseX >= forXless - this.tolerance &&
               mouseX <= forXless + this.tolerance &&
               mouseY >= forYless - this.tolerance &&
               mouseY <= forYless + this.tolerance) ||
            // Top-right corner
            (mouseX >= forXmore - this.tolerance &&
               mouseX <= forXmore + this.tolerance &&
               mouseY >= forYless - this.tolerance &&
               mouseY <= forYless + this.tolerance) ||
            // Bottom-left corner
            (mouseX >= forXless - this.tolerance &&
               mouseX <= forXless + this.tolerance &&
               mouseY >= forYmore - this.tolerance &&
               mouseY <= forYmore + this.tolerance) ||
            // Bottom-right corner
            (mouseX >= forXmore - this.tolerance &&
               mouseX <= forXmore + this.tolerance &&
               mouseY >= forYmore - this.tolerance &&
               mouseY <= forYmore + this.tolerance)
         ) {
            checkAndResize({ direction: "corners", key });
            this.copies.push(JSON.parse(JSON.stringify(arc)));
         }
      });

      if (isResizing) return;

      //text resize
      this.textMap.forEach((text, key) => {
         if (!text.isActive) return;

         if (
            mouseX > text.x + text.width - this.tolerance &&
            mouseX <= text.x + text.width + this.tolerance &&
            mouseY > text.y + text.height - this.tolerance &&
            mouseY <= text.y + text.height + this.tolerance
         ) {
            if (text.containerId) {
               const container = this.figureMap.get(text.containerId);
               if (container && !container.isActive) {
                  isResizing = true;
                  this.resizeElement = {
                     key,
                  };
                  config.currentActive = text;
               }
               this.copies.push(JSON.parse(JSON.stringify(text)));
            } else if (!text.containerId) {
               isResizing = true;
               this.resizeElement = {
                  key,
               };
               this.copies.push(JSON.parse(JSON.stringify(text)));
               config.currentActive = text;
            }
         }
      });

      if (isResizing) return;

      this.pencilMap.forEach((pencil, key) => {
         const { maxX, minY, maxY, minX, isActive, containerId } = pencil;

         if (!isActive) return;

         const container = this.figureMap.get(containerId);

         const setActiveResizing = (resizeParams) => {
            pencil.isActive = true;
            isResizing = true;
            config.currentActive = pencil;
            this.resizeElement = resizeParams;
            pencil.points.forEach((point) => {
               point.offsetX = point.x - mouseX;
               point.offsetY = point.y - mouseY;
            });
            this.copies.push(JSON.parse(JSON.stringify(pencil)));
         };

         const checkAndSetActiveResizing = (resizeParams) => {
            if (container && !container.isActive) {
               setActiveResizing(resizeParams);
            } else if (!containerId) {
               setActiveResizing(resizeParams);
            }
         };

         // resize params
         const arr = this.rectResizeParams(
            minX,
            minY,
            maxX - minX,
            maxY - minY,
            mouseX,
            mouseY,
         );
         arr.forEach((cond) => {
            if (cond.condition) {
               checkAndSetActiveResizing({
                  direction: cond.side,
                  key,
                  initialMaxX: maxX,
                  initialMinX: minX,
                  initialMaxY: maxY,
                  initialMinY: minY,
               });
            }
         });
      });

      if (isResizing) return;

      this.otherShapes.forEach((other, key) => {
         const { isActive, x, y, width, height, radius } = other;
         if (!isActive) return;
         const arr = this.rectResizeParams(
            x - radius,
            y - radius,
            width,
            height,
            mouseX,
            mouseY,
         );
         arr.forEach((cond) => {
            if (cond.condition) {
               this.resizeElement = { initailX: mouseX, key };
               isResizing = true;
               config.currentActive = other;
               this.copies.push(JSON.parse(JSON.stringify(other)));
               return;
            }
         });
      });

      if (isResizing) return;

      // Drag --------------------
      const setDragging = (obj) => {
         obj.isActive = true;
         obj.offsetX = mouseX - obj.x;
         obj.offsetY = mouseY - obj.y;
      };
      let smallestShape = null;
      let smallestShapeKey = null;
      this.canvasShapes.forEach((shape, index) => {
         if (shape.type === shapeTypes.figure && !shape.isActive) return;

         const findContainer = this.containers.find(
            (v) => v.id === shape.containerId,
         );

         if (shape.isActive) shape.isActive = false;
         let x = 0;
         let y = 0;
         let width = 0;
         let height = 0;
         switch (shape.type) {
            case shapeTypes.others:
               x = shape.x - shape.radius;
               y = shape.y - shape.radius;
               width = shape.width;
               height = shape.height;
               break;
            case shapeTypes.circle:
               x = shape.x - shape.xRadius;
               y = shape.y - shape.yRadius;
               width = 2 * shape.xRadius;
               height = 2 * shape.xRadius;
               break;
            case shapeTypes.pencil:
               x = shape.minX;
               y = shape.minY;
               width = shape.maxX - shape.minX;
               height = shape.maxY - shape.minY;
               break;
            default:
               x = shape.x;
               y = shape.y;
               width = shape.width;
               height = shape.height;
               break;
         }

         if (shape.type === shapeTypes.line) {
            const { curvePoints, lineType, minX, maxX, minY, maxY } = shape;
            let inside = false;
            for (let i = 0; i < curvePoints.length - 1; i++) {
               let slope1 = findSlope(
                  mouseY,
                  curvePoints[i].y,
                  mouseX,
                  curvePoints[i].x,
               );
               let slope2 = findSlope(
                  mouseY,
                  curvePoints[i + 1].y,
                  mouseX,
                  curvePoints[i + 1].x,
               );
               if (!isFinite(slope1)) slope1 = Infinity;
               if (!isFinite(slope2)) slope2 = Infinity;

               if (Math.abs(slope1 - slope2) <= 0.3) {
                  inside = true;
                  break;
               }
            }
            if (
               inside &&
               mouseX >= minX - this.tolerance &&
               mouseX <= maxX + this.tolerance &&
               mouseY >= minY - this.tolerance &&
               mouseY <= maxY + this.tolerance
            ) {
               if (!findContainer || !findContainer.isActive) {
                  if (
                     smallestShape === null ||
                     smallestShape.width > maxX - minX
                  ) {
                     // smallestLine = { l, key };
                     smallestShape = shape;
                     smallestShapeKey = index;
                     this.copies.push(JSON.parse(JSON.stringify(shape)));
                  }
               }
            }
         } else {
            if (this.isIn(mouseX, mouseY, 0, 0, x, y, width, height)) {
               if (!findContainer || !findContainer.isActive) {
                  if (smallestShape === null || smallestShape.width > width) {
                     smallestShape = shape;
                     smallestShapeKey = index;
                     this.copies.push(JSON.parse(JSON.stringify(shape)));

                     // connected lines
                     if (shape.pointTo && shape.pointTo.length > 0) {
                        shape.pointTo.forEach((p) => {
                           const theLIne = this.lineMap.get(p);
                           if (theLIne) {
                              this.copies.push(
                                 JSON.parse(JSON.stringify(theLIne)),
                              );
                           }
                        });
                     }
                  }
               }
            }
         }
      });

      // drag logi for shapes
      // const allShapes = [
      //    ...Array.from(this.rectMap.entries()),
      //    ...Array.from(this.circleMap.entries()),
      //    ...Array.from(this.textMap.entries()),
      //    ...Array.from(this.pencilMap.entries()),
      //    ...Array.from(this.otherShapes.entries()),
      //    ...Array.from(this.imageMap.entries()),
      //    ...Array.from(this.figureMap.entries()),
      // ];

      // allShapes.forEach(([key, shape]) => {
      //    if (shape.type === shapeTypes.figure && !shape.isActive) return;

      //    const container = this.figureMap.get(shape.containerId);
      //    if (shape.isActive) shape.isActive = false;
      //    let x = 0;
      //    let y = 0;
      //    let width = 0;
      //    let height = 0;
      //    switch (shape.type) {
      //       case shapeTypes.others:
      //          x = shape.x - shape.radius;
      //          y = shape.y - shape.radius;
      //          width = shape.width;
      //          height = shape.height;
      //          break;
      //       case shapeTypes.circle:
      //          x = shape.x - shape.xRadius;
      //          y = shape.y - shape.yRadius;
      //          width = 2 * shape.xRadius;
      //          height = 2 * shape.xRadius;
      //          break;
      //       case shapeTypes.pencil:
      //          x = shape.minX;
      //          y = shape.minY;
      //          width = shape.maxX - shape.minX;
      //          height = shape.maxY - shape.minY;
      //          break;
      //       default:
      //          x = shape.x;
      //          y = shape.y;
      //          width = shape.width;
      //          height = shape.height;
      //          break;
      //    }

      //    if (this.isIn(mouseX, mouseY, 0, 0, x, y, width, height)) {
      //       if (!container || !container.isActive) {
      //          if (smallestShape === null || smallestShape.width > width) {
      //             smallestShape = shape;
      //             smallestShapeKey = key;
      //             this.copies.push(JSON.parse(JSON.stringify(shape)));

      //             // connected lines
      //             if (shape.pointTo && shape.pointTo.length > 0) {
      //                shape.pointTo.forEach((p) => {
      //                   const theLIne = this.lineMap.get(p);
      //                   if (theLIne) {
      //                      this.copies.push(
      //                         JSON.parse(JSON.stringify(theLIne)),
      //                      );
      //                   }
      //                });
      //             }
      //          }
      //       }
      //    }
      // });
      if (smallestShape && this.canvasShapes[smallestShapeKey]) {
         // config.currentActive = smallestShape;
         config.currentActive = this.canvasShapes[smallestShapeKey];
         switch (smallestShape.type) {
            case shapeTypes.image:
               const img = new Image();
               img.src = smallestShape.src;
               img.style.borderRadius = smallestShape.radius + "px";

               smallestShape.offsetX = mouseX - smallestShape.x;
               smallestShape.offsetY = mouseY - smallestShape.y;
               smallestShape.isActive = true;
               this.dragElement = {
                  src: img,
                  key: smallestShapeKey,
               };
               this.draw();
               this.drawImage();
               return;
            case shapeTypes.pencil:
               smallestShape.isActive = true;
               smallestShape.offsetX = smallestShape.minX - mouseX;
               smallestShape.offsetY = smallestShape.minY - mouseY;
               smallestShape.width = smallestShape.maxX - smallestShape.minX;
               smallestShape.height = smallestShape.maxY - smallestShape.minY;

               smallestShape.points.forEach((point) => {
                  point.offsetX = point.x - mouseX;
                  point.offsetY = point.y - mouseY;
               });
               this.dragElement = smallestShapeKey;
               break;
            case shapeTypes.figure:
               this.dragElement = smallestShapeKey;
               setDragging(smallestShape);

               this.rectMap.forEach((rect) => {
                  if (rect.containerId !== smallestShapeKey) return;
                  rect.offsetX = mouseX - rect.x;
                  rect.offsetY = mouseY - rect.y;
               });
               this.circleMap.forEach((circle) => {
                  if (circle.containerId !== smallestShapeKey) return;
                  circle.offsetX = mouseX - circle.x;
                  circle.offsetY = mouseY - circle.y;
               });
               this.lineMap.forEach((line) => {
                  if (line.containerId !== smallestShapeKey) return;
                  line.offsetX = line.minX - mouseX;
                  line.offsetY = line.minY - mouseY;
                  line.width = line.maxX - line.minX;
                  line.height = line.maxY - line.minY;
                  line.curvePoints.forEach((point) => {
                     point.offsetX = point.x - mouseX;
                     point.offsetY = point.y - mouseY;
                  });
               });
               this.textMap.forEach((text) => {
                  if (text.containerId !== smallestShapeKey) return;
                  text.offsetX = mouseX - text.x;
                  text.offsetY = mouseY - text.y;
               });
               this.imageMap.forEach((image) => {
                  if (image.containerId !== smallestShapeKey) return;
                  image.offsetX = mouseX - image.x;
                  image.offsetY = mouseY - image.y;
               });
               this.pencilMap.forEach((pencil) => {
                  if (pencil.containerId !== smallestShapeKey) return;
                  pencil.offsetX = mouseX - pencil.minX;
                  pencil.offsetY = mouseY - pencil.minY;
                  pencil.width = pencil.maxX - pencil.minX;
                  pencil.height = pencil.maxY - pencil.minY;
                  pencil.points.forEach((point) => {
                     point.offsetX = mouseX - point.x;
                     point.offsetY = mouseY - point.y;
                  });
               });
               break;
            case shapeTypes.line:
               smallestShape.isActive = true;
               smallestShape.curvePoints.forEach((e) => {
                  e.offsetX = mouseX - e.x;
                  e.offsetY = mouseY - e.y;
               });
               this.dragElement = smallestShapeKey;
               break;
            default:
               setDragging(smallestShape);
               this.dragElement = smallestShapeKey;
               break;
         }
      }

      //drag for line
      // let smallestLine = null;
      // const simpleLine = (l, key) => {
      //    const { curvePoints, lineType, minX, maxX, minY, maxY } = l;
      //    let inside = false;
      //    if (l.isActive) l.isActive = false;
      //    for (let i = 0; i < curvePoints.length - 1; i++) {
      //       let slope1 = findSlope(
      //          mouseY,
      //          curvePoints[i].y,
      //          mouseX,
      //          curvePoints[i].x,
      //       );
      //       let slope2 = findSlope(
      //          mouseY,
      //          curvePoints[i + 1].y,
      //          mouseX,
      //          curvePoints[i + 1].x,
      //       );
      //       if (!isFinite(slope1)) slope1 = Infinity;
      //       if (!isFinite(slope2)) slope2 = Infinity;

      //       if (Math.abs(slope1 - slope2) <= 0.3) {
      //          inside = true;
      //          break;
      //       }
      //    }
      //    if (
      //       inside &&
      //       mouseX >= minX - this.tolerance &&
      //       mouseX <= maxX + this.tolerance &&
      //       mouseY >= minY - this.tolerance &&
      //       mouseY <= maxY + this.tolerance
      //    ) {
      //       if (l.containerId) {
      //          const container = this.figureMap.get(l.containerId);
      //          if (
      //             !container.isActive &&
      //             (smallestLine === null ||
      //                smallestLine.l.maxX - smallestLine.l.minX > width)
      //          ) {
      //             smallestLine = { l, key };
      //          }
      //       } else {
      //          if (
      //             smallestLine === null ||
      //             smallestLine.l.maxX - smallestLine.l.minX > l.maxX - l.minX
      //          ) {
      //             smallestLine = { l, key };
      //          }
      //       }
      //    }
      // };
      // this.lineMap.forEach(simpleLine);
      // if (smallestLine && smallestLine.l && smallestLine.key) {
      //    config.currentActive = smallestLine.l;

      //    if (smallestLine.l.startTo && smallestLine.l.endTo) {
      //       smallestLine.l.isActive = true;
      //       this.draw();
      //       return;
      //    } else {
      //       this.copies.push(JSON.parse(JSON.stringify(smallestLine.l)));
      //       smallestLine.l.isActive = true;
      //       smallestLine.l.curvePoints.forEach((e) => {
      //          e.offsetX = mouseX - e.x;
      //          e.offsetY = mouseY - e.y;
      //       });
      //       if (smallestShape) smallestShape.isActive = false;
      //       this.dragElement = smallestLine.key;
      //    }
      // }

      // for massSelection
      if (!this.dragElement && !this.resizeElement && config.mode === "free") {
         this.massiveSelection.isDown = true;
         this.massiveSelection.startX = mouseX;
         this.massiveSelection.startY = mouseY;
      }

      this.onChange();
      this.draw();
      this.drawImage();
   }

   mouseDownForFif(e) {
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);
      let shouldDraw = false;
      for (const [key, value] of this.figureMap) {
         const { id, isActive, x, y, width, height } = value;
         const element = document.querySelector(`[data-containerId="${id}"]`);

         // Check if the click happened inside any of the elements
         if (this.massiveSelection.isSelected) return;
         if (element.contains(e.target)) {
            if (config.currentActive) config.currentActive.isActive = false;
            config.currentActive = value;
            value.isActive = true;
            shouldDraw = true;
         } else if (
            isActive &&
            mouseX >= x - this.tolerance &&
            mouseX <= x + width + this.tolerance &&
            mouseY >= y - this.tolerance &&
            mouseY <= y + height + this.tolerance
         ) {
            shouldDraw = true;
            value.isActive = true;
         } else value.isActive = false;
      }

      // Re-render the figures
      shouldDraw && this.draw();
   }

   updateCurvePoint(object, x, y, index) {
      // if (!object.curvePoints[index]) return;
      object.curvePoints[index] = { x, y };
   }

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
         Math.min(point.y, rect.y + rect.height),
      );
      return { x: closestX, y: closestY };
   }

   updateLinesPointTo(object) {
      if (object.pointTo?.length > 0) {
         let line = [];
         let arrowEndRect = [];
         let arrowStartRect = [];

         // get all the connected lines to the shape
         // object.pointTo.forEach((a) => {
         //    let l = this.lineMap.get(a);
         //    if (l) line.push(l);
         // });
         object.pointTo.forEach((p) => {
            let l = null;
            this.canvasShapes.forEach((c, i) => {
               if (c.id === p && c.type === shapeTypes.line) {
                  l = i;
               }
            });

            if (l !== null) {
               if (!this.canvasShapes[l]) return;
               line.push(this.canvasShapes[l]);
            }
         });

         // get all the arrows connected to shape
         if (line.length > 0) {
            // line.forEach((l) => {
            //    let start = null;
            //    let end = null;
            //    if (object.type === shapeTypes.rect) {
            //       start = this.rectMap.get(l.startTo);
            //       end = this.rectMap.get(l.endTo);
            //    } else if (object.type === shapeTypes.text) {
            //       start = this.textMap.get(l.startTo);
            //       end = this.textMap.get(l.endTo);
            //    } else if (object.type === shapeTypes.circle) {
            //       start = this.circleMap.get(l.startTo);
            //       end = this.circleMap.get(l.endTo);
            //    } else if (object.type === shapeTypes.circle) {
            //       start = this.imageMap.get(l.startTo);
            //       end = this.imageMap.get(l.endTo);
            //    } else if (object.type === shapeTypes.others) {
            //       start = this.otherShapes.get(l.startTo);
            //       end = this.otherShapes.get(l.endTo);
            //    } else if (object.type === shapeTypes.image) {
            //       start = this.imageMap.get(l.startTo);
            //       end = this.imageMap.get(l.endTo);
            //    }

            //    if (start && !arrowStartRect.includes(start)) {
            //       arrowStartRect.push(start);
            //    }
            //    if (end && !arrowEndRect.includes(end)) {
            //       arrowEndRect.push(end);
            //    }
            // });
            line.forEach((l) => {
               let start = null;
               let end = null;

               for (let i = 0; i < this.canvasShapes.length; i++) {
                  if (start && end) break;

                  if (
                     l.startTo === this.canvasShapes[i].id &&
                     this.canvasShapes[i].type !== shapeTypes.line
                  ) {
                     start = this.canvasShapes[i];
                  }
                  if (
                     l.endTo === this.canvasShapes[i].id &&
                     this.canvasShapes[i].type !== shapeTypes.line
                  ) {
                     end = this.canvasShapes[i];
                  }
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
               case shapeTypes.rect:
                  return this.rectMap.get(pos);
               case shapeTypes.text:
                  return this.textMap.get(pos);
               case shapeTypes.circle:
                  return this.circleMap.get(pos);
               case shapeTypes.image:
                  return this.imageMap.get(pos);
               case shapeTypes.others:
                  return this.otherShapes.get(pos);
               default:
                  break;
            }
         };
         if (arrowStartRect.length > 0) {
            arrowStartRect.forEach((ar) => {
               if (ar.id === object.id) {
                  line.forEach((l) => {
                     // if (whichMap(object.type, l.startTo) === object)
                     if (l.startTo === object.id) {
                        // const {
                        //    rect: r,
                        //    text: t,
                        //    sphere: s,
                        //    image: i,
                        //    otherShapes: o,
                        // } = this.getShape(l.endTo);

                        // let oshapes = [r, t, s, i, o];

                        // let foundShape = null;
                        // Loop through the array in reverse to get the last truthy shape
                        // for (let i = oshapes.length - 1; i >= 0; i--) {
                        //    if (oshapes[i]) {
                        //       foundShape = oshapes[i];
                        //       break; // Exit loop once the last truthy shape is found
                        //    }
                        // }

                        const found = this.getCanvasShape(l.endTo);
                        const { curvePoints } = l;

                        if (found) {
                           lineResizeWhenConnected({
                              line: l,
                              endShape: found,
                              startShape: object,
                              storEn: "start",
                           });
                        }

                        if (object.type === shapeTypes.circle) {
                           const { x, y } = this.getClosestPointOnSphere(
                              object,
                              {
                                 x: curvePoints[1].x,
                                 y: curvePoints[1].y,
                              },
                           );
                           this.updateCurvePoint(l, x, y, 0);
                        } else {
                           const { x, y } = this.getClosestPoints(object, {
                              x: curvePoints[1].x,
                              y: curvePoints[1].y,
                           });

                           this.updateCurvePoint(l, x, y, 0);
                        }
                     }
                  });
               }
            });
         }

         if (arrowEndRect.length > 0) {
            arrowEndRect.forEach((ar) => {
               if (ar.id === object.id) {
                  line.forEach((l) => {
                     // if (whichMap(object.type, l.endTo) === object)
                     if (l.endTo === object.id) {
                        // get the shape if connect to start
                        // const {
                        //    rect: r,
                        //    text: t,
                        //    sphere: s,
                        //    image: i,
                        //    otherShapes: o,
                        // } = this.getShape(l.startTo);

                        const found = this.getCanvasShape(l.startTo);
                        const { curvePoints } = l;

                        if (object.type == shapeTypes.circle) {
                           const { x, y } = this.getClosestPointOnSphere(
                              object,
                              {
                                 x: curvePoints[curvePoints.length - 2].x,
                                 y: curvePoints[curvePoints.length - 2].y,
                              },
                           );
                           this.updateCurvePoint(
                              l,
                              x,
                              y,
                              curvePoints.length - 1,
                           );
                        } else {
                           const { x, y } = this.getClosestPoints(object, {
                              x: curvePoints[curvePoints.length - 2].x,
                              y: curvePoints[curvePoints.length - 2].y,
                           });
                           this.updateCurvePoint(
                              l,
                              x,
                              y,
                              curvePoints.length - 1,
                           );
                        }

                        if (found) {
                           lineResizeWhenConnected({
                              line: l,
                              endShape: found,
                              startShape: object,
                              storEn: "end",
                           });
                        }

                        // other conected
                        // let oshapes = [r, t, s, i, o];
                        // let foundShape = null;
                        // Loop through the array in reverse to get the last truthy shape
                        // for (let i = oshapes.length - 1; i >= 0; i--) {
                        //    if (oshapes[i]) {
                        //       foundShape = oshapes[i];
                        //       break; // Exit loop once the last truthy shape is found
                        //    }
                        // }
                     }
                  });
               }
            });
         }
      }
   }

   getSvgPathFromStroke(stroke) {
      if (!stroke.length) return "";

      const d = stroke.reduce(
         (acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            return acc;
         },
         ["M", ...stroke[0], "Q"],
      );

      d.push("Z");
      return d.join(" ");
   }

   drawNewShape(shape, obj, x, y) {
      if (shape !== shapeTypes.pencil) {
         this.breakPointsCtx.clearRect(
            0,
            0,
            this.canvasbreakPoints.width,
            this.canvasbreakPoints.height,
         );
      }
      let rectPath = null;
      this.breakPointsCtx.save();
      const centerX = this.canvasbreakPoints.width / 2;
      const centerY = this.canvasbreakPoints.height / 2;

      this.breakPointsCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY,
      );

      this.breakPointsCtx.translate(centerX, centerY);
      this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      this.breakPointsCtx.translate(-centerX, -centerY);

      this.breakPointsCtx.beginPath();
      this.breakPointsCtx.strokeStyle = "grey";
      this.breakPointsCtx.lineWidth = 1;
      switch (shape) {
         case shapeTypes.rect:
            rectPath = drawRect(obj, this.breakPointsCtx);
            this.breakPointsCtx.stroke(rectPath);
            break;
         case shapeTypes.circle:
            this.breakPointsCtx.ellipse(
               this.newShapeParams.x,
               this.newShapeParams.y,
               this.newShapeParams.xRadius,
               this.newShapeParams.yRadius,
               0,
               0,
               Math.PI * 2,
               false,
            );
            break;
         case shapeTypes.pencil:
            const outlinePath = getStroke(
               this.newShapeParams.points,
               getStrokeOptions,
            );
            const stroke = this.getSvgPathFromStroke(outlinePath);
            const path = new Path2D(stroke);

            this.breakPointsCtx.fillStyle = "white";
            this.breakPointsCtx.fill(path);

            this.lastPoint = { x, y };
            break;
         case shapeTypes.line:
            if (obj.lineType === "elbow") {
               const first = obj.curvePoints[0] || { x, y };
               const last = { x, y };
               const mid = {
                  x: (first.x + last.x) / 2,
                  y: (first.y + last.y) / 2,
               };
               // Start from the first point
               this.breakPointsCtx.moveTo(first.x, first.y);
               // Draw the first arc: From first to mid horizontally
               this.breakPointsCtx.arcTo(
                  mid.x,
                  first.y,
                  mid.x,
                  mid.y,
                  obj.radius,
               );
               // Draw the second arc: From mid horizontally to mid vertically aligned with last
               this.breakPointsCtx.arcTo(
                  mid.x,
                  last.y,
                  last.x,
                  last.y,
                  obj.radius,
               );
               // Draw final line: From the end of the second arc to the last point
               this.breakPointsCtx.lineTo(last.x, last.y);
               if (obj.arrowLeft) {
                  mid.x == first.x
                     ? this.drawArrows(mid, first, 10)
                     : this.drawArrows(
                          { x: mid.x, y: first.y },
                          first,
                          10,
                          this.breakPointsCtx,
                       );
               }
               if (obj.arrowRight) {
                  mid.x == first.x
                     ? this.drawArrows(mid, last, 10)
                     : this.drawArrows(
                          { x: mid.x, y: last.y },
                          last,
                          10,
                          this.breakPointsCtx,
                       );
               }
            } else {
               // Start the path at the first point

               if (obj.curvePoints.length == 0) return;
               this.breakPointsCtx.moveTo(
                  obj.curvePoints[0].x,
                  obj.curvePoints[0].y,
               );

               // Draw the curve through all the points
               for (let i = 1; i < obj.curvePoints.length - 1; i++) {
                  const cp1 = obj.curvePoints[i];
                  const cp2 = obj.curvePoints[i + 1];

                  //   context.arcTo(cp1.x, cp1.y, cp2.x, cp2.y, 50);
                  // Calculate the weighted midpoint (e.g., 75% closer to cp2)
                  const t = 0.8; // Weighting factor, 0.5 for halfway, closer to 1 for closer to cp2
                  const midPointX = (1 - t) * cp1.x + t * cp2.x;
                  const midPointY = (1 - t) * cp1.y + t * cp2.y;

                  // Use cp1 as the control point and the adjusted midpoint as the end point
                  this.breakPointsCtx.quadraticCurveTo(
                     cp1.x,
                     cp1.y,
                     midPointX,
                     midPointY,
                  );
               }

               //    Handle the last segment, if tempPoint is provided
               const lastCp = obj.curvePoints[obj.curvePoints.length - 1];
               this.breakPointsCtx.quadraticCurveTo(lastCp.x, lastCp.y, x, y);
            }
            break;
         case shapeTypes.figure:
            rectPath = drawRect(obj, this.breakPointsCtx);
            this.breakPointsCtx.stroke(rectPath);
            break;
         case shapeTypes.others:
            drawSHapes(obj, this.breakPointsCtx);
            break;
         default:
            break;
      }

      this.breakPointsCtx.stroke();
      this.breakPointsCtx.closePath();
      this.breakPointsCtx.restore();
   }

   isIn(sx, sy, swidth, sheight, ox, oy, owidth, oheight) {
      return (
         sx > ox &&
         sx + swidth < ox + owidth &&
         sy > oy &&
         sy + sheight < oy + oheight
      );
   }

   resizeLineWhenConnected({ line, direction }) {
      const { startTo, endTo, curvePoints } = line;
      const { rect: srect } = this.getShape(startTo);
      const { rect: erect } = this.getShape(endTo);

      if (direction === "start") {
         if (curvePoints[0].y > curvePoints[curvePoints.length - 1].y) {
            let x, y;
            if (srect) {
               x: srect.x + srect.width / 2;
               y: srect.y;
            }
            line.curvePoints[1] = { x, y };
         }
      }
   }

   mouseMove(e) {
      if (e.altKey || e.ctrlKey) return;

      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

      if (this.isDrawing || this.newShapeParams) {
         this.isBuildingShape(mouseX, mouseY);
         this.drawNewShape(
            this.newShapeParams.type,
            this.newShapeParams,
            mouseX,
            mouseY,
         );
      }

      // massive is selected and selected is down
      if (this.massiveSelection.isSelectedDown) {
         this.massiveSelection.isSelectedMinX =
            mouseX + this.massiveSelection.offsetX;
         this.massiveSelection.isSelectedMinY =
            mouseY + this.massiveSelection.offsetY;

         this.rectMap.forEach((rect) => {
            if (rect.isActive) {
               const { offsetX, offsetY } = rect;
               rect.x = mouseX + offsetX;
               rect.y = mouseY + offsetY;
            }
         });

         this.circleMap.forEach((circle) => {
            if (circle.isActive) {
               const { offsetX, offsetY } = circle;
               circle.x = mouseX + offsetX;
               circle.y = mouseY + offsetY;
            }
         });

         this.textMap.forEach((text) => {
            if (text.isActive) {
               const { offsetX, offsetY } = text;
               text.x = mouseX + offsetX;
               text.y = mouseY + offsetY;
            }
         });

         this.lineMap.forEach((line) => {
            if (line.isActive) {
               line.curvePoints.forEach((p) => {
                  p.x = mouseX + p.offsetX;
                  p.y = mouseY + p.offsetY;
               });
            }
         });

         this.figureMap.forEach((fig) => {
            if (fig.isActive) {
               fig.x = mouseX + fig.offsetX;
               fig.y = mouseY + fig.offsetY;
            }
         });

         this.pencilMap.forEach((pencil) => {
            if (pencil.isActive) {
               pencil.minX = mouseX + pencil.offsetX;
               pencil.minY = mouseY + pencil.offsetY;
               pencil.maxY = pencil.minY + pencil.height;
               pencil.maxX = pencil.minX + pencil.width;

               pencil.points.forEach((point) => {
                  point.x = mouseX + point.offsetX;
                  point.y = mouseY + point.offsetY;
               });
            }
         });

         this.imageMap.forEach((image) => {
            if (image.isActive) {
               image.x = mouseX + image.offsetX;
               image.y = mouseY + image.offsetY;
            }
         });

         this.otherShapes.forEach((other) => {
            if (other.isActive) {
               other.x = mouseX - other.offsetX;
               other.y = mouseY - other.offsetY;
            }
         });

         this.massiveSelectionRect(
            this.massiveSelection.isSelectedMinX - this.tolerance,
            this.massiveSelection.isSelectedMinY - this.tolerance,
            this.massiveSelection.width + 2 * this.tolerance,
            this.massiveSelection.height + 2 * this.tolerance,
         );

         this.drawImage();
         this.draw();
         return;
      }

      // start massive selection
      if (this.massiveSelection.isDown) {
         const { startX, startY } = this.massiveSelection;
         let x, y, width, height;

         if (startX < mouseX) {
            x = startX;
            width = mouseX - startX;
         } else {
            x = mouseX;
            width = startX - mouseX;
         }

         if (startY < mouseY) {
            y = startY;
            height = mouseY - startY;
         } else {
            y = mouseY;
            height = startY - mouseY;
         }

         // Clear the entire canvas
         this.breakPointsCtx.clearRect(
            0,
            0,
            this.canvasbreakPoints.width,
            this.canvasbreakPoints.height,
         );

         this.breakPointsCtx.save();
         const centerX = this.canvasbreakPoints.width / 2;
         const centerY = this.canvasbreakPoints.height / 2;
         // Apply transformations
         this.breakPointsCtx.translate(
            -scrollBar.scrollPositionX,
            -scrollBar.scrollPositionY,
         );

         this.breakPointsCtx.translate(centerX, centerY);
         this.breakPointsCtx.scale(Scale.scale, Scale.scale);
         this.breakPointsCtx.translate(-centerX, -centerY);

         // Set fill style and draw the rectangle
         this.breakPointsCtx.fillStyle = "#00f7ff17";
         this.breakPointsCtx.beginPath(); // Begin a new path to avoid unwanted drawing
         this.breakPointsCtx.rect(x, y, width, height);
         this.breakPointsCtx.fill();
         this.breakPointsCtx.restore();

         this.rectMap.forEach((rect) => {
            if (
               this.isIn(
                  rect.x,
                  rect.y,
                  rect.width,
                  rect.height,
                  x,
                  y,
                  width,
                  height,
                  rect,
               )
            ) {
               rect.isActive = true;
            } else rect.isActive = false;
         });
         this.circleMap.forEach((circle) => {
            if (
               this.isIn(
                  circle.x - circle.xRadius,
                  circle.y - circle.yRadius,
                  2 * circle.xRadius,
                  2 * circle.yRadius,
                  x,
                  y,
                  width,
                  height,
                  circle,
               )
            ) {
               circle.isActive = true;
            } else circle.isActive = false;
         });
         this.lineMap.forEach((line) => {
            if (
               this.isIn(
                  line.minX,
                  line.minY,
                  line.maxX - line.minX,
                  line.maxY - line.minY,
                  x,
                  y,
                  width,
                  height,
                  line,
               )
            ) {
               line.isActive = true;
            } else line.isActive = false;
         });
         this.textMap.forEach((text) => {
            if (
               this.isIn(
                  text.x,
                  text.y,
                  text.width,
                  text.height,
                  x,
                  y,
                  width,
                  height,
                  text,
               )
            ) {
               text.isActive = true;
            } else text.isActive = false;
         });
         this.figureMap.forEach((fig) => {
            if (
               this.isIn(
                  fig.x,
                  fig.y,
                  fig.width,
                  fig.height,
                  x,
                  y,
                  width,
                  height,
                  fig,
               )
            ) {
               fig.isActive = true;
            } else fig.isActive = false;
         });
         this.otherShapes.forEach((other) => {
            if (
               this.isIn(
                  other.x - other.radius,
                  other.y - other.radius,
                  other.width,
                  other.height,
                  x,
                  y,
                  width,
                  height,
               )
            ) {
               other.isActive = true;
            } else {
               other.isActive = false;
            }
         });

         this.draw();
      }

      // if (!this.resizeElement && !this.dragElement) return;
      if (!this.resizeElement && !this.canvasShapes[this.dragElement]) return;

      const squareResize = (shape) => {
         const { x, y, width, height } = this.resizeElement;
         if (this.resizeElement.direction === "left-edge") {
            if (mouseX < x + width) {
               shape.x = mouseX;
               shape.width = x + width - mouseX;
            } else if (mouseX > x + width) {
               shape.x = x + width;
               shape.width = mouseX - (x + width);
            }
         } else if (this.resizeElement.direction === "right-edge") {
            if (mouseX > x) {
               shape.width = mouseX - x;
            } else if (mouseX < x) {
               shape.x = mouseX;
               shape.width = x - mouseX;
            }
         } else if (this.resizeElement.direction === "top-edge") {
            if (mouseY < y + height) {
               shape.y = mouseY;
               shape.height = y + height - mouseY;
            } else if (mouseY > y + height) {
               shape.y = y + height;
               shape.height = mouseY - y + height;
            }
         } else if (this.resizeElement.direction === "bottom-edge") {
            if (mouseY > y) {
               shape.height = mouseY - y;
            } else if (mouseY < y) {
               shape.y = mouseY;
               shape.height = y - mouseY;
            }
         } else {
            const direction = this.resizeElement.direction;

            switch (direction) {
               case "top-left":
                  shape.x = Math.min(mouseX, x + width);
                  shape.y = Math.min(mouseY, y + height);
                  shape.width = Math.abs(x + width - mouseX);
                  shape.height = Math.abs(y + height - mouseY);
                  break;

               case "top-right":
                  if (mouseX > x) {
                     shape.width = mouseX - x;
                  } else if (mouseX < x) {
                     shape.x = mouseX;
                     shape.width = x - mouseX;
                  }
                  if (mouseY < y + height) {
                     shape.y = mouseY;
                     shape.height = y + height - mouseY;
                  } else if (mouseY > height + y) {
                     shape.y = y + height;
                     shape.height = mouseY - shape.y;
                  }

                  break;

               case "bottom-left":
                  if (mouseX < x + width) {
                     shape.x = mouseX;
                     shape.width = x + width - mouseX;
                  } else if (mouseX > x + width) {
                     shape.x = x + width;
                     shape.width = mouseX - shape.x;
                  }

                  if (mouseY > y) {
                     shape.height = mouseY - y;
                  } else if (mouseY < y) {
                     shape.height = y - mouseY;
                     shape.y = mouseY;
                  }

                  break;

               case "bottom-right":
                  if (mouseX > x) shape.width = mouseX - shape.x;
                  else if (mouseX < x) {
                     shape.x = mouseX;
                     shape.width = x - mouseX;
                  }
                  if (mouseY > y) shape.height = mouseY - shape.y;
                  else if (mouseY < y) {
                     shape.y = mouseY;
                     shape.height = y - mouseY;
                  }

                  break;

               default:
                  break;
            }
         }
      };

      // Resizing
      const theResizeElement = this.canvasShapes[this.resizeElement?.index];

      // let rectResize = this.rectMap.get(this.resizeElement?.key);
      // let circleResize = this.circleMap.get(this.resizeElement?.key);
      // let textResize = this.textMap.get(this.resizeElement?.key);
      // let lineResize = this.lineMap.get(this.resizeElement?.key);
      // let imageResize = this.imageMap.get(this.resizeElement?.key);
      // let figResize = this.figureMap.get(this.resizeElement?.key);
      // let pencilResize = this.pencilMap.get(this.resizeElement?.key);
      // let otherResize = this.otherShapes.get(this.resizeElement?.key);

      if (theResizeElement) {
         switch (theResizeElement.type) {
            case shapeTypes.rect:
               squareResize(theResizeElement);
               this.updateLinesPointTo(theResizeElement);
               break;
            case shapeTypes.circle:
               if (this.resizeElement.direction === "horizontel") {
                  theResizeElement.isActive = true;
                  theResizeElement.xRadius = Math.abs(
                     mouseX - theResizeElement.x,
                  );
               } else if (this.resizeElement.direction === "vertical") {
                  theResizeElement.isActive = true;
                  theResizeElement.yRadius = Math.abs(
                     mouseY - theResizeElement.y,
                  );
               } else {
                  theResizeElement.isActive = true;
                  theResizeElement.xRadius = Math.abs(
                     mouseX - theResizeElement.x,
                  );
                  theResizeElement.yRadius = Math.abs(
                     mouseY - theResizeElement.y,
                  );
               }
               // this.updateLinesPointTo(theResizeElement);
               break;
            case shapeTypes.text:
               if (mouseX > theResizeElement.x && mouseY > theResizeElement.y) {
                  const { initialSize } = this.resizeElement;
                  theResizeElement.textSize =
                     Math.max(
                        12, // Minimum size to prevent text from becoming too small
                        (mouseX - theResizeElement.x) * 0.2 +
                           (mouseY - theResizeElement.y) * 0.3,
                     ) * 0.5;
               }

               this.updateLinesPointTo(theResizeElement);
               break;
            case shapeTypes.pencil:
               const { initialMaxX, initialMinX, initialMinY, initialMaxY } =
                  this.resizeElement;
               const originalWidth = initialMaxX - initialMinX;
               const originalHeight = initialMaxY - initialMinY;

               if (this.resizeElement.direction == "left-edge") {
                  // Determine new boundaries based on the mouse position
                  let newMinX = mouseX > initialMaxX ? initialMaxX : mouseX;
                  let newMaxX = mouseX > initialMaxX ? mouseX : initialMaxX;

                  // Calculate the original dimensions and new width
                  const newWidth = newMaxX - newMinX;

                  if (originalWidth === 0) {
                     return;
                  }

                  // Calculate the width scale factor
                  const widthScaleFactor = newWidth / originalWidth;

                  // Adjust the points based on the offsetX and width scale factor
                  theResizeElement.points.forEach((point) => {
                     point.x = newMinX + point.offsetX * widthScaleFactor;
                  });

                  // Update the resized shape
                  theResizeElement.minX = newMinX;
                  theResizeElement.maxX = newMaxX;
               } else if (this.resizeElement.direction == "right-edge") {
                  // Determine new boundaries based on the mouse position
                  let newMinX = mouseX > initialMinX ? initialMinX : mouseX;
                  let newMaxX = mouseX > initialMinX ? mouseX : initialMinX;

                  // Calculate the original dimensions and new width
                  const newWidth = newMaxX - newMinX;

                  if (originalWidth === 0) {
                     return;
                  }

                  // Calculate the width scale factor
                  const widthScaleFactor = newWidth / originalWidth;

                  // Adjust the points based on the offsetX and width scale factor
                  theResizeElement.points.forEach((point) => {
                     point.x = newMaxX + point.offsetX * widthScaleFactor;
                  });

                  // Update the resized shape
                  theResizeElement.minX = newMinX;
                  theResizeElement.maxX = newMaxX;
               } else if (this.resizeElement.direction == "top-edge") {
                  // Determine new boundaries based on the mouse position
                  let newMinY = mouseY > initialMaxY ? initialMaxY : mouseY;
                  let newMaxY = mouseY > initialMaxY ? mouseY : initialMaxY;

                  // Calculate the original dimensions and new height
                  const newHeight = newMaxY - newMinY;

                  if (originalHeight === 0) {
                     return;
                  }

                  // Calculate the height scale factor
                  const heightScaleFactor = newHeight / originalHeight;

                  // Adjust the points based on the offsetY and height scale factor
                  theResizeElement.points.forEach((point) => {
                     point.y = newMinY + point.offsetY * heightScaleFactor;
                  });

                  // Update the resized shape
                  theResizeElement.minY = newMinY;
                  theResizeElement.maxY = newMaxY;
               } else if (this.resizeElement.direction == "bottom-edge") {
                  // Determine new boundaries based on the mouse position
                  let newMinY = mouseY > initialMinY ? initialMinY : mouseY;
                  let newMaxY = mouseY > initialMinY ? mouseY : initialMinY;

                  // Calculate the original dimensions and new height
                  const newHeight = newMaxY - newMinY;

                  if (originalHeight === 0) {
                     return;
                  }

                  // Calculate the height scale factor
                  const heightScaleFactor = newHeight / originalHeight;

                  // Adjust the points based on the offsetY and height scale factor
                  theResizeElement.points.forEach((point) => {
                     point.y = newMaxY + point.offsetY * heightScaleFactor;
                  });

                  // Update the resized shape
                  theResizeElement.minY = newMinY;
                  theResizeElement.maxY = newMaxY;
               } else {
                  let newMinX, newMaxX, newMinY, newMaxY;
                  let newWidth,
                     newHeight,
                     heightScaleFactor,
                     widthScalingFactor;
                  switch (this.resizeElement.direction) {
                     case "top-left":
                        newMinX = Math.min(initialMaxX, mouseX);
                        newMinY = Math.min(initialMaxY, mouseY);
                        newMaxX = Math.max(initialMaxX, mouseX);
                        newMaxY = Math.max(initialMaxY, mouseY);

                        newWidth = newMaxX - newMinX;
                        newHeight = newMaxY - newMinY;

                        if (originalHeight === 0 && originalWidth === 0) {
                           return;
                        }
                        widthScalingFactor = newWidth / originalWidth;
                        heightScaleFactor = newHeight / originalHeight;
                        theResizeElement.points.forEach((point) => {
                           point.y =
                              newMinY + point.offsetY * heightScaleFactor;
                           point.x =
                              newMinX + point.offsetX * widthScalingFactor;
                        });
                        break;
                     case "top-right":
                        newMinX = Math.min(initialMinX, mouseX);
                        newMaxX = Math.max(initialMinX, mouseX);
                        newMinY = Math.min(initialMaxY, mouseY);
                        newMaxY = Math.max(initialMaxY, mouseY);

                        newWidth = newMaxX - newMinX;
                        newHeight = newMaxY - newMinY;

                        if (originalHeight === 0 && originalWidth === 0) {
                           return;
                        }
                        widthScalingFactor = newWidth / originalWidth;
                        heightScaleFactor = newHeight / originalHeight;
                        theResizeElement.points.forEach((point) => {
                           point.y =
                              newMinY + point.offsetY * heightScaleFactor;
                           point.x =
                              newMaxX + point.offsetX * widthScalingFactor;
                        });
                        break;
                     case "bottom-left":
                        newMinX = Math.min(initialMaxX, mouseX);
                        newMaxX = Math.max(initialMaxX, mouseX);
                        newMinY = Math.min(initialMinY, mouseY);
                        newMaxY = Math.max(initialMinY, mouseY);

                        newWidth = newMaxX - newMinX;
                        newHeight = newMaxY - newMinY;

                        if (originalHeight === 0 && originalWidth === 0) {
                           return;
                        }
                        widthScalingFactor = newWidth / originalWidth;
                        heightScaleFactor = newHeight / originalHeight;
                        theResizeElement.points.forEach((point) => {
                           point.y =
                              newMaxY + point.offsetY * heightScaleFactor;
                           point.x =
                              newMinX + point.offsetX * widthScalingFactor;
                        });
                        break;
                     case "bottom-right":
                        newMinX = Math.min(initialMinX, mouseX);
                        newMaxX = Math.max(initialMinX, mouseX);
                        newMinY = Math.min(initialMinY, mouseY);
                        newMaxY = Math.max(initialMinY, mouseY);

                        newWidth = newMaxX - newMinX;
                        newHeight = newMaxY - newMinY;

                        if (originalHeight === 0 && originalWidth === 0) {
                           return;
                        }
                        widthScalingFactor = newWidth / originalWidth;
                        heightScaleFactor = newHeight / originalHeight;
                        theResizeElement.points.forEach((point) => {
                           point.y =
                              newMaxY + point.offsetY * heightScaleFactor;
                           point.x =
                              newMaxX + point.offsetX * widthScalingFactor;
                        });
                        break;
                  }
                  // Update the resized shape
                  theResizeElement.minY = newMinY;
                  theResizeElement.maxY = newMaxY;
                  theResizeElement.maxX = newMaxX;
                  theResizeElement.minX = newMinX;
               }
               this.drawImage();
               break;
            case shapeTypes.line:
               lineResizeLogic({
                  mouseX,
                  mouseY,
                  line: theResizeElement,
                  direction: this.resizeElement.direction,
                  index: this.resizeElement.i,
               });
               this.lineConnectParams(mouseX, mouseY);
               break;
            default:
               break;
         }
      }

      // if (rectResize) {
      //    squareResize(rectResize);
      //    this.updateLinesPointTo(rectResize);
      // } else if (imageResize) {
      //    squareResize(imageResize);
      //    this.updateLinesPointTo(imageResize);
      //    const { x, y, width, height, isActive } = imageResize;
      //    this.breakPointsCtx.clearRect(
      //       0,
      //       0,
      //       this.canvasbreakPoints.width,
      //       this.canvasbreakPoints.height,
      //    );

      //    this.breakPointsCtx.save();
      //    this.breakPointsCtx.translate(
      //       -scrollBar.scrollPositionX,
      //       -scrollBar.scrollPositionY,
      //    );
      //    if (isActive) {
      //       this.dots(
      //          { x: x - this.tolerance, y: y - this.tolerance },
      //          { x: x + width + this.tolerance, y: y - this.tolerance },
      //          {
      //             x: x + width + this.tolerance,
      //             y: y + height + this.tolerance,
      //          },
      //          { x: x - this.tolerance, y: y + height + this.tolerance },
      //          { context: this.breakPointsCtx },
      //       );

      //       this.breakPointsCtx.strokeStyle = this.activeColor;
      //       this.breakPointsCtx.rect(
      //          x - this.tolerance,
      //          y - this.tolerance,
      //          width + 2 * this.tolerance,
      //          height + 2 * this.tolerance,
      //       );
      //       this.breakPointsCtx.stroke();
      //    }
      //    this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      //    this.breakPointsCtx.drawImage(
      //       this.resizeElement?.img,
      //       x,
      //       y,
      //       width,
      //       height,
      //    );
      //    this.breakPointsCtx.restore();
      // } else if (circleResize) {
      //    if (this.resizeElement.direction === "horizontel") {
      //       circleResize.isActive = true;
      //       circleResize.xRadius = Math.abs(mouseX - circleResize.x);
      //    } else if (this.resizeElement.direction === "vertical") {
      //       circleResize.isActive = true;
      //       circleResize.yRadius = Math.abs(mouseY - circleResize.y);
      //    } else {
      //       circleResize.isActive = true;
      //       circleResize.xRadius = Math.abs(mouseX - circleResize.x);
      //       circleResize.yRadius = Math.abs(mouseY - circleResize.y);
      //    }
      //    this.updateLinesPointTo(circleResize);
      // } else if (textResize) {
      //    if (mouseX > textResize.x && mouseY > textResize.y) {
      //       const { initialSize } = this.resizeElement;
      //       textResize.textSize =
      //          Math.max(
      //             12, // Minimum size to prevent text from becoming too small
      //             (mouseX - textResize.x) * 0.2 + (mouseY - textResize.y) * 0.3,
      //          ) * 0.5;
      //    }

      //    this.updateLinesPointTo(textResize);
      // } else if (lineResize) {
      //    lineResizeLogic({
      //       mouseX,
      //       mouseY,
      //       line: lineResize,
      //       direction: this.resizeElement.direction,
      //       index: this.resizeElement.index,
      //    });
      //    this.lineConnectParams(mouseX, mouseY);
      // } else if (figResize) {
      //    squareResize(figResize);
      //    for (const [_, rect] of this.rectMap) {
      //       if (
      //          rect.x > figResize.x &&
      //          rect.x + rect.width < figResize.x + figResize.width &&
      //          rect.y > figResize.y &&
      //          rect.t + rect.height < figResize.y + figResize.height
      //       ) {
      //          rect.containerId = this.resizeElement?.key;
      //          rect.isActive = true;
      //       } else {
      //          rect.containerId = null;
      //       }
      //    }
      // } else if (pencilResize) {
      //    const { initialMaxX, initialMinX, initialMinY, initialMaxY } =
      //       this.resizeElement;
      //    const originalWidth = initialMaxX - initialMinX;
      //    const originalHeight = initialMaxY - initialMinY;

      //    if (this.resizeElement.direction == "left-edge") {
      //       // Determine new boundaries based on the mouse position
      //       let newMinX = mouseX > initialMaxX ? initialMaxX : mouseX;
      //       let newMaxX = mouseX > initialMaxX ? mouseX : initialMaxX;

      //       // Calculate the original dimensions and new width
      //       const newWidth = newMaxX - newMinX;

      //       if (originalWidth === 0) {
      //          return;
      //       }

      //       // Calculate the width scale factor
      //       const widthScaleFactor = newWidth / originalWidth;

      //       // Adjust the points based on the offsetX and width scale factor
      //       pencilResize.points.forEach((point) => {
      //          point.x = newMinX + point.offsetX * widthScaleFactor;
      //       });

      //       // Update the resized shape
      //       pencilResize.minX = newMinX;
      //       pencilResize.maxX = newMaxX;
      //    } else if (this.resizeElement.direction == "right-edge") {
      //       // Determine new boundaries based on the mouse position
      //       let newMinX = mouseX > initialMinX ? initialMinX : mouseX;
      //       let newMaxX = mouseX > initialMinX ? mouseX : initialMinX;

      //       // Calculate the original dimensions and new width
      //       const newWidth = newMaxX - newMinX;

      //       if (originalWidth === 0) {
      //          return;
      //       }

      //       // Calculate the width scale factor
      //       const widthScaleFactor = newWidth / originalWidth;

      //       // Adjust the points based on the offsetX and width scale factor
      //       pencilResize.points.forEach((point) => {
      //          point.x = newMaxX + point.offsetX * widthScaleFactor;
      //       });

      //       // Update the resized shape
      //       pencilResize.minX = newMinX;
      //       pencilResize.maxX = newMaxX;
      //    } else if (this.resizeElement.direction == "top-edge") {
      //       // Determine new boundaries based on the mouse position
      //       let newMinY = mouseY > initialMaxY ? initialMaxY : mouseY;
      //       let newMaxY = mouseY > initialMaxY ? mouseY : initialMaxY;

      //       // Calculate the original dimensions and new height
      //       const newHeight = newMaxY - newMinY;

      //       if (originalHeight === 0) {
      //          return;
      //       }

      //       // Calculate the height scale factor
      //       const heightScaleFactor = newHeight / originalHeight;

      //       // Adjust the points based on the offsetY and height scale factor
      //       pencilResize.points.forEach((point) => {
      //          point.y = newMinY + point.offsetY * heightScaleFactor;
      //       });

      //       // Update the resized shape
      //       pencilResize.minY = newMinY;
      //       pencilResize.maxY = newMaxY;
      //    } else if (this.resizeElement.direction == "bottom-edge") {
      //       // Determine new boundaries based on the mouse position
      //       let newMinY = mouseY > initialMinY ? initialMinY : mouseY;
      //       let newMaxY = mouseY > initialMinY ? mouseY : initialMinY;

      //       // Calculate the original dimensions and new height
      //       const newHeight = newMaxY - newMinY;

      //       if (originalHeight === 0) {
      //          return;
      //       }

      //       // Calculate the height scale factor
      //       const heightScaleFactor = newHeight / originalHeight;

      //       // Adjust the points based on the offsetY and height scale factor
      //       pencilResize.points.forEach((point) => {
      //          point.y = newMaxY + point.offsetY * heightScaleFactor;
      //       });

      //       // Update the resized shape
      //       pencilResize.minY = newMinY;
      //       pencilResize.maxY = newMaxY;
      //    } else {
      //       let newMinX, newMaxX, newMinY, newMaxY;
      //       let newWidth, newHeight, heightScaleFactor, widthScalingFactor;
      //       switch (this.resizeElement.direction) {
      //          case "top-left":
      //             newMinX = Math.min(initialMaxX, mouseX);
      //             newMinY = Math.min(initialMaxY, mouseY);
      //             newMaxX = Math.max(initialMaxX, mouseX);
      //             newMaxY = Math.max(initialMaxY, mouseY);

      //             newWidth = newMaxX - newMinX;
      //             newHeight = newMaxY - newMinY;

      //             if (originalHeight === 0 && originalWidth === 0) {
      //                return;
      //             }
      //             widthScalingFactor = newWidth / originalWidth;
      //             heightScaleFactor = newHeight / originalHeight;
      //             pencilResize.points.forEach((point) => {
      //                point.y = newMinY + point.offsetY * heightScaleFactor;
      //                point.x = newMinX + point.offsetX * widthScalingFactor;
      //             });
      //             break;
      //          case "top-right":
      //             newMinX = Math.min(initialMinX, mouseX);
      //             newMaxX = Math.max(initialMinX, mouseX);
      //             newMinY = Math.min(initialMaxY, mouseY);
      //             newMaxY = Math.max(initialMaxY, mouseY);

      //             newWidth = newMaxX - newMinX;
      //             newHeight = newMaxY - newMinY;

      //             if (originalHeight === 0 && originalWidth === 0) {
      //                return;
      //             }
      //             widthScalingFactor = newWidth / originalWidth;
      //             heightScaleFactor = newHeight / originalHeight;
      //             pencilResize.points.forEach((point) => {
      //                point.y = newMinY + point.offsetY * heightScaleFactor;
      //                point.x = newMaxX + point.offsetX * widthScalingFactor;
      //             });
      //             break;
      //          case "bottom-left":
      //             newMinX = Math.min(initialMaxX, mouseX);
      //             newMaxX = Math.max(initialMaxX, mouseX);
      //             newMinY = Math.min(initialMinY, mouseY);
      //             newMaxY = Math.max(initialMinY, mouseY);

      //             newWidth = newMaxX - newMinX;
      //             newHeight = newMaxY - newMinY;

      //             if (originalHeight === 0 && originalWidth === 0) {
      //                return;
      //             }
      //             widthScalingFactor = newWidth / originalWidth;
      //             heightScaleFactor = newHeight / originalHeight;
      //             pencilResize.points.forEach((point) => {
      //                point.y = newMaxY + point.offsetY * heightScaleFactor;
      //                point.x = newMinX + point.offsetX * widthScalingFactor;
      //             });
      //             break;
      //          case "bottom-right":
      //             newMinX = Math.min(initialMinX, mouseX);
      //             newMaxX = Math.max(initialMinX, mouseX);
      //             newMinY = Math.min(initialMinY, mouseY);
      //             newMaxY = Math.max(initialMinY, mouseY);

      //             newWidth = newMaxX - newMinX;
      //             newHeight = newMaxY - newMinY;

      //             if (originalHeight === 0 && originalWidth === 0) {
      //                return;
      //             }
      //             widthScalingFactor = newWidth / originalWidth;
      //             heightScaleFactor = newHeight / originalHeight;
      //             pencilResize.points.forEach((point) => {
      //                point.y = newMaxY + point.offsetY * heightScaleFactor;
      //                point.x = newMaxX + point.offsetX * widthScalingFactor;
      //             });
      //             break;
      //       }
      //       // Update the resized shape
      //       pencilResize.minY = newMinY;
      //       pencilResize.maxY = newMaxY;
      //       pencilResize.maxX = newMaxX;
      //       pencilResize.minX = newMinX;
      //    }
      //    this.drawImage();
      // } else if (otherResize) {
      //    const { initailX } = this.resizeElement;
      //    otherResize.radius = Math.abs(otherResize.x - mouseX);
      //    otherResize.width = 2 * otherResize.radius;
      //    otherResize.height = 2 * otherResize.radius;
      //    this.updateLinesPointTo(otherResize);
      // }

      if (theResizeElement) {
         this.draw();
         return;
      }
      const thedragElement = this.canvasShapes[this.dragElement];

      if (thedragElement) {
         thedragElement.isActive = true;
         switch (thedragElement.type) {
            case shapeTypes.rect:
               thedragElement.x = mouseX - thedragElement.offsetX;
               thedragElement.y = mouseY - thedragElement.offsetY;

               this.showGuides(
                  thedragElement.x,
                  thedragElement.y,
                  thedragElement.width,
                  thedragElement.height,
                  this.dragElement,
                  thedragElement,
               );
               this.drawRenderCanvas(thedragElement.type, thedragElement);

               this.updateLinesPointTo(thedragElement);
               break;
            case shapeTypes.circle:
               thedragElement.x = mouseX - thedragElement.offsetX;
               thedragElement.y = mouseY - thedragElement.offsetY;
               this.showGuides(
                  thedragElement.x - thedragElement.xRadius,
                  thedragElement.y - thedragElement.yRadius,
                  2 * thedragElement.xRadius,
                  2 * thedragElement.xRadius,
                  this.dragElement,
                  thedragElement,
               );
               //  this.drawRenderCanvas(arc.type, arc);

               this.updateLinesPointTo(thedragElement);
               break;
            case shapeTypes.pencil:
               thedragElement.minX = mouseX + thedragElement.offsetX;
               thedragElement.minY = mouseY + thedragElement.offsetY;
               thedragElement.maxY =
                  thedragElement.minY + thedragElement.height;
               thedragElement.maxX = thedragElement.minX + thedragElement.width;

               thedragElement.points.forEach((point) => {
                  point.x = mouseX + point.offsetX;
                  point.y = mouseY + point.offsetY;
               });
               this.drawImage();
               this.showGuides(
                  thedragElement.minX,
                  thedragElement.minY,
                  thedragElement.maxX - thedragElement.minX,
                  thedragElement.maxY - thedragElement.minY,
                  this.dragElement,
                  thedragElement,
               );
               this.drawImage();
               return;
            case shapeTypes.line:
               thedragElement.curvePoints.forEach((ele) => {
                  const deltaX = mouseX - ele.offsetX;
                  const deltaY = mouseY - ele.offsetY;
                  this.showGuides(
                     thedragElement.curvePoints[0].x,
                     thedragElement.curvePoints[0].y,
                     thedragElement.maxX - thedragElement.minX,
                     thedragElement.maxY - thedragElement.minY,
                     this.dragElement,
                     thedragElement,
                  );
                  ele.x = deltaX;
                  ele.y = deltaY;
               });
               break;
            case shapeTypes.others:
               console.log(thedragElement.isActive);
               thedragElement.x = mouseX - thedragElement.offsetX;
               thedragElement.y = mouseY - thedragElement.offsetY;
               this.showGuides(
                  thedragElement.x - thedragElement.radius,
                  thedragElement.y - thedragElement.radius,
                  thedragElement.width,
                  thedragElement.height,
                  this.dragElement,
                  thedragElement,
               );
               this.updateLinesPointTo(thedragElement);
               break;
            default:
               break;
         }
      }

      // if (this.resizeElement?.key) {
      //    this.draw();
      //    return;
      // }

      // Dragging
      // let rect = this.rectMap.get(this.dragElement);
      // let arc = this.circleMap.get(this.dragElement);
      // let text = this.textMap.get(this.dragElement);
      // let line = this.lineMap.get(this.dragElement);
      // let image = this.imageMap.get(this.dragElement?.key);
      // let pencilDrag = this.pencilMap.get(this.dragElement);
      // let figDrag = this.figureMap.get(this.dragElement);
      // let otherDrag = this.otherShapes.get(this.dragElement);

      // if (rect) {
      //    rect.isActive = true;
      //    rect.x = mouseX - rect.offsetX;
      //    rect.y = mouseY - rect.offsetY;

      //    this.showGuides(
      //       rect.x,
      //       rect.y,
      //       rect.width,
      //       rect.height,
      //       this.dragElement,
      //       rect,
      //    );
      //    //  this.drawRenderCanvas(rect.type, rect);

      //    this.updateLinesPointTo(rect);
      // } else if (arc) {
      //    arc.isActive = true;
      //    arc.x = mouseX - arc.offsetX;
      //    arc.y = mouseY - arc.offsetY;
      //    this.showGuides(
      //       arc.x - arc.xRadius,
      //       arc.y - arc.yRadius,
      //       2 * arc.xRadius,
      //       2 * arc.xRadius,
      //       this.dragElement,
      //       arc,
      //    );
      //    //  this.drawRenderCanvas(arc.type, arc);

      //    this.updateLinesPointTo(arc);
      // } else if (text) {
      //    text.x = mouseX - text.offsetX;
      //    text.y = mouseY - text.offsetY;
      //    this.showGuides(
      //       text.x,
      //       text.y,
      //       text.width,
      //       text.height,
      //       this.dragElement,
      //       text,
      //    );

      //    //  this.drawRenderCanvas("text", text);
      //    this.updateLinesPointTo(text);
      // } else if (line) {
      //    line.curvePoints.forEach((ele) => {
      //       const deltaX = mouseX - ele.offsetX;
      //       const deltaY = mouseY - ele.offsetY;
      //       this.showGuides(
      //          line.curvePoints[0].x,
      //          line.curvePoints[0].y,
      //          line.maxX - line.minX,
      //          line.maxY - line.minY,
      //          this.dragElement,
      //          line,
      //       );
      //       ele.x = deltaX;
      //       ele.y = deltaY;
      //    });
      // } else if (image) {
      //    image.x = mouseX - image.offsetX;
      //    image.y = mouseY - image.offsetY;

      //    const { x, y, width, height, isActive } = image;
      //    this.breakPointsCtx.clearRect(
      //       0,
      //       0,
      //       this.canvasbreakPoints.width,
      //       this.canvasbreakPoints.height,
      //    );

      //    this.breakPointsCtx.save();
      //    this.breakPointsCtx.translate(
      //       -scrollBar.scrollPositionX,
      //       -scrollBar.scrollPositionY,
      //    );
      //    if (isActive) {
      //       this.dots(
      //          { x: x - this.tolerance, y: y - this.tolerance },
      //          { x: x + width + this.tolerance, y: y - this.tolerance },
      //          {
      //             x: x + width + this.tolerance,
      //             y: y + height + this.tolerance,
      //          },
      //          { x: x - this.tolerance, y: y + height + this.tolerance },
      //          { context: this.breakPointsCtx },
      //       );

      //       this.breakPointsCtx.strokeStyle = this.activeColor;
      //       this.breakPointsCtx.rect(
      //          x - this.tolerance,
      //          y - this.tolerance,
      //          width + 2 * this.tolerance,
      //          height + 2 * this.tolerance,
      //       );
      //       this.breakPointsCtx.stroke();
      //    }

      //    this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      //    this.breakPointsCtx.drawImage(
      //       this.dragElement?.src,
      //       x,
      //       y,
      //       width,
      //       height,
      //    );
      //    this.breakPointsCtx.restore();
      //    this.updateLinesPointTo(image);
      // } else if (pencilDrag) {
      // pencilDrag.minX = mouseX + pencilDrag.offsetX;
      // pencilDrag.minY = mouseY + pencilDrag.offsetY;
      // pencilDrag.maxY = pencilDrag.minY + pencilDrag.height;
      // pencilDrag.maxX = pencilDrag.minX + pencilDrag.width;

      // pencilDrag.points.forEach((point) => {
      //    point.x = mouseX + point.offsetX;
      //    point.y = mouseY + point.offsetY;
      // });
      // this.drawImage();
      // this.showGuides(
      //    pencilDrag.minX,
      //    pencilDrag.minY,
      //    pencilDrag.maxX - pencilDrag.minX,
      //    pencilDrag.maxY - pencilDrag.minY,
      //    this.dragElement,
      //    pencilDrag,
      // );
      // return;
      // } else if (figDrag) {
      //    figDrag.x = mouseX - figDrag.offsetX;
      //    figDrag.y = mouseY - figDrag.offsetY;

      //    this.rectMap.forEach((rect) => {
      //       if (rect.containerId === this.dragElement) {
      //          rect.x = mouseX - rect.offsetX;
      //          rect.y = mouseY - rect.offsetY;
      //          if (rect.pointTo.length > 0) {
      //             this.updateLinesPointTo(rect);
      //          }
      //       }
      //    });

      //    this.circleMap.forEach((circle) => {
      //       if (circle.containerId === this.dragElement) {
      //          circle.x = mouseX - circle.offsetX;
      //          circle.y = mouseY - circle.offsetY;
      //          if (circle.pointTo.length > 0) {
      //             this.updateLinesPointTo(circle);
      //          }
      //       }
      //    });

      //    this.lineMap.forEach((line) => {
      //       if (line.containerId === this.dragElement) {
      //          line.minX = mouseX + line.offsetX;
      //          line.minY = mouseY + line.offsetY;
      //          line.maxX = line.minX + line.width;
      //          line.maxY = line.minY + line.height;
      //          line.curvePoints.forEach((point) => {
      //             point.x = mouseX + point.offsetX;
      //             point.y = mouseY + point.offsetY;
      //          });
      //       }
      //    });

      //    this.textMap.forEach((text) => {
      //       if (text.containerId === this.dragElement) {
      //          text.x = mouseX - text.offsetX;
      //          text.y = mouseY - text.offsetY;
      //       }
      //    });

      //    this.imageMap.forEach((image) => {
      //       if (image.containerId === this.dragElement) {
      //          image.x = mouseX - image.offsetX;
      //          image.y = mouseY - image.offsetY;
      //       }
      //    });

      //    this.pencilMap.forEach((pencil) => {
      //       if (pencil.containerId !== this.dragElement) return;
      //       pencil.minX = mouseX - pencil.offsetX;
      //       pencil.minY = mouseY - pencil.offsetY;
      //       pencil.maxY = pencil.minX + pencil.width;
      //       pencil.maxY = pencil.minY + pencil.height;
      //       pencil.points.forEach((point) => {
      //          point.x = mouseX - point.offsetX;
      //          point.y = mouseY - point.offsetY;
      //       });
      //    });
      // } else if (otherDrag) {
      //    otherDrag.x = mouseX - otherDrag.offsetX;
      //    otherDrag.y = mouseY - otherDrag.offsetY;
      //    this.showGuides(
      //       otherDrag.x - otherDrag.radius,
      //       otherDrag.y - otherDrag.radius,
      //       otherDrag.width,
      //       otherDrag.height,
      //       this.dragElement,
      //       otherDrag,
      //    );
      //    this.updateLinesPointTo(otherDrag);
      // }
      this.draw();
      this.drawImage();
   }

   mouseUp(e) {
      if (config.mode == "handsFree" || e.altKey) return;

      // insert a shape
      this.insertNew();

      if (this.copies.length > 0) {
         Bin.insert({ type: redoType.revert, shapes: this.copies });
         this.copies = [];
      }

      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

      if (this.massiveSelection.isDown) {
         this.massiveSelection.isDown = false;
         this.massiveSelection.isSelectedMinX = Infinity;
         this.massiveSelection.isSelectedMinY = Infinity;
         this.massiveSelection.isSelectedMaxX = -Infinity;
         this.massiveSelection.isSelectedMaxY = -Infinity;
         const { startX, startY } = this.massiveSelection;

         let minX = Math.min(mouseX, startX);
         let maxX = Math.max(mouseX, startX);
         let minY = Math.min(mouseY, startY);
         let maxY = Math.max(mouseY, startY);

         this.rectMap.forEach((rect) => {
            const { x, height, y, width } = rect;
            if (
               this.isIn(
                  x,
                  y,
                  width,
                  height,
                  minX,
                  minY,
                  maxX - minX,
                  maxY - minY,
               )
            ) {
               if (!this.massiveSelection.isSelected) {
                  this.massiveSelection.isSelected = true;
               }
               this.adjustMassiveSelectionXandY(x, y, width, height);

               rect.isActive = true;
            }
         });

         this.circleMap.forEach((circle) => {
            const { x, y, xRadius, yRadius } = circle;
            if (
               this.isIn(
                  x - xRadius,
                  y - yRadius,
                  2 * xRadius,
                  2 * yRadius,
                  minX,
                  minY,
                  maxX - minX,
                  maxY,
                  minY,
               )
            ) {
               if (!this.massiveSelection.isSelected) {
                  this.massiveSelection.isSelected = true;
               }
               this.adjustMassiveSelectionXandY(
                  x - xRadius,
                  y - yRadius,
                  2 * xRadius,
                  2 * yRadius,
               );
               circle.isActive = true;
            }
         });

         this.textMap.forEach((text) => {
            if (
               this.isIn(
                  text.x,
                  text.y,
                  text.width,
                  text.height,
                  minX,
                  minY,
                  maxX - minX,
                  maxY - minY,
               )
            ) {
               if (!this.massiveSelection.isSelected) {
                  this.massiveSelection.isSelected = true;
               }
               this.adjustMassiveSelectionXandY(
                  text.x,
                  text.y,
                  text.width,
                  text.height,
               );
               text.isActive = true;
            }
         });

         this.lineMap.forEach((line) => {
            const { minX: x, minY: y, maxX: width, maxY: height } = line;
            if (
               this.isIn(
                  x,
                  y,
                  width - x,
                  height - y,
                  minX,
                  minY,
                  maxX - minX,
                  maxY - minY,
               )
            ) {
               if (!this.massiveSelection.isSelected) {
                  this.massiveSelection.isSelected = true;
               }
               this.adjustMassiveSelectionXandY(x, y, width - x, height - y);
               line.isActive = true;
            }
         });

         this.figureMap.forEach((fig) => {
            const { x, y, width, height } = fig;
            if (
               this.isIn(
                  x,
                  y,
                  width,
                  height,
                  minX,
                  minY,
                  maxX - minX,
                  maxY - minY,
               )
            ) {
               if (!this.massiveSelection.isSelected) {
                  this.massiveSelection.isSelected = true;
               }
               this.adjustMassiveSelectionXandY(x, y, width, height);
               fig.isActive = true;
            }
         });

         this.pencilMap.forEach((pencil) => {
            const { minX: x, maxX: width, minY: y, maxY: height } = pencil;
            if (
               this.isIn(
                  x,
                  y,
                  width - x,
                  height - y,
                  minX,
                  minY,
                  maxX - minX,
                  maxY - minY,
               )
            ) {
               if (!this.massiveSelection.isSelected) {
                  this.massiveSelection.isSelected = true;
               }
               this.adjustMassiveSelectionXandY(x, y, width - x, height - y);
               pencil.isActive = true;
            }
         });

         this.imageMap.forEach((image) => {
            const { x, y, width, height } = image;
            if (
               this.isIn(
                  x,
                  y,
                  width,
                  height,
                  minX,
                  minY,
                  maxX - minX,
                  maxY - minY,
               )
            ) {
               if (!this.massiveSelection.isSelected) {
                  this.massiveSelection.isSelected = true;
               }
               this.adjustMassiveSelectionXandY(x, y, width, height);
               image.isActive = true;
            }
         });

         this.otherShapes.forEach((other) => {
            const { x, y, width, height, radius } = other;
            if (
               this.isIn(
                  x - radius,
                  y - radius,
                  width,
                  height,
                  minX,
                  minY,
                  maxX - minX,
                  maxY - minY,
               )
            ) {
               if (!this.massiveSelection.isSelected) {
                  this.massiveSelection.isSelected = true;
               }
               this.adjustMassiveSelectionXandY(
                  x - radius,
                  y - radius,
                  width,
                  height,
               );
               other.isActive = true;
            }
         });

         // Only draw the selection rectangle if at least one rectangle is selected
         this.massiveSelectionRect(
            this.massiveSelection.isSelectedMinX - this.tolerance,
            this.massiveSelection.isSelectedMinY - this.tolerance,
            this.massiveSelection.isSelectedMaxX -
               this.massiveSelection.isSelectedMinX +
               2 * this.tolerance,
            this.massiveSelection.isSelectedMaxY -
               this.massiveSelection.isSelectedMinY +
               2 * this.tolerance,
         );
         this.draw();
         this.drawImage();
      }

      // variable to control mouse down for selected
      if (this.massiveSelection.isSelectedDown) {
         this.massiveSelection.isSelectedDown = false;
         this.massiveSelection.isDown = false;

         // massive is selected
         if (this.massiveSelection.isSelected) {
            this.reEvaluateMassiveSelection();
            return;
         }
      }

      // if (!this.resizeElement && !this.dragElement) return;
      const theDragElement = this.canvasShapes[this.dragElement];
      const theResizeElement = this.canvasShapes[this.resizeElement?.index];
      if (!theResizeElement && !theDragElement) return;
      this.breakPointsCtx.clearRect(
         0,
         0,
         this.canvasbreakPoints.width,
         this.canvasbreakPoints.height,
      );

      if (theResizeElement) {
         switch (theResizeElement.type) {
            case shapeTypes.rect:
               theResizeElement.isActive = true;
               theResizeElement.width = Math.max(theResizeElement.width, 20);
               theResizeElement.height = Math.max(theResizeElement.height, 20);

               // update line minMx
               theResizeElement.pointTo.forEach((p) => {
                  this.updateLineMinMax(p);
               });

               if (this.resizeElement?.key)
                  this.updateGuides(
                     this.resizeElement.key,
                     theResizeElement.x,
                     theResizeElement.y,
                     theResizeElement.x + theResizeElement.width,
                     theResizeElement.y + theResizeElement.height,
                  );
               break;
            case shapeTypes.pencil:
               theResizeElement.width =
                  theResizeElement.maxX - theResizeElement.minX;
               theResizeElement.height =
                  theResizeElement.maxY - theResizeElement.min;
               break;
            case shapeTypes.line:
               const key = theResizeElement.id;
               if (this.resizeElement.direction === "resizeStart") {
                  let keyUsed = false;
                  if (theResizeElement.startTo) {
                     let matchedConnection = null;

                     for (let i = 0; i < this.canvasShapes.length; i++) {
                        if (
                           this.canvasShapes[i].id ===
                              theResizeElement.startTo &&
                           this.canvasShapes[i].type !== shapeTypes.line
                        ) {
                           matchedConnection = i;
                           break;
                        }
                     }

                     if (matchedConnection != null) {
                        let theShape = this.canvasShapes[matchedConnection];

                        switch (theShape.type) {
                           case shapeTypes.rect:
                              if (
                                 theResizeElement.curvePoints[0].x <
                                    theShape.x ||
                                 theResizeElement.curvePoints[0].x >
                                    theShape.x + theShape.width ||
                                 theResizeElement.curvePoints[0].y <
                                    theShape.y ||
                                 theResizeElement.curvePoints[0].y >
                                    theShape.y + theShape.height
                              ) {
                                 theShape = theShape.pointTo.filter(
                                    (r) => r !== key,
                                 );
                                 theResizeElement.startTo = null;
                              }
                              break;
                           case shapeTypes.circle:
                              const distance = Math.sqrt(
                                 (theResizeElement.curvePoints[0].x -
                                    theShape.x) **
                                    2 +
                                    (theResizeElement.curvePoints[0].y -
                                       theShape.y) **
                                       2,
                              );
                              if (
                                 distance > theShape.xRadius ||
                                 distance > theShape.yRadius
                              ) {
                                 theShape.pointTo = theShape.pointTo.filter(
                                    (s) => s !== key,
                                 );
                                 theResizeElement.startTo = null;
                              }
                              break;
                           case shapeTypes.text:
                              if (
                                 theResizeElement.curvePoints[0].x <
                                    theShape.x ||
                                 theResizeElement.curvePoints[0].x >
                                    theShape.x + theShape.width ||
                                 theResizeElement.curvePoints[0].y <
                                    theShape.y ||
                                 theResizeElement.curvePoints[0].y >
                                    theShape.y + theShape.height
                              ) {
                                 theShape.pointTo = theShape.pointTo.filter(
                                    (r) => {
                                       return r !== key;
                                    },
                                 );
                                 theResizeElement.startTo = null;
                              }
                              break;
                           case shapeTypes.image:
                              if (
                                 theResizeElement.curvePoints[0].x <
                                    theShape.x ||
                                 theResizeElement.curvePoints[0].x >
                                    theShape.x + theShape.width ||
                                 theResizeElement.curvePoints[0].y <
                                    theShape.y ||
                                 theResizeElement.curvePoints[0].y >
                                    theShape.y + theShape.height
                              ) {
                                 theShape.pointTo = theShape.pointTo.filter(
                                    (p) => p !== key,
                                 );
                                 theResizeElement.startTo = null;
                              }
                              break;
                           case shapeTypes.others:
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
                                 theShape.pointTo = theShape.pointTo.filter(
                                    (p) => p !== key,
                                 );
                                 theResizeElement.startTo = null;
                              }
                              break;
                           default:
                              break;
                        }
                     }
                  }

                  this.canvasShapes.forEach((shape) => {
                     const { type, id } = shape;
                     if (keyUsed) return;
                     const cond = () => {
                        if (
                           shape.pointTo.includes(key) ||
                           theResizeElement.endTo === id
                        )
                           return;

                        shape.pointTo.push(key);
                        theResizeElement.startTo = id;
                        keyUsed = true;
                     };

                     switch (type) {
                        case shapeTypes.rect:
                           cond();
                           break;
                        case shapeTypes.circle:
                           const { xRadius, yRadius, x, y } = shape;
                           const distance = Math.sqrt(
                              (mouseX - x) ** 2 + (mouseY - y) ** 2,
                           );

                           if (
                              (Math.abs(distance - xRadius) <= this.tolerance ||
                                 Math.abs(distance - yRadius) <=
                                    this.tolerance) &&
                              !keyUsed
                           ) {
                              cond();
                           }
                           break;
                        case shapeTypes.text:
                           if (
                              theResizeElement.curvePoints[0].x >= shape.x &&
                              theResizeElement.curvePoints[0].x <=
                                 shape.x + shape.width &&
                              theResizeElement.curvePoints[0].y >= shape.y &&
                              theResizeElement.curvePoints[0].y <=
                                 shape.y + shape.height &&
                              !keyUsed
                           ) {
                              cond();
                           }
                           break;
                        case shapeTypes.imageMap:
                           if (
                              this.squareLineParams(shape, mouseX, mouseY) &&
                              !keyUsed
                           ) {
                              cond();
                           }
                           break;
                        case shapeTypes.others:
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
               } else if (this.resizeElement.direction === "resizeEnd") {
                  const length = theResizeElement.curvePoints.length - 1;
                  let keyUsed = false;

                  if (theResizeElement.endTo) {
                     let matchedConnection = null;

                     for (let i = 0; i < this.canvasShapes.length; i++) {
                        if (
                           this.canvasShapes[i].id === theResizeElement.endTo &&
                           this.canvasShapes[i].type !== shapeTypes.line
                        ) {
                           matchedConnection = i;
                           break;
                        }
                     }

                     const theShape = this.canvasShapes[matchedConnection];
                     if (matchedConnection !== null) {
                        const { type } = theShape;

                        switch (type) {
                           case shapeTypes.rect:
                              if (
                                 theResizeElement.curvePoints[length].x <
                                    theShape.x ||
                                 theResizeElement.curvePoints[length].x >
                                    theShape.x + theShape.width ||
                                 theResizeElement.curvePoints[length].y <
                                    theShape.y ||
                                 theResizeElement.curvePoints[length].y >
                                    theShape.y + theShape.height
                              ) {
                                 theShape.pointTo = theShape.pointTo.filter(
                                    (r) => {
                                       return r !== key;
                                    },
                                 );
                                 theResizeElement.endTo = null;
                              }
                              break;
                           case shapeTypes.text:
                              if (
                                 theResizeElement.curvePoints[length].x <
                                    theShape.x ||
                                 theResizeElement.curvePoints[length].x >
                                    theShape.x + theShape.width ||
                                 theResizeElement.curvePoints[length].y <
                                    theShape.y ||
                                 theResizeElement.curvePoints[length].y >
                                    theShape.y + theShape.height
                              ) {
                                 theShape.pointTo = theShape.pointTo.filter(
                                    (r) => {
                                       return r !== key;
                                    },
                                 );
                                 theResizeElement.endTo = null;
                              }
                              break;
                           case shapeTypes.circle:
                              const distance = Math.sqrt(
                                 (theResizeElement.curvePoints[length].x -
                                    theShape.x) **
                                    2 +
                                    (theResizeElement.curvePoints[length].y -
                                       theShape.y) **
                                       2,
                              );
                              if (
                                 distance > theShape.xRadius ||
                                 distance > theShape.yRadius
                              ) {
                                 theShape.pointTo = theShape.pointTo.filter(
                                    (s) => s !== key,
                                 );
                                 theResizeElement.endTo = null;
                              }
                              break;
                           case shapeTypes.image:
                              if (
                                 theResizeElement.curvePoints[length].x <
                                    theShape.x ||
                                 theResizeElement.curvePoints[length].x >
                                    theShape.x + theShape.width ||
                                 theResizeElement.curvePoints[length].y <
                                    theShape.y ||
                                 theResizeElement.curvePoints[length].y >
                                    theShape.y + theShape.height
                              ) {
                                 theShape.pointTo = theShape.pointTo.filter(
                                    (p) => p !== key,
                                 );
                                 theResizeElement.endTo = null;
                              }
                              break;
                           case shapeTypes.others:
                              if (
                                 mouseX < theShape.x - theShape.radius ||
                                 mouseX > theShape.x + theShape.radius ||
                                 mouseY < theShape.y - theShape.radius ||
                                 mouseY > theShape.y + theShape.radius
                              ) {
                                 otherShapes.pointTo =
                                    otherShapes.pointTo.filter(
                                       (p) => p !== key,
                                    );
                                 theResizeElement.endTo = null;
                              }
                              break;
                        }
                     }
                  }

                  this.canvasShapes.forEach((shape) => {
                     const { type, id } = shape;
                     if (keyUsed) return;
                     const cond = () => {
                        if (
                           (theResizeElement.startTo === id ||
                              shape.pointTo.includes(key)) &&
                           shape.type === shapeTypes.line
                        )
                           return;

                        shape.pointTo.push(key);
                        theResizeElement.endTo = id;
                        console.log("shape ", shape);
                        keyUsed = true;
                     };

                     switch (type) {
                        case shapeTypes.rect:
                           if (this.squareLineParams(shape, mouseX, mouseY))
                              cond();
                           break;
                        case shapeTypes.circle:
                           const { xRadius, yRadius, x, y, pointTo } = shape;
                           const distance = Math.sqrt(
                              (mouseX - x) ** 2 + (mouseY - y) ** 2,
                           );

                           if (
                              Math.abs(distance - xRadius) <= this.tolerance ||
                              Math.abs(distance - yRadius) <= this.tolerance
                           )
                              cond();
                           break;
                        case shapeTypes.text:
                           if (
                              theResizeElement.curvePoints[length].x >=
                                 shape.x &&
                              theResizeElement.curvePoints[length].x <=
                                 shape.x + shape.width &&
                              theResizeElement.curvePoints[length].y >=
                                 shape.y &&
                              theResizeElement.curvePoints[length].y <=
                                 shape.y + shape.height &&
                              !keyUsed
                           )
                              cond();
                           break;
                        case shapeTypes.image:
                           if (
                              this.squareLineParams(shape, mouseX, mouseY) &&
                              !keyUsed
                           )
                              cond();
                           break;
                        case shapeTypes.others:
                           const { radius } = o;
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
               this.updateLineMinMax(this.resizeElement.key);
               break;
            default:
               break;
         }
      }

      // const rect = this.rectMap.get(this.resizeElement?.key);
      // const line = this.lineMap.get(this.resizeElement?.key);
      // const sphere = this.circleMap.get(this.resizeElement?.key);
      // const imageResize = this.imageMap.get(this.resizeElement?.key);
      // const figResize = this.figureMap.get(this.resizeElement?.key);
      // const pencilResize = this.pencilMap.get(this.resizeElement?.key);
      // const otherShapeResize = this.otherShapes.get(this.resizeElement?.key);
      // if (rect) {
      //    rect.isActive = true;
      //    rect.width = Math.max(rect.width, 20);
      //    rect.height = Math.max(rect.height, 20);

      //    // update line minMx
      //    rect.pointTo.forEach((p) => {
      //       this.updateLineMinMax(p);
      //    });

      //    if (this.resizeElement?.key)
      //       this.updateGuides(
      //          this.resizeElement.key,
      //          rect.x,
      //          rect.y,
      //          rect.x + rect.width,
      //          rect.y + rect.height,
      //       );
      // } else if (imageResize) {
      //    imageResize.width = Math.max(imageResize.width, 20);
      //    imageResize.height = Math.max(imageResize.height, 20);
      //    imageResize.isActive = true;
      //    this.breakPointsCtx.clearRect(
      //       0,
      //       0,
      //       this.canvasbreakPoints.width,
      //       this.canvasbreakPoints.height,
      //    );

      //    this.updateGuides(
      //       this.resizeElement?.key,
      //       imageResize.x,
      //       imageResize.y,
      //       imageResize.x + imageResize.width,
      //       imageResize.y + imageResize.height,
      //    );

      //    this.drawImage();
      //    this.resizeElement = null;
      //    return;
      // } else if (line) {
      //    const key = this.resizeElement.key;
      //    if (this.resizeElement.direction === "resizeStart") {
      //       let keyUsed = false;
      //       if (line.startTo) {
      //          const { rect, sphere, text, image, otherShapes } = this.getShape(
      //             line.startTo,
      //          );

      //          if (rect && rect.pointTo.length > 0) {
      //             if (
      //                line.curvePoints[0].x < rect.x ||
      //                line.curvePoints[0].x > rect.x + rect.width ||
      //                line.curvePoints[0].y < rect.y ||
      //                line.curvePoints[0].y > rect.y + rect.height
      //             ) {
      //                rect.pointTo = rect.pointTo.filter((r) => r !== key);
      //                line.startTo = null;
      //             }
      //          }

      //          if (sphere && sphere.pointTo.length > 0) {
      //             const distance = Math.sqrt(
      //                (line.curvePoints[0].x - sphere.x) ** 2 +
      //                   (line.curvePoints[0].y - sphere.y) ** 2,
      //             );
      //             if (distance > sphere.xRadius || distance > sphere.yRadius) {
      //                sphere.pointTo = sphere.pointTo.filter((s) => s !== key);
      //                line.startTo = null;
      //             }
      //          }

      //          if (text && text.pointTo.length > 0) {
      //             if (
      //                line.curvePoints[0].x < text.x ||
      //                line.curvePoints[0].x > text.x + text.width ||
      //                line.curvePoints[0].y < text.y ||
      //                line.curvePoints[0].y > text.y + text.height
      //             ) {
      //                text.pointTo = text.pointTo.filter((r) => {
      //                   return r !== key;
      //                });
      //                line.startTo = null;
      //             }
      //          }

      //          if (image && image.length > 0) {
      //             if (
      //                line.curvePoints[0].x < image.x ||
      //                line.curvePoints[0].x > image.x + image.width ||
      //                line.curvePoints[0].y < image.y ||
      //                line.curvePoints[0].y > image.y + image.height
      //             ) {
      //                image.pointTo = image.pointTo.filter((p) => p !== key);
      //                line.startTo = null;
      //             }
      //          }

      //          if (otherShapes && otherShapes.pointTo.length > 0) {
      //             if (
      //                line.curvePoints[0].x <
      //                   otherShapes.x - otherShapes.radius ||
      //                line.curvePoints[0].x >
      //                   otherShapes.x + otherShapes.radius ||
      //                line.curvePoints[0].y <
      //                   otherShapes.y - otherShapes.radius ||
      //                line.curvePoints[0].y > otherShapes.y + otherShapes.radius
      //             ) {
      //                otherShapes.pointTo = otherShapes.pointTo.filter(
      //                   (p) => p !== key,
      //                );
      //                line.startTo = null;
      //             }
      //          }
      //       }

      //       this.rectMap.forEach((rect, rectKey) => {
      //          if (this.squareLineParams(rect, mouseX, mouseY) && !keyUsed) {
      //             if (rect.pointTo.includes(key) || line.endTo === rectKey) {
      //                return;
      //             }
      //             rect.pointTo.push(key);
      //             line.startTo = rectKey;
      //             keyUsed = true;
      //          }
      //       });

      //       this.circleMap.forEach((circle, circleKey) => {
      //          const { xRadius, yRadius, x, y } = circle;
      //          const distance = Math.sqrt(
      //             (mouseX - x) ** 2 + (mouseY - y) ** 2,
      //          );

      //          if (
      //             (Math.abs(distance - xRadius) <= this.tolerance ||
      //                Math.abs(distance - yRadius) <= this.tolerance) &&
      //             !keyUsed
      //          ) {
      //             if (
      //                circle.pointTo.includes(key) ||
      //                circleKey === line.endTo
      //             ) {
      //                return;
      //             }
      //             circle.pointTo.push(key);
      //             line.startTo = circleKey;
      //             keyUsed = true;
      //          }
      //       });

      //       this.textMap.forEach((text, textKey) => {
      //          if (
      //             line.curvePoints[0].x >= text.x &&
      //             line.curvePoints[0].x <= text.x + text.width &&
      //             line.curvePoints[0].y >= text.y &&
      //             line.curvePoints[0].y <= text.y + text.height &&
      //             !keyUsed
      //          ) {
      //             if (text.pointTo.includes(key) || textKey === line.endTo)
      //                return;
      //             text.pointTo.push(key);
      //             line.startTo = textKey;
      //             keyUsed = true;
      //          }
      //       });

      //       this.imageMap.forEach((image, imageKey) => {
      //          if (this.squareLineParams(image, mouseX, mouseY) && !keyUsed) {
      //             if (image.pointTo.includes(key) || line.endTo === imageKey) {
      //                return;
      //             }
      //             image.pointTo.push(key);
      //             line.startTo = imageKey;
      //             keyUsed = true;
      //          }
      //       });

      //       this.otherShapes.forEach((o, okey) => {
      //          const { radius, x, y } = o;
      //          if (
      //             mouseX > x - radius &&
      //             mouseX < x + radius &&
      //             mouseY > y - radius &&
      //             mouseY < y + radius &&
      //             !keyUsed
      //          ) {
      //             if (o.pointTo.includes(key) || line.endTo === okey) return;
      //             o.pointTo.push(key);
      //             line.startTo = okey;
      //             keyUsed = true;
      //          }
      //       });

      //       keyUsed = false;
      //    } else if (this.resizeElement.direction === "resizeEnd") {
      //       const length = line.curvePoints.length - 1;
      //       let keyUsed = false;

      //       if (line.endTo) {
      //          const { rect, sphere, text, image, otherShapes } = this.getShape(
      //             line.endTo,
      //          );
      //          if (rect && rect.pointTo.length > 0) {
      //             if (
      //                line.curvePoints[length].x < rect.x ||
      //                line.curvePoints[length].x > rect.x + rect.width ||
      //                line.curvePoints[length].y < rect.y ||
      //                line.curvePoints[length].y > rect.y + rect.height
      //             ) {
      //                rect.pointTo = rect.pointTo.filter((r) => {
      //                   return r !== key;
      //                });
      //                line.endTo = null;
      //             }
      //          }

      //          if (sphere && sphere.pointTo.length > 0) {
      //             const distance = Math.sqrt(
      //                (line.curvePoints[length].x - sphere.x) ** 2 +
      //                   (line.curvePoints[length].y - sphere.y) ** 2,
      //             );
      //             if (distance > sphere.xRadius || distance > sphere.yRadius) {
      //                sphere.pointTo = sphere.pointTo.filter((s) => s !== key);
      //                line.endTo = null;
      //             }
      //          }

      //          if (text && text.pointTo.length > 0) {
      //             if (
      //                line.curvePoints[length].x < text.x ||
      //                line.curvePoints[length].x > text.x + text.width ||
      //                line.curvePoints[length].y < text.y ||
      //                line.curvePoints[length].y > text.y + text.height
      //             ) {
      //                text.pointTo = text.pointTo.filter((r) => {
      //                   return r !== key;
      //                });
      //                line.endTo = null;
      //             }
      //          }

      //          if (image && image.pointTo.length > 0) {
      //             if (
      //                line.curvePoints[length].x < image.x ||
      //                line.curvePoints[length].x > image.x + image.width ||
      //                line.curvePoints[length].y < image.y ||
      //                line.curvePoints[length].y > image.y + image.height
      //             ) {
      //                image.pointTo = image.pointTo.filter((p) => p !== key);
      //                line.endTo = null;
      //             }
      //          }

      //          if (otherShapes && otherShapes.pointTo.length > 0) {
      //             if (
      //                mouseX < otherShapes.x - otherShapes.radius ||
      //                mouseX > otherShapes.x + otherShapes.radius ||
      //                mouseY < otherShapes.y - otherShapes.radius ||
      //                mouseY > otherShapes.y + otherShapes.radius
      //             ) {
      //                otherShapes.pointTo = otherShapes.pointTo.filter(
      //                   (p) => p !== key,
      //                );
      //                line.endTo = null;
      //             }
      //          }
      //       }

      //       this.rectMap.forEach((rect, rectKey) => {
      //          const { pointTo } = rect;
      //          if (this.squareLineParams(rect, mouseX, mouseY) && !keyUsed) {
      //             if (line.startTo === rectKey || pointTo.includes(key)) return;
      //             pointTo.push(key);
      //             line.endTo = rectKey;
      //             keyUsed = true;
      //          }
      //       });

      //       this.circleMap.forEach((circle, circleKey) => {
      //          const { xRadius, yRadius, x, y, pointTo } = circle;
      //          const distance = Math.sqrt(
      //             (mouseX - x) ** 2 + (mouseY - y) ** 2,
      //          );

      //          if (
      //             (Math.abs(distance - xRadius) <= this.tolerance ||
      //                Math.abs(distance - yRadius) <= this.tolerance) &&
      //             !keyUsed
      //          ) {
      //             if (pointTo.includes(key) || circleKey === line.startTo)
      //                return;
      //             pointTo.push(key);
      //             line.endTo = circleKey;
      //             keyUsed = true;
      //          }
      //       });

      //       this.textMap.forEach((text, textKey) => {
      //          if (
      //             line.curvePoints[length].x >= text.x &&
      //             line.curvePoints[length].x <= text.x + text.width &&
      //             line.curvePoints[length].y >= text.y &&
      //             line.curvePoints[length].y <= text.y + text.height &&
      //             !keyUsed
      //          ) {
      //             if (text.pointTo.includes(key) || textKey === line.startTo)
      //                return;
      //             text.pointTo.push(key);
      //             line.endTo = textKey;
      //             keyUsed = true;
      //          }
      //       });

      //       this.imageMap.forEach((img, imgKey) => {
      //          if (this.squareLineParams(img, mouseX, mouseY) && !keyUsed) {
      //             if (line.startTo === imgKey || img.pointTo.includes(key))
      //                return;
      //             img.pointTo.push(key);
      //             line.endTo = imgKey;
      //             keyUsed = false;
      //          }
      //       });

      //       this.otherShapes.forEach((o, okey) => {
      //          const { x, y, radius } = o;
      //          if (
      //             mouseX > x - radius &&
      //             mouseX < x + radius &&
      //             mouseY > y - radius &&
      //             mouseY < y + radius &&
      //             !keyUsed
      //          ) {
      //             if (o.pointTo.includes(key) || line.startTo === okey) return;

      //             o.pointTo.push(key);
      //             line.endTo = okey;
      //             keyUsed = false;
      //          }
      //       });

      //       keyUsed = false;
      //    }

      //    line.isActive = true;
      //    this.updateLineMinMax(this.resizeElement.key);
      // } else if (sphere) {
      //    sphere.xRadius = Math.max(sphere.xRadius, 15);
      //    sphere.yRadius = Math.max(sphere.yRadius, 15);

      //    sphere.isActive = true;
      //    if (this.resizeElement?.key) {
      //       this.updateGuides(
      //          this.resizeElement.key,
      //          sphere.x - sphere.xRadius,
      //          sphere.y - sphere.yRadius,
      //          sphere.x + sphere.xRadius,
      //          sphere.y + sphere.yRadius,
      //       );
      //    }
      // } else if (figResize) {
      //    figResize.width = Math.max(figResize.width, 20);
      //    figResize.height = Math.max(figResize.height, 20);

      //    const { x, y, width, height } = figResize;
      //    this.getShapesInsideFigure(figResize, this.resizeElement?.key);

      //    this.updateGuides(figResize.id, x, y, x + width, y + height);
      // } else if (pencilResize) {
      //    pencilResize.width = pencilResize.maxX - pencilResize.minX;
      //    pencilResize.height = pencilResize.maxY - pencilResize.min;
      // } else if (otherShapeResize) {
      //    this.updateGuides(
      //       this.resizeElement?.key,
      //       otherShapeResize.x - otherShapeResize.radius,
      //       otherShapeResize.y - otherShapeResize.radius,
      //       otherShapeResize.x + otherShapeResize.radius,
      //       otherShapeResize.y + otherShapeResize.radius,
      //    );
      // }

      if (this.resizeElement) {
         this.draw();
         this.drawImage();
         this.resizeElement = null;
         return;
      }

      // const rectDrag = this.rectMap.get(this.dragElement);
      // const arcDrag = this.circleMap.get(this.dragElement);
      // const lineDrag = this.lineMap.get(this.dragElement);
      // const textDrag = this.textMap.get(this.dragElement);
      // const image = this.imageMap.get(this.dragElement?.key);
      // const figDrag = this.figureMap.get(this.dragElement);
      // const otherShapeDrag = this.otherShapes.get(this.dragElement);
      // const pencilDrag = this.pencilMap.get(this.dragElement);

      if (theDragElement) {
         switch (theDragElement.type) {
            case shapeTypes.rect:
               this.updateGuides(
                  this.dragElement,
                  theDragElement.x,
                  theDragElement.y,
                  theDragElement.x + theDragElement.width,
                  theDragElement.y + theDragElement.height,
               );

               if (theDragElement.pointTo?.length > 0) {
                  theDragElement.pointTo.forEach((l) => {
                     this.updateLineMinMax(l);
                  });
               }
               this.checkShapeIfInContainer(
                  theDragElement.x,
                  theDragElement.y,
                  theDragElement.width,
                  theDragElement.height,
                  theDragElement,
               );
               break;
            case shapeTypes.circle:
               // this.updateGuides(
               //    this.dragElement,
               //    arcDrag.x - arcDrag.xRadius,
               //    arcDrag.y - arcDrag.yRadius,
               //    arcDrag.x + arcDrag.xRadius,
               //    arcDrag.y + arcDrag.yRadius,
               // );
               theDragElement.width = 2 * theDragElement.xRadius;
               theDragElement.height = 2 * theDragElement.yRadius;
               if (theDragElement.pointTo?.length > 0) {
                  // theDragElement.pointTo.forEach((l) => {
                  //    this.updateLineMinMax(l);
                  // });
               }
               // this.checkShapeIfInContainer(
               //    theDragElement.x - theDragElement.xRadius,
               //    theDragElement.y - theDragElement.yRadius,
               //    2 * theDragElement.xRadius,
               //    2 * theDragElement.yRadius,
               //    theDragElement,
               // );
               break;
            case shapeTypes.line:
               // this.updateLineMinMax(this.dragElement);
               theDragElement.isActive = true;
               theDragElement.width = theDragElement.maxX - theDragElement.minX;
               theDragElement.height =
                  theDragElement.maxY - theDragElement.minY;
               this.checkShapeIfInContainer(
                  theDragElement.minX,
                  theDragElement.minY,
                  theDragElement.maxX - theDragElement.minX,
                  theDragElement.maxY - theDragElement.minY,
                  theDragElement,
               );
               break;
            case shapeTypes.others:
               this.updateGuides(
                  this.dragElement,
                  theDragElement.x - theDragElement.radius,
                  theDragElement.y - theDragElement.radius,
                  theDragElement.x + theDragElement.radius,
                  theDragElement.y + theDragElement.radius,
               );
               break;
            default:
               break;
         }
      }

      // if (rectDrag) {
      //    this.updateGuides(
      //       this.dragElement,
      //       rectDrag.x,
      //       rectDrag.y,
      //       rectDrag.x + rectDrag.width,
      //       rectDrag.y + rectDrag.height,
      //    );

      //    if (rectDrag.pointTo?.length > 0) {
      //       rectDrag.pointTo.forEach((l) => {
      //          this.updateLineMinMax(l);
      //       });
      //    }
      //    this.checkShapeIfInContainer(
      //       rectDrag.x,
      //       rectDrag.y,
      //       rectDrag.width,
      //       rectDrag.height,
      //       rectDrag,
      //    );
      // } else if (arcDrag) {
      // this.updateGuides(
      //    this.dragElement,
      //    arcDrag.x - arcDrag.xRadius,
      //    arcDrag.y - arcDrag.yRadius,
      //    arcDrag.x + arcDrag.xRadius,
      //    arcDrag.y + arcDrag.yRadius,
      // );
      // arcDrag.width = 2 * arcDrag.xRadius;
      // arcDrag.height = 2 * arcDrag.yRadius;
      // if (arcDrag.pointTo?.length > 0) {
      //    arcDrag.pointTo.forEach((l) => {
      //       this.updateLineMinMax(l);
      //    });
      // }
      // this.checkShapeIfInContainer(
      //    arcDrag.x - arcDrag.xRadius,
      //    arcDrag.y - arcDrag.yRadius,
      //    2 * arcDrag.xRadius,
      //    2 * arcDrag.yRadius,
      //    arcDrag,
      // );
      // } else if (lineDrag) {
      //    this.updateLineMinMax(this.dragElement);
      //    lineDrag.isActive = true;
      //    lineDrag.width = lineDrag.maxX - lineDrag.minX;
      //    lineDrag.height = lineDrag.maxY - lineDrag.minY;
      //    this.checkShapeIfInContainer(
      //       lineDrag.minX,
      //       lineDrag.minY,
      //       lineDrag.maxX - lineDrag.minX,
      //       lineDrag.maxY - lineDrag.minY,
      //       lineDrag,
      //    );
      // } else if (textDrag) {
      //    this.checkShapeIfInContainer(
      //       textDrag.x,
      //       textDrag.y,
      //       textDrag.width,
      //       textDrag.height,
      //       textDrag,
      //    );
      // } else if (image) {
      //    this.updateGuides(
      //       this.dragElement.key,
      //       image.x,
      //       image.y,
      //       image.x + image.width,
      //       image.y + image.height,
      //    );
      //    this.dragElement = null;
      //    this.breakPointsCtx.clearRect(
      //       0,
      //       0,
      //       this.canvasbreakPoints.width,
      //       this.canvasbreakPoints.height,
      //    );
      //    this.checkShapeIfInContainer(
      //       image.x,
      //       image.y,
      //       image.width,
      //       image.height,
      //       image,
      //    );
      //    this.drawImage();
      //    if (image.pointTo.length > 0) this.draw();
      //    return;
      // } else if (figDrag) {
      //    const { x, id, y, width, height } = figDrag;
      //    this.getShapesInsideFigure(figDrag, this.dragElement);
      //    this.updateGuides(id, x, y, x + width, y + height);
      // } else if (otherShapeDrag) {
      //    this.updateGuides(
      //       this.dragElement,
      //       otherShapeDrag.x - otherShapeDrag.radius,
      //       otherShapeDrag.y - otherShapeDrag.radius,
      //       otherShapeDrag.x + otherShapeDrag.radius,
      //       otherShapeDrag.y + otherShapeDrag.radius,
      //    );
      // } else if (pencilDrag) {
      //    pencilDrag.width = pencilDrag.maxX - pencilDrag.minX;
      //    pencilDrag.height = pencilDrag.maxY - pencilDrag.minY;
      // }

      this.resizeElement = null;
      this.dragElement = null;
      this.draw();
   }

   checkShapeIfInContainer(x, y, width, height, obj) {
      for (const [key, fig] of this.figureMap) {
         if (
            x > fig.x &&
            x + width < fig.x + fig.width &&
            y > fig.y &&
            y + height < fig.y + fig.height
         ) {
            obj.containerId = key;
            break;
         } else {
            obj.containerId = null;
         }
      }
   }

   getShapesInsideFigure(figObj, key) {
      const { x, y, width, height } = figObj;

      const checkIfIn = (sx, sy, swidth, sheight, obj) => {
         if (this.isIn(sx, sy, swidth, sheight, x, y, width, height)) {
            obj.containerId = key;
         } else obj.containerId = null;
      };

      this.rectMap.forEach((rect) => {
         checkIfIn(rect.x, rect.y, rect.width, rect.height, rect);
      });

      this.circleMap.forEach((circle) => {
         checkIfIn(
            circle.x - circle.xRadius,
            circle.y - circle.yRadius,
            2 * circle.xRadius,
            2 * circle.yRadius,
            circle,
         );
      });

      this.lineMap.forEach((line) => {
         const { minX, minY, maxX, maxY } = line;
         checkIfIn(minX, minY, maxX - minX, maxY - minY, line);
      });

      this.textMap.forEach((text) => {
         checkIfIn(text.x, text.y, text.width, text.height, text);
      });

      this.imageMap.forEach((image) => {
         checkIfIn(image.x, image.y, image.width, image.height, image);
      });

      this.pencilMap.forEach((pencil) => {
         checkIfIn(
            pencil.minX,
            pencil.minY,
            pencil.maxX - pencil.minX,
            pencil.maxY - pencil.minY,
            pencil,
         );
      });
   }

   adjustMassiveSelectionXandY(x, y, width, height) {
      if (x + width > this.massiveSelection.isSelectedMaxX) {
         this.massiveSelection.isSelectedMaxX = x + width;
      }
      if (x < this.massiveSelection.isSelectedMinX) {
         this.massiveSelection.isSelectedMinX = x;
      }
      if (y < this.massiveSelection.isSelectedMinY) {
         this.massiveSelection.isSelectedMinY = y;
      }
      if (y + height > this.massiveSelection.isSelectedMaxY) {
         this.massiveSelection.isSelectedMaxY = y + height;
      }
   }

   reEvaluateMassiveSelection() {
      this.massiveSelection.isDown = false;
      this.massiveSelection.isSelectedMinX = Infinity;
      this.massiveSelection.isSelectedMinY = Infinity;
      this.massiveSelection.isSelectedMaxX = -Infinity;
      this.massiveSelection.isSelectedMaxY = -Infinity;

      this.rectMap.forEach((rect, key) => {
         if (rect.isActive) {
            const { x, y, width, height } = rect;
            this.adjustMassiveSelectionXandY(x, y, width, height);
            this.updateGuides(key, x, y, x + width, y + height);
         }
      });

      this.circleMap.forEach((circle, key) => {
         const { x, y, xRadius, yRadius, isActive } = circle;
         if (isActive) {
            this.adjustMassiveSelectionXandY(
               x - xRadius,
               y - yRadius,
               2 * xRadius,
               2 * yRadius,
            );
            this.updateGuides(
               key,
               x - xRadius,
               y - yRadius,
               x + xRadius,
               y + yRadius,
            );
         }
      });

      this.textMap.forEach((text) => {
         if (text.isActive) {
            this.adjustMassiveSelectionXandY(
               text.x,
               text.y,
               text.width,
               text.height,
            );
         }
      });

      this.lineMap.forEach((line, key) => {
         this.updateLineMinMax(key);
         const { minX: x, minY: y, maxX: width, maxY: height } = line;
         if (line.isActive) {
            this.adjustMassiveSelectionXandY(x, y, width - x, height - y);
         }
      });

      this.figureMap.forEach((fig, key) => {
         const { isActive, x, y, width, height } = fig;
         if (isActive) {
            this.adjustMassiveSelectionXandY(x, y, width, height);
         }
         this.updateGuides(key, x, y, x + width, y + width);
      });

      this.pencilMap.forEach((pencil) => {
         if (pencil.isActive) {
            this.adjustMassiveSelectionXandY(
               pencil.minX,
               pencil.minY,
               pencil.width,
               pencil.height,
            );
         }
      });

      this.imageMap.forEach((image, key) => {
         if (image.isActive) {
            const { x, y, width, height } = image;
            this.adjustMassiveSelectionXandY(x, y, width, height);
            this.updateGuides(key, x, y, x + width, y + height);
         }
      });

      this.otherShapes.forEach((other, key) => {
         if (other.isActive) {
            const { x, y, width, height, radius } = other;
            this.adjustMassiveSelectionXandY(
               x - radius,
               y - radius,
               width,
               height,
            );
         }
      });

      this.massiveSelectionRect(
         this.massiveSelection.isSelectedMinX - this.tolerance,
         this.massiveSelection.isSelectedMinY - this.tolerance,
         this.massiveSelection.isSelectedMaxX -
            this.massiveSelection.isSelectedMinX +
            2 * this.tolerance,
         this.massiveSelection.isSelectedMaxY -
            this.massiveSelection.isSelectedMinY +
            2 * this.tolerance,
      );

      this.draw();
   }

   massiveSelectionRect(x, y, width, height) {
      this.breakPointsCtx.clearRect(
         0,
         0,
         this.canvasbreakPoints.width,
         this.canvasbreakPoints.height,
      );

      this.breakPointsCtx.save();
      const centerX = this.canvasbreakPoints.width / 2;
      const centerY = this.canvasbreakPoints.height / 2;
      this.breakPointsCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY,
      );

      this.breakPointsCtx.translate(centerX, centerY);
      this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      this.breakPointsCtx.translate(-centerX, -centerY);

      this.dots(
         { x: x, y: y },
         { x: x + width, y: y },
         { x: x + width, y: y + height },
         { x: x, y: y + height },
         { context: this.breakPointsCtx },
      );

      this.breakPointsCtx.beginPath();
      this.breakPointsCtx.fillStyle = "#00f7ff17";
      this.breakPointsCtx.strokeStyle = this.activeColor;
      this.breakPointsCtx.rect(x, y, width, height);
      this.breakPointsCtx.stroke();
      this.breakPointsCtx.fill();
      this.breakPointsCtx.closePath();
      this.breakPointsCtx.restore();
   }

   renderImageMove(object) {
      const { x, y, width, height, src, isActive } = object;
      this.breakPointsCtx.clearRect(
         0,
         0,
         this.canvasbreakPoints.width,
         this.canvasbreakPoints.height,
      );

      this.breakPointsCtx.save();
      this.breakPointsCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY,
      );
      if (isActive) {
         this.dots(
            { x: x - this.tolerance, y: y - this.tolerance },
            { x: x + this.tolerance, y: y - this.tolerance },
            { x: x + width + this.tolerance, y: y + height + this.tolerance },
            { x: x - this.tolerance, y: y + height + this.tolerance },
            { context: this.breakPointsCtx },
         );
         this.breakPointsCtx.rect(
            x - this.tolerance,
            y - this.tolerance,
            width + 2 * this.tolerance,
            height + 2 * this.tolerance,
         );
      }
      this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      this.breakPointsCtx.drawImage(src, x, y, width, height);
      this.breakPointsCtx.restore();
   }

   insertNewAsset(e, setMode, setCurrentActive, currentActive, handler) {
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);
      let isDrawing = false;
      if (config.mode === "rect") {
         const newRect = new Rect(mouseX, mouseY, 100, 100, [], 15, true);
         this.rectMap.set(newRect.id, newRect);
         // change modes
         setMode("free");
         config.mode = "free";

         // add breakpoint
         this.breakPoints.set(newRect.id, {
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
         const newSphere = new Circle(mouseX, mouseY, 50, 50, [], 15, true);

         this.circleMap.set(newSphere.id, newSphere);

         // change modes
         setMode("free");
         config.mode = "free";

         // add breakpoint
         this.breakPoints.set(newSphere.id, {
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
            true,
         );
         this.lineMap.set(newArr.id, newArr);
         config.mode = "free";
         setMode(config.mode);
         config.currentActive = newArr;

         this.draw();
      } else if (config.mode === "figure") {
         const newFigure = new Figure(
            mouseX - scrollBar.scrollPositionX,
            mouseY - scrollBar.scrollPositionY,
            "Figure",
            100,
            100,
         );
         newFigure.isActive = false;
         this.figureMap.set(newFigure.id, newFigure);
         this.draw();

         // set breakpoints
         this.breakPoints.set(newFigure.id, {
            minX: newFigure.x,
            minY: newFigure.y,
            maxX: newFigure.x + newFigure.width,
            maxY: newFigure.y + newFigure.height,
         });

         config.mode = "free";
         setMode(config.mode);
         config.currentActive = newFigure;
      }

      if (config.mode === "handsFree") return;

      if (config.currentActive !== currentActive) {
         setCurrentActive(config.currentActive);
      }
   }

   insertImage(imageFile) {
      const id = Date.now();
      this.imageMap.set(id, imageFile);
      this.breakPoints.set(id, {
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
         window.innerHeight,
      );
      this.renderCanvasCtx.save();
      this.renderCanvasCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY,
      );
      this.renderCanvasCtx.scale(Scale.scale, Scale.scale);
      const drawDotsAndRect = (
         x,
         y,
         width,
         height,
         tolerance,
         isActive,
         activeColor,
      ) => {
         if (isActive) {
            // Draw dots
            this.dots(
               { x: x - tolerance, y: y - tolerance },
               { x: x + width + tolerance, y: y - tolerance },
               { x: x + width + tolerance, y: y + height + tolerance },
               { x: x - tolerance, y: y + height + tolerance },
               { context: this.renderCanvasCtx },
            );

            // Draw active rectangle
            this.renderCanvasCtx.beginPath();
            this.renderCanvasCtx.strokeStyle = activeColor;
            this.renderCanvasCtx.rect(
               x - tolerance,
               y - tolerance,
               width + 2 * tolerance,
               height + 2 * tolerance,
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
               this.activeColor,
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
               radius,
            );
            this.renderCanvasCtx.arcTo(
               x + width,
               y + height,
               x,
               y + height,
               radius,
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
               this.activeColor,
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
               2 * Math.PI,
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
               this.activeColor,
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
                  currentY + textMetrics.actualBoundingBoxAscent,
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
                  object.radius,
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
                        lastPoint.y - 5,
                     );
                     this.context.stroke();
                     this.context.closePath();

                     // Draw the second side of the arrowhead
                     this.context.beginPath();
                     this.context.moveTo(lastPoint.x, lastPoint.y);
                     this.context.lineTo(
                        lastPoint.x - headlen,
                        lastPoint.y + 5,
                     );
                  } else {
                     // Draw the first side of the arrowhead
                     this.context.moveTo(lastPoint.x, lastPoint.y);
                     this.context.lineTo(
                        lastPoint.x + headlen,
                        lastPoint.y - 5,
                     );
                     this.context.stroke();
                     this.context.closePath();

                     // Draw the second side of the arrowhead
                     this.context.beginPath();
                     this.context.moveTo(lastPoint.x, lastPoint.y);
                     this.context.lineTo(
                        lastPoint.x + headlen,
                        lastPoint.y + 5,
                     );
                  }
               } else if (firstPoint.y < lastPoint.y) {
                  // Draw the first side of the arrowhead
                  this.context.moveTo(lastPoint.x, lastPoint.y);
                  this.context.lineTo(
                     lastPoint.x + headlen * 0.5,
                     lastPoint.y - headlen,
                  );
                  this.context.stroke();
                  this.context.closePath();

                  // Draw the second side of the arrowhead
                  this.context.beginPath();
                  this.context.moveTo(lastPoint.x, lastPoint.y);
                  this.context.lineTo(
                     lastPoint.x - headlen * 0.5,
                     lastPoint.y - headlen,
                  );
               } else if (firstPoint.y > lastPoint.y) {
                  // Draw the first side of the arrowhead
                  this.context.moveTo(lastPoint.x, lastPoint.y);
                  this.context.lineTo(
                     lastPoint.x + headlen * 0.5,
                     lastPoint.y + headlen,
                  );
                  this.context.stroke();
                  this.context.closePath();

                  // Draw the second side of the arrowhead
                  this.context.beginPath();
                  this.context.moveTo(lastPoint.x, lastPoint.y);
                  this.context.lineTo(
                     lastPoint.x - headlen * 0.5,
                     lastPoint.y + headlen,
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
                     midPointY,
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
         this.canvasbreakPoints.width,
         this.canvasbreakPoints.height,
      );

      this.breakPointsCtx.save();
      const centerX = this.canvasbreakPoints.width / 2;
      const centerY = this.canvasbreakPoints.height / 2;

      this.breakPointsCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY,
      );

      this.breakPointsCtx.translate(centerX, centerY);
      this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      this.breakPointsCtx.translate(-centerX, -centerY);

      this.breakPointsCtx.lineWidth = 0.8;
      this.breakPointsCtx.strokeStyle = "red";

      // Variable to track if a guide is drawn
      let guideDrawn = false;
      this.breakPointsCtx.beginPath();

      for (let [pointKey, point] of this.breakPoints) {
         if (key !== pointKey) {
            if (Math.abs(point.minX - x) <= this.tolerance) {
               if (object.type === "polygon") {
                  object.x = point.minX + object.radius;
               } else {
                  object.x =
                     object.type == "sphere"
                        ? point.minX + object.xRadius
                        : point.minX;
               }

               this.breakPointsCtx.moveTo(point.minX, y);
               this.breakPointsCtx.lineTo(point.minX, point.minY);
               guideDrawn = true;
            } else if (Math.abs(point.maxX - x) <= this.tolerance) {
               if (object.type === "polygon") {
                  object.x = point.maxX + object.radius;
               } else {
                  object.x =
                     object.type === "sphere"
                        ? point.maxX + object.xRadius
                        : point.maxX;
               }

               this.breakPointsCtx.moveTo(point.maxX, y);
               this.breakPointsCtx.lineTo(point.maxX, point.minY);
               guideDrawn = true;
            } else if (Math.abs(point.minY - y) <= this.tolerance) {
               if (object.type === "polygon") {
                  object.y = point.minY + object.radius;
               } else {
                  object.y =
                     object.type === "sphere"
                        ? point.minY + object.yRadius
                        : point.minY;
               }
               this.breakPointsCtx.moveTo(point.minX, point.minY);
               this.breakPointsCtx.lineTo(x, point.minY);
               guideDrawn = true;
            } else if (Math.abs(point.maxY - y) <= this.tolerance) {
               if (object.type === "polygon") {
                  object.y = point.maxY + object.radius;
               } else {
                  object.y =
                     object.type === "sphere"
                        ? point.maxY + object.yRadius
                        : point.maxY;
               }

               this.breakPointsCtx.moveTo(point.minX, point.maxY);
               this.breakPointsCtx.lineTo(x, point.maxY);
               guideDrawn = true;
            } else if (Math.abs(point.minX - (x + width)) <= this.tolerance) {
               if (object.type === "polygon") {
                  object.x = point.minX - width / 2;
               } else {
                  object.x =
                     object.type === "sphere"
                        ? point.minX - width / 2
                        : point.minX - width;
               }
               this.breakPointsCtx.moveTo(point.minX, y);
               this.breakPointsCtx.lineTo(point.minX, point.minY);
               guideDrawn = true;
            } else if (Math.abs(point.maxX - (x + width)) <= this.tolerance) {
               object.x =
                  object.type === "sphere" || object.type === "polygon"
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
                  object.type === "sphere" || object.type === "polygon"
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
      const adjust = this.breakPoints.get(key);
      if (!adjust) return;
      adjust.minX = x;
      adjust.minY = y;
      adjust.maxX = width;
      adjust.maxY = height;
   }

   getCanvasShape(id) {
      let shapeFound = null;
      for (let i = 0; i < this.canvasShapes.length; i++) {
         if (
            id === this.canvasShapes[i].id &&
            this.canvasShapes[i].type !== shapeTypes.line
         ) {
            shapeFound = this.canvasShapes[i];
            break;
         }
      }
      return shapeFound;
      I;
   }

   getShape(key) {
      const rect = this.rectMap.get(key);
      const sphere = this.circleMap.get(key);
      const text = this.textMap.get(key);
      const image = this.imageMap.get(key);
      const line = this.lineMap.get(key);
      const otherShapes = this.otherShapes.get(key);
      const pencil = this.pencilMap.get(key);
      return { rect, sphere, text, image, line, otherShapes, pencil };
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

   lineConnectParams(mouseX, mouseY) {
      const {
         breakPointsCtx,
         canvasbreakPoints,
         tolerance,
         rectMap,
         circleMap,
         textMap,
         imageMap,
         otherShapes,
      } = this;

      breakPointsCtx.clearRect(
         0,
         0,
         canvasbreakPoints.width,
         canvasbreakPoints.height,
      );
      breakPointsCtx.save();

      // Center and scale transformations
      const centerX = canvasbreakPoints.width / 2;
      const centerY = canvasbreakPoints.height / 2;
      breakPointsCtx.translate(
         -scrollBar.scrollPositionX,
         -scrollBar.scrollPositionY,
      );
      breakPointsCtx.translate(centerX, centerY);
      breakPointsCtx.scale(Scale.scale, Scale.scale);
      breakPointsCtx.translate(-centerX, -centerY);

      // Define styles and path
      breakPointsCtx.lineWidth = 1.3;
      breakPointsCtx.strokeStyle = "grey";
      const path = new Path2D();

      // Function to draw a rounded rectangle
      const drawRoundedRect = ({ x, y, width, height }) => {
         const padding = this.tolerance;
         path.moveTo(x - padding + 5, y - padding);
         path.arcTo(
            x + width + padding,
            y - padding,
            x + width + padding,
            y - padding + 5,
            5,
         );
         path.arcTo(
            x + width + padding,
            y + height + padding,
            x + width + padding - 5,
            y + height + padding,
            5,
         );
         path.arcTo(
            x - padding,
            y + height + padding,
            x - padding,
            y + height + padding - 5,
            5,
         );
         path.arcTo(x - padding, y - padding, x - padding + 5, y - padding, 5);
         path.closePath();
      };

      // Check and draw rectangles
      rectMap.forEach((rect) => {
         if (this.squareLineParams(rect, mouseX, mouseY)) {
            drawRoundedRect(rect);
         }
      });

      // Check and draw circles
      circleMap.forEach((circle) => {
         const { x, y, xRadius, yRadius } = circle;
         const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
         if (
            Math.abs(distance - xRadius) <= 2 * tolerance &&
            Math.abs(distance - yRadius) <= 2 * tolerance
         ) {
            path.ellipse(
               x,
               y,
               xRadius + tolerance,
               yRadius + tolerance,
               0,
               0,
               Math.PI * 2,
               false,
            );
         }
      });

      // Check and draw text rectangles
      textMap.forEach((text) => {
         const { x, y, width, height } = text;
         if (
            (mouseX >= x &&
               mouseX <= x + width &&
               mouseY >= y &&
               mouseY <= y + tolerance) ||
            (mouseX >= x + width - tolerance &&
               mouseX <= x + width &&
               mouseY >= y &&
               mouseY <= y + height) ||
            (mouseX >= x &&
               mouseX <= x + tolerance &&
               mouseY >= y &&
               mouseY <= y + height) ||
            (mouseX >= x &&
               mouseX <= x + width &&
               mouseY >= y + height - tolerance &&
               mouseY <= y + height)
         ) {
            drawRoundedRect(text);
         }
      });

      // Check and draw images
      imageMap.forEach((image) => {
         if (this.squareLineParams(image, mouseX, mouseY)) {
            drawRoundedRect(image);
         }
      });

      // other shapes
      otherShapes.forEach((sh) => {
         const { radius, x, y } = sh;
         if (
            mouseX > x - radius &&
            mouseX < x + radius &&
            mouseY > y - radius &&
            mouseY < y + radius
         ) {
            drawRoundedRect({
               x: x - radius,
               y: y - radius,
               width: 2 * radius,
               height: 2 * radius,
            });
         }
      });

      // Draw or clear the path
      if (path) {
         breakPointsCtx.stroke(path);
      } else {
         breakPointsCtx.clearRect(
            0,
            0,
            canvasbreakPoints.width,
            canvasbreakPoints.height,
         );
      }

      breakPointsCtx.restore();
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
            Scale.scale = Math.round(Scale.scale * 10) / 10;
            setScale(Scale.scale);
         } else {
            if (e.deltaY > 0) {
               scrollBar.scrollPositionY += 40; // Adjust this value as needed
            } else {
               scrollBar.scrollPositionY -= 40; // Adjust this value as needed
            }
         }
         this.draw();
         this.drawImage();

         if (this.massiveSelection.isSelected) {
            this.massiveSelectionRect(
               this.massiveSelection.isSelectedMinX - this.tolerance,
               this.massiveSelection.isSelectedMinY - this.tolerance,
               this.massiveSelection.isSelectedMaxX -
                  this.massiveSelection.isSelectedMinX +
                  2 * this.tolerance,
               this.massiveSelection.isSelectedMaxY -
                  this.massiveSelection.isSelectedMinY +
                  2 * this.tolerance,
            );
         }
      }
   }

   getCurrentShape(current) {
      current.isActive = false;
      switch (current.type) {
         case "rect":
            const newShape = new Rect();
            const id = newShape.id;
            Object.assign(newShape, current);
            newShape.id = id;
            this.rectMap.set(newShape.id, newShape);
            return newShape;
         case "sphere":
            const newSphere = new Circle(
               current.x,
               current.y,
               current.xRadius,
               current.yRadius,
               current.text,
               current.textSize,
               true,
            );
            this.circleMap.set(newSphere.id, newSphere);
            return newSphere;
         case "text":
            const newText = new Text(
               current.x,
               current.y,
               current.textSize,
               current.content,
               current.font,
               true,
            );
            newText.height = newText.content.length * newText.textSize;
            this.textMap.set(newText.id, newText);
            return newText;
         case "polygon":
            const newS = new Polygons(
               current.x,
               current.y,
               current.inset,
               current.lines,
            );
            newS.isActive = true;
            newS.width = current.width;
            newS.height = current.height;
            newS.radius = current.radius;
            current.isActive = false;
            this.otherShapes.set(newS.id, newS);
            return newS;
         default:
            break;
      }
   }

   duplicate(e) {
      if (e.altKey && config.mode === "free") {
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
                  this.breakPoints.set(newShape.id, {
                     minX: newShape.x,
                     maxX: newShape.x + newShape.width,
                     minY: newShape.y,
                     maxX: newShape.y + newShape.height,
                  });
               } else if (newShape.type === "sphere") {
                  this.breakPoints.set(newShape.id, {
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
      } else if (e.ctrlKey) {
         const current = this.canvasClick(e);
         if (!current) return;
         if (current?.isActive) {
            current.isActive = false;
         } else current.isActive = true;

         this.draw();
      }
   }

   documentKeyDown(e) {
      if (
         this.massiveSelection.isSelected ||
         config.mode === "handsFree" ||
         config.mode === "pencil"
      )
         return;

      const x = this.mouseCurrentPosition.x;
      const y = this.mouseCurrentPosition.y;

      // if (!this.isIn(x, y, 0, 0, 0, 0, this.canvas.width, this.canvas.height))
      //    return;

      if (e.ctrlKey && e.key === "c") {
         e.preventDefault();
         const allShapes = [
            ...this.rectMap.values(),
            ...this.circleMap.values(),
            ...this.otherShapes.values(),
            ...this.textMap.values(),
            ...this.lineMap.values(),
         ];

         allShapes.forEach((shape) => {
            if (!shape.isActive) return;
            this.copyShapes.push(shape);
         });
      } else if (e.ctrlKey && e.key === "v") {
         if (this.copyShapes.length === 0) return;
         e.preventDefault();
         this.copyShapes.forEach((shape) => {
            shape.isActive = false;
            const type = shape.type;
            if (type === "rect") {
               const newRect = new Rect(
                  shape.x + (x - shape.x),
                  shape.y + (y - shape.y),
                  shape.width,
                  shape.height,
                  shape.text,
                  shape.textSize,
                  true,
               );
               this.rectMap.set(newRect.id, newRect);
               //set new breakpoint
               this.breakPoints.set(newRect.key, {
                  minX: newRect.x,
                  minY: newRect.y,
                  maxX: newRect.x + newRect.width,
                  maxY: newRect.y + newRect.height,
               });
            } else if (type === "sphere") {
               const newSphere = new Circle(
                  x,
                  y,
                  shape.xRadius,
                  shape.yRadius,
                  shape.text,
                  shape.textSize,
                  true,
               );
               this.circleMap.set(newSphere.id, newSphere);
               this.breakPoints.set(newSphere.id, {
                  minX: newSphere.x - newSphere.xRadius,
                  minY: newSphere.y - newSphere.yRadius,
                  maxX: 2 * newSphere.xRadius,
                  maxY: 2 * newSphere.yRadius,
               });
            } else if (type === "text") {
               const newText = new Text(
                  x,
                  y,
                  shape.size,
                  shape.content,
                  shape.font,
                  true,
                  shape.height,
                  shape.width,
               );

               this.textMap.set(newText.id, newText);
            } else if (type === "polygon") {
               const newOther = new Polygons(x, y, shape.inset, shape.lines);
               this.otherShapes.set(newOther.id, newOther);

               this.breakPoints.set(newOther.id, {
                  minX: newOther.x - newOther.radius,
                  minY: newOther.y - newOther.radius,
                  maxX: newOther.x + newOther.radius,
                  maxY: newOther.y + newOther.radius,
               });
            } else if (type === "line") {
               const deltaX = x - shape.minX;
               const deltaY = y - shape.minY;

               const newPoints = shape.curvePoints.map((point) => ({
                  x: point.x + deltaX,
                  y: point.y + deltaY,
               }));

               const newLine = new Line(
                  shape.lineType,
                  shape.minX + deltaX,
                  shape.minY + deltaY,
                  shape.maxX + deltaX,
                  shape.maxY + deltaY,
                  newPoints,
                  true,
               );

               newLine.width = shape.width;
               newLine.height = shape.height;
               shape.isActive = false;

               this.lineMap.set(newLine.id, newLine);
            }
         });
         this.copyShapes = [];
         this.draw();
      } else if (e.ctrlKey && e.key === "d") {
         e.preventDefault();
         this.copies = [];
         let id = null;
         const padding = 10;
         this.rectMap.forEach((rect) => {
            if (rect.isActive) {
               let newRect = new Rect(
                  rect.x + padding,
                  rect.y + padding,
                  rect.width,
                  rect.height,
                  rect.text,
                  rect.textSize,
                  true,
               );
               newRect.radius = rect.radius;
               newRect.text = rect.text;
               newRect.fillStyle = rect.fillStyle;
               newRect.borderColor = rect.borderColor;

               this.rectMap.set(newRect.id, newRect);
               this.breakPoints.set(newRect.id, {
                  minX: rect.x,
                  minY: rect.y,
                  maxX: rect.x + rect.width,
                  maxY: rect.y + rect.height,
               });
               rect.isActive = false;
               this.copies.push(JSON.parse(JSON.stringify(rect)));

               // changing the current active shape
               config.currentActive = newRect;
            }
         });
         this.circleMap.forEach((sphere) => {
            if (!sphere.isActive) return;
            const newSphere = new Circle(
               sphere.x + padding,
               sphere.y + padding,
               sphere.xRadius,
               sphere.yRadius,
               sphere.text,
               sphere.textSize,
               true,
            );
            newSphere.fillStyle = sphere.fillStyle;
            newSphere.borderColor = sphere.borderColor;
            newSphere.text = sphere.text;

            this.circleMap.set(newSphere.id, newSphere);
            this.breakPoints.set(newSphere.id, {
               minX: newSphere.x - newSphere.xRadius,
               minY: newSphere.y - newSphere.yRadius,
               maxX: newSphere.x + newSphere.xRadius,
               maxY: newSphere.y + newSphere.xRadius,
            });
            sphere.isActive = false;
            this.copies.push(JSON.parse(JSON.stringify(sphere)));
         });
         this.textMap.forEach((text) => {
            if (!text.isActive) return;
            const newText = new Text();
            id = newText.id;
            Object.assign(newText, text);
            newText.x = text.x + padding;
            newText.y = text.y + padding;
            newText.id = id;
            this.textMap.set(newText.id, newText);
            text.isActive = false;
            this.copies.push(JSON.parse(JSON.stringify(text)));
         });
         this.lineMap.forEach((line) => {
            if (line.isActive) {
               const curvePoints = line.curvePoints.map((p) => ({
                  x: p.x + padding,
                  y: p.y + padding,
               }));
               const newLine = new Line(
                  line.lineType,
                  line.minX + padding,
                  line.minY + padding,
                  line.maxX + padding,
                  line.maxY + padding,
                  curvePoints,
                  true,
               );
               this.lineMap.set(newLine.id, newLine);
               line.isActive = false;
               this.copies.push(JSON.parse(JSON.stringify(line)));
            }
         });
         this.otherShapes.forEach((shape) => {
            if (shape.isActive) {
               const newS = new Polygons(
                  shape.x + padding,
                  shape.y + padding,
                  shape.inset,
                  shape.lines,
               );
               newS.radius = shape.radius;
               newS.width = shape.width;
               newS.height = shape.height;
               newS.isActive = true;
               this.otherShapes.set(newS.id, newS);
               shape.isActive = false;
               this.copies.push(JSON.parse(JSON.stringify(shape)));
            }
         });
         this.pencilMap.forEach((pencil) => {
            if (pencil?.isActive) {
               const points = pencil.points.map((point) => {
                  return {
                     x: point.x + padding,
                     y: point.y + padding,
                  };
               });
               const newPencil = new Pencil(
                  points,
                  pencil.minX + padding,
                  pencil.minY + padding,
                  pencil.maxX + padding,
                  pencil.maxY + padding,
               );
               newPencil.isActive = true;
               this.pencilMap.set(newPencil.id, newPencil);
               pencil.isActive = false;
               this.copies.push(JSON.parse(JSON.stringify(pencil)));
            }
         });
         Bin.insert({ type: redoType.fresh, shapes: this.copies });
         this.copies = [];
         this.draw();
         this.onChange();
      } else {
         this.redoEvent(e);
      }
   }

   renderText(
      textArray,
      x,
      y,
      textSize,
      height,
      width,
      position = "left",
      fontWeight,
      fontVarient,
      font,
      allignVertical = "top",
   ) {
      // Calculate the total height of the text block
      let totalTextHeight = textArray.length * textSize;

      // Calculate the starting y-coordinate to center the text block vertically
      let startY;

      switch (allignVertical) {
         case "center":
            startY = y + (height - totalTextHeight) * 0.5 + textSize;
            break;
         case "top":
            startY = y + 3 * this.tolerance;
            break;
         case "bottom":
            startY = y + height - totalTextHeight;
            break;
      }

      // Set the text properties
      this.context.fillStyle = "white";
      this.context.font = `${fontVarient} ${fontWeight} ${textSize}px ${font}`;

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
               midPoint = x + this.tolerance;
               break;
            case "right":
               midPoint = x + (width - metrics.width) - this.tolerance;
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

   undo(arr = [], type) {
      this.removeActiveForAll();
      if (!arr.length) return;
      this.copies = [];

      arr.forEach((shape) => {
         if (type === redoType.fresh) {
            this.checkShapeAndDelete(shape, shape.type);
         } else {
            this.checkShapeExistandMake(shape.id, shape);
         }
      });

      Restore.insert({ type: type, shapes: this.copies });
   }

   redo(arr = [], type) {
      if (!arr.length) return;
      this.copies = [];

      arr.forEach((val) => {
         if (type === redoType.delete) {
            this.checkShapeAndDelete(val, val.type);
         } else {
            this.checkShapeExistandMake(val.id, val);
         }
      });
      if (!this.copies.length) return;

      Bin.insert({ type: type, shapes: this.copies });
   }

   redoEvent(e) {
      if (e.ctrlKey && e.key === "z") {
         const last = Bin.popOut();
         if (!last) return;

         this.undo(last.shapes, last.type);
         this.draw();
         this.drawImage();
      } else if (e.ctrlKey && e.key === "y") {
         const redo = Restore.popOut();
         if (!redo) return;

         this.redo(redo.shapes, redo.type);
         this.draw();
         this.drawImage();
      }
   }

   checkShapeExistandMake(shapeId, shape) {
      const { rect, line, sphere, text, image, otherShapes, pencil } =
         this.getShape(shapeId);

      switch (shape.type) {
         case shapeTypes.rect:
            if (rect) {
               this.copies.push({ ...rect });
               Object.assign(rect, shape);
            } else {
               const newRect = new Rect();
               Object.assign(newRect, shape);
               newRect.id = shape.id;
               this.copies.push({ ...newRect });
               this.rectMap.set(newRect.id, newRect);
            }

            this.makenewBreakpoint(
               shape.id,
               shape.x + shape.width,
               shape.x,
               shape.y,
               shape.y + shape.height,
            );
            break;
         case shapeTypes.text:
            if (text) {
               this.copies.push({ ...text });
               Object.assign(text, shape);
            } else {
               const newText = new Text();
               Object.assign(newText, shape);
               newText.id = shape.id;
               this.copies.push({ ...newText });
               this.textMap.set(newText.id, newText);
            }
            this.makenewBreakpoint(
               shape.id,
               shape.x + shape.width,
               shape.x,
               shape.y,
               shape.y + shape.height,
            );
            break;
         case shapeTypes.circle:
            if (sphere) {
               this.copies.push({ ...sphere });
               Object.assign(sphere, shape);
            } else {
               const newSphere = new Circle();
               Object.assign(newSphere, shape);
               newSphere.id = shape.id;
               this.copies.push({ ...newSphere });
               this.circleMap.set(newSphere.id, newSphere);
            }
            this.makenewBreakpoint(
               shape.id,
               shape.x + shape.xRadius,
               shape.x - shape.xRadius,
               shape.y + shape.yRadius,
               shape.y - shape.yRadius,
            );
            break;
         case shapeTypes.line:
            if (line) {
               this.copies.push({ ...line });
               Object.assign(line, shape);
            } else {
               const newLine = new Line();
               Object.assign(newLine, shape);
               newLine.id = shape.id;
               this.copies.push({ ...newLine });
               this.lineMap.set(newLine.id, newLine);
            }
            break;
         case shapeTypes.others:
            if (otherShapes) {
               this.copies.push({ ...otherShapes });
               Object.assign(otherShapes, shape);
            } else {
               const newO = new Polygons();
               Object.assign(newO, shape);
               newO.id = shape.id;
               this.copies.push({ ...newO });
               this.otherShapes.set(newO.id, newO);
            }
            break;
         case shapeTypes.pencil:
            if (pencil) {
               this.copies.push({ ...pencil });
               Object.assign(pencil, shape);
            } else {
               const newPencil = new Pencil();
               Object.assign(newPencil, shape);
               newPencil.id = shape.id;
               this.copies.push({ ...newPencil });
               this.pencilMap.set(newPencil.id, newPencil);
            }
            break;
      }
   }

   checkShapeAndDelete(shape, type) {
      const shapeHandlers = {
         [shapeTypes.rect]: (shape) => {
            this.copies.push({ ...shape });
            this.rectMap.delete(shape.id);
         },
         [shapeTypes.circle]: (shape) => {
            this.copies.push({ ...shape });
            this.circleMap.delete(shape.id);
         },
         [shapeTypes.text]: (shape) => {
            this.copies.push({ ...shape });
            this.textMap.delete(shape.id);
         },
         [shapeTypes.others]: (shape) => {
            this.copies.push({ ...shape });
            this.otherShapes.delete(shape.id);
         },
         [shapeTypes.pencil]: (shape) => {
            this.copies.push({ ...shape });
            this.pencilMap.delete(shape.id);
         },
      };

      const checkifexist = shapeHandlers[type];
      if (checkifexist) {
         checkifexist(shape);
      }
   }

   inputText(mouseX, mouseY, html) {
      if (config.mode === "free" || config.mode === "text") {
         const canvasDiv = document.getElementById("canvas-div");
         canvasDiv.insertAdjacentHTML("afterbegin", html);
         const input = document.getElementById("input");
         input.style.left = mouseX - scrollBar.scrollPositionX + "px";
         input.style.top = mouseY - scrollBar.scrollPositionY + "px";
         input.style.fontSize = "18px";
         input.focus();
         const blurEvent = (e) => {
            const content = e.target.innerText.split("\n");
            const newText = new Text(mouseX, mouseY, 15, content, "Monoscope");
            this.textMap.set(newText.id, newText);
            input.remove();
            this.draw();
            if (this.newShapeParams) this.newShapeParams = null;
            config.mode = "free";
         };

         input.addEventListener("blur", blurEvent);
      }
   }

   makenewBreakpoint(id, maxX, minX, minY, maxY) {
      const alreadyExist = this.breakPoints.get(id);
      if (alreadyExist) {
         alreadyExist.minX = minX;
         alreadyExist.maxX = maxX;
         alreadyExist.maxY = maxY;
         alreadyExist.minY = minY;
      } else this.breakPoints.set(id, { maxX, minY, minY, maxY });
   }

   newText(event) {
      if (event.target.tagName === "TEXTAREA") return;
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(event);

      const html = `<textarea class="w-fit absolute px-[3px] text-[14px] outline-none z-[999] h-fit shadow-sm bg-transparent" id="input"></textarea>`;

      let isClickOnText = false;
      let selectedText = null;
      this.textMap.forEach((text) => {
         const { x, y, width, height } = text;
         if (
            mouseX > x &&
            mouseX < x + width &&
            mouseY > y &&
            mouseY < y + height
         ) {
            isClickOnText = true;
            selectedText = text;
            return;
         }
      });

      if (selectedText) {
         this.canvasDiv.insertAdjacentHTML("afterbegin", html);
         const input = document.getElementById("input");
         input.style.left = selectedText.x + "px";
         input.style.top = selectedText.y + "px";
         input.style.fontSize = "18px";
         let content = "";
         selectedText.content.forEach((t) => {
            if (t.length) {
               content += t + "\n";
            }
         });

         input.textContent = content;
         input.focus();
         const changeEvent = (e) => {
            const content = e.target.value.split("\n");
            selectedText.content = content;
            input.remove();
         };

         input.addEventListener("change", changeEvent);

         input.addEventListener("blur", (e) => {
            input.removeEventListener("change", changeEvent);
            input.remove();
            this.draw();
         });
      }

      if (isClickOnText) return;

      this.inputText(
         mouseX,
         mouseY,
         `<div class="w-fit absolute px-[3px] min-w-[10ch] text-[14px] outline-none z-[999] h-fit shadow-sm bg-transparent" id="input" contenteditable="true"></div>`,
      );
   }

   removeActiveForAll() {
      // Reset all shapes to inactive
      const allShapes = [
         ...this.rectMap.values(),
         ...this.circleMap.values(),
         ...this.textMap.values(),
         ...this.lineMap.values(),
         ...this.imageMap.values(),
         ...this.figureMap.values(),
      ];
      allShapes.forEach((shape) => {
         if (shape.isActive) shape.isActive = false;
      });
      this.massiveSelection.isSelected = null;
      this.breakPointsCtx.clearRect(
         0,
         0,
         this.canvasbreakPoints.width,
         this.canvasbreakPoints.height,
      );
      this.draw();
   }

   initialize() {
      this.canvasDiv.addEventListener("mousedown", (e) => {
         this.mouseDownForFif(e);
      });
      this.canvas.addEventListener("click", (e) => {
         const { x, y } = this.getTransformedMouseCoords(e);
         this.insertAPointToLine(x, y);
      });
      this.canvas.addEventListener("mouseup", this.mouseUp.bind(this));
      this.canvas.addEventListener("mousemove", (e) => {
         this.mouseMove(e);
      });
      this.canvas.addEventListener("mousedown", (e) => {
         this.mouseDownDragAndResize(e);
         this.duplicate(e);
      });
      document.addEventListener("mousemove", (e) => {
         const { x, y } = this.getTransformedMouseCoords(e);
         this.mouseCurrentPosition.x = x;
         this.mouseCurrentPosition.y = y;
      });
      document.addEventListener(
         "keydown",
         (e) => {
            this.documentKeyDown(e);
         },
         { passive: false },
      );
      this.canvas.addEventListener("dblclick", (e) => {
         this.newText(e);
         this.insertNewLine();
      });
   }

   cleanup() {
      this.canvasDiv.removeEventListener("mousedown", (e) => {
         this.mouseDownForFif(e);
      });
      this.canvas.removeEventListener("click", (e) => {
         const { x, y } = this.getTransformedMouseCoords(e);
         this.insertAPointToLine(x, y);
      });
      this.canvas.removeEventListener("mouseup", this.mouseUp.bind(this));

      this.canvas.removeEventListener("mousemove", this.mouseMove.bind(this));

      this.canvas.removeEventListener("mousedown", (e) => {
         this.mouseDownDragAndResize(e);
         this.duplicate(e);
      });

      document.removeEventListener("mousemove", (e) => {
         const { x, y } = this.getTransformedMouseCoords(e);
         this.mouseCurrentPosition.x = x;
         this.mouseCurrentPosition.y = y;
      });
      document.removeEventListener("keydown", (e) => {
         this.documentKeyDown(e);
      });

      this.canvas.removeEventListener("dblclick", (e) => {
         this.newText();
         this.insertNewLine();
      });
   }
}
