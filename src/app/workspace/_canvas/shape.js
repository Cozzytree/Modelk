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
import { recalculateMassiveSelection } from "./massselection";
import {
   lineConnectShape,
   lineResizeLogic,
   lineResizeWhenConnected,
} from "./resizeAndDrag/lineResize";
import { pencilresize } from "./resizeAndDrag/pencilresize";
import { rectResizeParams, updateRectParams } from "./resizeAndDrag/rectResize";
import { textresize } from "./resizeAndDrag/textresize";
import {
   drawFigure,
   drawLine,
   drawRect,
   drawSHapes,
   drawSphere,
   drawText,
   findSlope,
} from "./utilsFunc.js";
import { updateCanvasText } from "./updateShapeText";
import { rectDraw } from "./draw/rectdraw";
import { lineDraw } from "./draw/lineDraw";
import { adjustWidthAndHeightforPoints, changeCursors } from "./utils";
import { getSmallestDragShape } from "./resizeAndDrag/shape_drag";
import { drawEllipse } from "./draw/sphereDraw";
import { buildingNewShape, buildShape } from "./newShape/newShape";

const getStrokeOptions = {
   size: 3,
   thinning: 0.5,
   streamline: 0.5,
   easing: (t) => t,
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
   emptyIndexes = [];

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

   initializeShapeArray() {
      this.initialData.forEach((val) => {
         const { Params, _id } = val;
         this.canvasShapes.push({ ...Params, shapeId: _id });
      });
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

   insertNew(e) {
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);
      if (
         this.newShapeParams &&
         this.newShapeParams.type !== shapeTypes.line &&
         this.isDrawing
      ) {
         config.currentActive = [];

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

               // this.rectMap.set(this.newShapeParams.id, this.newShapeParams);
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
               this.newShapeParams.width = this.newShapeParams.xRadius * 2;
               this.newShapeParams.height = this.newShapeParams.yRadius * 2;

               // this.circleMap.set(this.newShapeParams.id, this.newShapeParams);
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
               this.lastPoint = null;
               this.isDrawing = false;
               this.newShapeParams.width =
                  this.newShapeParams.maxX - this.newShapeParams.minX;
               this.newShapeParams.height =
                  this.newShapeParams.maxY - this.newShapeParams.minY;
               if (this.newShapeParams.points) {
                  const { x, y, width, height } = adjustWidthAndHeightforPoints(
                     {
                        points: this.newShapeParams.points,
                     },
                  );
                  this.newShapeParams.width = width;
                  this.newShapeParams.height = height;
                  this.newShapeParams.x = x;
                  this.newShapeParams.y = y;
               }

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

               // this.figureMap.set(this.newShapeParams.id, this.newShapeParams);
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
         if (this.emptyIndexes.length > 0) {
            const poppedIndex = this.emptyIndexes.pop();
            if (this.canvasShapes[poppedIndex] == null) {
               this.canvasShapes[poppedIndex] = this.newShapeParams;
            }
            config.currentActive.push(poppedIndex);
         } else {
            this.canvasShapes.push(this.newShapeParams);
            config.currentActive.push(this.canvasShapes.length - 1);
         }

         Bin.insert({ type: redoType.fresh, shapes: [this.newShapeParams] });
         this.newShapeParams = null;
         this.lastPoint = null;
         this.onChange(config.currentActive);
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
         this.draw();
         this.isDrawing = false;
         config.mode = "free";
         const { x, y, width, height } = adjustWidthAndHeightforPoints({
            points: this.newShapeParams.curvePoints,
         });
         this.newShapeParams.x = x;
         this.newShapeParams.y = y;
         this.newShapeParams.width = width;
         this.newShapeParams.height = height;

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
      config.currentActive = [];
      if (e.ctrlKey && e.key === "a") {
         e.preventDefault();
         this.canvasShapes.forEach((shape, index) => {
            if (!shape) return;
            shape.isActive = true;
            config.currentActive.push(index);
         });
         this.onChange(config.currentActive);
         this.draw();
      } else if (e.key === "Delete") {
         const deletebp = (key) => {
            if (this.breakPoints.has(key)) {
               this.breakPoints.delete(key);
            }
         };
         this.copies = [];
         //remove selected square
         const findPoints = (id) => {
            let found = null;
            for (let i = 0; i < this.canvasShapes.length; i++) {
               if (!this.canvasShapes[i]) continue;
               if (
                  this.canvasShapes[i].type !== shapeTypes.line &&
                  this.canvasShapes[i].isActive
               )
                  continue;
               if (this.canvasShapes[i].id === id) {
                  found = this.canvasShapes[i];
                  break;
               }
            }
            return found;
         };
         this.canvasShapes.forEach((shape, index) => {
            if (!shape || !shape.isActive) return;

            if (shape.type === shapeTypes.line) {
               if (shape.startTo) {
                  const result = this.getCanvasShape(shape.startTo);
                  if (result && result.pointTo.length > 0) {
                     result.pointTo = result.pointTo.filter(
                        (p) => p !== shape.id,
                     );
                  }
               } else if (shape.endTo) {
                  const result = this.getCanvasShape(shape.endTo);
                  if (result && result.pointTo.length > 0) {
                     result.pointTo = result.pointTo.filter(
                        (p) => p !== shape.id,
                     );
                  }
               }
            } else if (shape.type !== shapeTypes.pencil) {
               shape.pointTo.forEach((p) => {
                  let line = findPoints(p);

                  if (line?.startTo === p) {
                     line.startTo = null;
                  }
                  if (line?.endTo === p) {
                     line.endTo = null;
                  }
               });
               deletebp(shape.id);
            }
            this.copies.push(shape);
            this.emptyIndexes.push(index);
            this.canvasShapes[index] = null;
         });
         this.massiveSelection = this.massiveSelection;

         this.breakPointsCtx.clearRect(
            0,
            0,
            this.canvasbreakPoints.width,
            this.canvasbreakPoints.height,
         );

         if (!this.copies.length) return;

         Bin.insert({ type: redoType.delete, shapes: this.copies });
         config.currentActive = [];
         this.onChange();
         this.draw();
      }
   }

   canvasClick(e) {
      if (config.mode === "handsFree" || config.mode === "pencil") {
         return;
      }
      // to get the current active shape so to show the shape options
      config.currentActive = [];

      const { x: clickX, y: clickY } = this.getTransformedMouseCoords(e);
      let smallestShape = null;
      this.canvasShapes.forEach((shape, index) => {
         if (!shape) return;

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
            case shapeTypes.sphere:
               x = shape.x - shape.xRadius;
               y = shape.y - shape.yRadius;
               width = 2 * shape.xRadius;
               height = 2 * shape.xRadius;
               break;
            case shapeTypes.line:
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
         if (this.isIn(clickX, clickY, 0, 0, x, y, width, height)) {
            if (smallestShape == null || smallestShape.width > width) {
               smallestShape = index;
            }
         }
      });

      if (smallestShape == null) return;
      if (!e.ctrlKey) this.removeActiveForAll();
      this.canvasShapes[smallestShape].isActive = true;
      config.currentActive.push(smallestShape);
      return smallestShape;
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

      let figPath = [];

      this.canvasShapes.forEach((shape) => {
         if (!shape) return;
         const {
            x,
            y,
            width,
            height,
            radius,
            lineWidth,
            borderColor,
            text,
            textSize,
            isActive,
            textPosition,
            fontVarient,
            font,
            fontWeight,
            allignVertical,
         } = shape;
         switch (shape.type) {
            case shapeTypes.rect:
               rectDraw({
                  rect: shape,
                  isActive: isActive,
                  context: this.context,
                  tolerance: this.tolerance,
                  activeColor: this.activeColor,
                  massiveSelected: this.massiveSelection.isSelected,
               });
               break;
            case shapeTypes.circle:
               drawEllipse({
                  shape: shape,
                  isActive,
                  ctx: this.context,
                  tolerance: this.tolerance,
                  activeColor: this.activeColor,
                  isMassiveSelected: this.massiveSelection.isSelected,
               });
               break;
            case shapeTypes.text:
               // Set the font size and style before measuring the text
               drawText(shape, this.tolerance, this.context);

               drawDotsAndRect(
                  x,
                  y,
                  width,
                  height,
                  this.tolerance,
                  isActive,
                  this.activeColor,
               );
               break;
            case shapeTypes.line:
               if (isActive) {
                  if (shape.lineType === "curve") {
                     // Apply dotted line style
                     this.context.setLineDash([5, 15]); // Adjust the pattern if needed
                     this.context.lineWidth = 1; // Ensure this is the desired width for dotted lines
                     this.context.strokeStyle = "red"; // Use a specific color for dotted lines

                     // Draw the curve with the dotted line style
                     this.context.moveTo(
                        shape.curvePoints[0].x,
                        shape.curvePoints[0].y,
                     );
                     for (let i = 1; i < shape.curvePoints.length; i++) {
                        this.context.lineTo(
                           shape.curvePoints[i].x,
                           shape.curvePoints[i].y,
                        );
                     }
                     this.context.stroke();
                     this.context.setLineDash([]); // Reset the line dash to solid lines for other drawing operations
                     this.context.closePath();
                  }

                  this.context.strokeStyle = this.activeColor;
                  if (!this.massiveSelection.isSelected) {
                     if (shape.lineType === "curve") {
                        this.dots(...shape.curvePoints, {
                           context: this.context,
                        });
                     } else {
                        if (shape.curvePoints[shape.curvePoints.length - 1])
                           this.dots(
                              {
                                 x: shape.curvePoints[0].x,
                                 y: shape.curvePoints[0].y,
                              },
                              {
                                 x: shape.curvePoints[
                                    shape.curvePoints.length - 1
                                 ].x,
                                 y: shape.curvePoints[
                                    shape.curvePoints.length - 1
                                 ].y,
                              },
                              { context: this.context },
                           );
                     }
                  }
               } else {
                  this.context.strokeStyle = borderColor;
               }
               const headlen = 12;
               lineDraw({
                  context: this.context,
                  headlen,
                  line: shape,
                  tolerance: this.tolerance,
               });
               break;
            case shapeTypes.others:
               drawDotsAndRect(
                  x - radius,
                  y - radius,
                  width,
                  height,
                  this.tolerance,
                  isActive,
               );
               drawSHapes(shape, this.context);
               break;
            case shapeTypes.figure:
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
               const v = drawFigure(
                  shape,
                  this.canvasDiv,
                  this.context,
                  this.activeColor,
               );
               figPath.push({ path: v.path, isActive: v.isActive });
               break;
            case shapeTypes.pencil:
               const { points, minX, minY, maxX, maxY } = shape;
               if (isActive) {
                  if (!this.massiveSelection.isSelected)
                     this.dots(
                        { x: minX - this.tolerance, y: minY - this.tolerance },
                        { x: maxX + this.tolerance, y: minY - this.tolerance },
                        { x: maxX + this.tolerance, y: maxY + this.tolerance },
                        { x: minX - this.tolerance, y: maxY + this.tolerance },
                        { context: this.context },
                     );

                  this.context.beginPath();
                  this.context.strokeStyle = this.activeColor;
                  this.context.rect(
                     minX - this.tolerance,
                     minY - this.tolerance,
                     maxX - minX + 2 * this.tolerance,
                     maxY - minY + 2 * this.tolerance,
                  );
                  this.context.stroke();
                  this.context.closePath();
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
               this.context.fillStyle = borderColor;
               this.context.fill(new Path2D(stroke));
               break;
            case shapeTypes.image:
               if (!this.cache.has(key)) {
                  const img = new Image();
                  img.src = src;
                  img.style.borderRadius = radius + "px";
                  this.cache.set(key, img);
                  img.onload = () => {};
               } else {
                  const img = this.cache.get(key);
               }
               break;
            default:
               break;
         }
      });

      figPath.forEach(({ path, isActive }) => {
         this.context.lineWidth = 1.2;
         this.context.strokeStyle = isActive ? this.activeColor : "grey";
         this.context.fillStyle = "black";
         this.context.stroke(path);
      });

      this.context.restore();
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
      if (e.altKey || config.mode === "handsFree") return;
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

      let ctrlSmallestShape = null;
      if (e.ctrlKey) {
         const { x: clickX, y: clickY } = this.getTransformedMouseCoords(e);
         this.canvasShapes.forEach((shape, index) => {
            if (!shape) return;

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
               case shapeTypes.sphere:
                  x = shape.x - shape.xRadius;
                  y = shape.y - shape.yRadius;
                  width = 2 * shape.xRadius;
                  height = 2 * shape.xRadius;
                  break;
               case shapeTypes.line:
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
            if (this.isIn(clickX, clickY, 0, 0, x, y, width, height)) {
               if (
                  ctrlSmallestShape == null ||
                  this.canvasShapes[ctrlSmallestShape]?.width > width
               ) {
                  ctrlSmallestShape = index;
               }
            }
         });
         if (!this.canvasShapes[ctrlSmallestShape]) return;
      }

      if (ctrlSmallestShape !== null) {
         this.canvasShapes[ctrlSmallestShape].isActive = true;
         config.currentActive.push(ctrlSmallestShape);
         this.onChange(config.currentActive);
         this.draw();
         return;
      }

      // to sore the shape which have changed for undo and redo
      this.copies = [];
      // config.currentActive = null;

      if (config.mode !== "free") {
         this.newShape(mouseX, mouseY);
         return;
      }

      if (this.isDrawing || this.newShapeParams) return;

      // check if multiple selected exist
      if (
         this.massiveSelection.isSelected &&
         mouseX >= this.massiveSelection.isSelectedMinX &&
         mouseX <= this.massiveSelection.isSelectedMaxX &&
         mouseY >= this.massiveSelection.isSelectedMinY &&
         mouseY <= this.massiveSelection.isSelectedMaxY &&
         (!this.resizeElement || !this.dragElement)
      ) {
         this.canvasShapes.forEach((shape) => {
            if (!shape || !shape.isActive) return;

            this.copies.push(JSON.parse(JSON.stringify(shape)));
            if (shape?.pointTo && shape.pointTo.length > 0) {
               shape.pointTo.forEach((p) => {
                  for (let i = 0; i < this.canvasShapes.length; i++) {
                     if (!this.canvasShapes[i]) return;
                     if (this.canvasShapes[i].type !== shapeTypes.line) return;
                     if (this.canvasShapes[i] === p) {
                        this.copies.push(
                           JSON.parse(JSON.stringify(this.canvasShapes[i])),
                        );
                        break;
                     }
                  }
               });
            }
            switch (shape.type) {
               case shapeTypes.line:
                  shape.curvePoints.forEach((point) => {
                     point.offsetX = point.x - mouseX;
                     point.offsetY = point.y - mouseY;
                  });
                  break;
               case shapeTypes.pencil:
                  shape.offsetX = shape.minX - mouseX;
                  shape.offsetY = shape.minY - mouseY;
                  shape.width = shape.maxX - shape.minX;
                  shape.height = shape.maxY - shape.minY;
                  shape.points.forEach((point) => {
                     point.offsetX = point.x - mouseX;
                     point.offsetY = point.y - mouseY;
                  });
                  break;
               default:
                  shape.offsetX = shape.x - mouseX;
                  shape.offsetY = shape.y - mouseY;
                  break;
            }
         });

         this.massiveSelection.isSelectedDown = true;
         this.massiveSelection.startX = mouseX;
         this.massiveSelection.startY = mouseY;
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
         this.onChange(config.currentActive);
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

      config.currentActive = [];
      let isResizing = false;

      this.canvasShapes.forEach((shape, index) => {
         if (!shape) return;
         const { x, y, width, height, isActive, containerId } = shape;
         if (isResizing || !isActive) return;

         // find container if in
         const findContainer = this.containers.find(
            (v) => v.id === containerId,
         );

         const setActiveResizing = (resizeParams) => {
            shape.isActive = true;
            isResizing = true;
            config.currentActive.push(shape);
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
                  config.currentActive.push(index);
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
               const rectResize = rectResizeParams({
                  x,
                  y,
                  width,
                  height,
                  mouseX,
                  mouseY,
                  tolerance: this.tolerance,
               });
               rectResize.forEach((condition) => {
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
                  checkAndSetActiveResizing({ direction: "horizontel" });
               } else if ((topEdge || bottomEdge) && horizontalBounds) {
                  checkAndSetActiveResizing({ direction: "vertical" });
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
               const { maxX, minY, maxY, minX } = shape;
               const pencilResizeParams = rectResizeParams({
                  x: minX,
                  y: minY,
                  width,
                  height,
                  mouseX,
                  mouseY,
                  tolerance: this.tolerance,
               });
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
            case shapeTypes.text:
               if (
                  mouseX > shape.x + shape.width - this.tolerance &&
                  mouseX <= shape.x + shape.width + this.tolerance &&
                  mouseY > shape.y + shape.height - this.tolerance &&
                  mouseY <= shape.y + shape.height + this.tolerance
               ) {
                  checkAndSetActiveResizing({});
               }
               break;
            case shapeTypes.others:
               const oResizeParams = rectResizeParams({
                  x: x - shape.radius,
                  y: y - shape.radius,
                  width,
                  height,
                  mouseX,
                  mouseY,
                  tolerance: this.tolerance,
               });
               oResizeParams.forEach((cond) => {
                  if (cond.condition) {
                     checkAndSetActiveResizing({ initailX: mouseX });
                     return;
                  }
               });
               break;
            case shapeTypes.figure:
               const figResizeParams = rectResizeParams({
                  x,
                  y,
                  width,
                  height,
                  mouseX,
                  mouseX,
                  tolerance: this.tolerance,
               });
               for (let i = 0; i < figResizeParams.length; i++) {
                  if (figResizeParams[i].condition) {
                     shape.isActive = true;
                     isResizing = true;
                     config.currentActive.push(shape);
                     this.resizeElement = {
                        direction: figResizeParams[i].side,
                        x,
                        y,
                        index,
                        width,
                        height,
                     };
                     break;
                  }
               }
               break;
            default:
               return;
         }
      });

      console.log(isResizing);
      if (isResizing) return;

      // Drag --------------------
      const setDragging = (obj) => {
         obj.isActive = true;
         obj.offsetX = mouseX - obj.x;
         obj.offsetY = mouseY - obj.y;
      };
      // const smallestShapeKey = getSmallestDragShape({
      //    mouseX,
      //    mouseY,
      //    shapes: this.canvasShapes,
      // });
      // console.log(smallestShapeKey);
      // const smallestShape = this.canvasShapes[smallestShapeKey];
      let smallestShapeKey = null;
      let smallestShape = null;
      this.canvasShapes.forEach((shape, index) => {
         if (!shape) return;

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

      if (smallestShape && this.canvasShapes[smallestShapeKey]) {
         config.currentActive.push(smallestShapeKey);
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

      // for massSelection
      if (!this.dragElement && !this.resizeElement && config.mode === "free") {
         this.massiveSelection.isDown = true;
         this.massiveSelection.startX = mouseX;
         this.massiveSelection.startY = mouseY;
      }

      this.onChange(config.currentActive);
      this.draw();
   }

   mouseDownForFif(e) {
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);
      let shouldDraw = false;

      if (this.massiveSelection.isSelected) return;
      for (let i = 0; i < this.canvasShapes.length; i++) {
         if (
            !this.canvasShapes[i] ||
            this.canvasShapes[i].type !== shapeTypes.figure
         )
            continue;

         const { id, isActive, x, y, width, height } = this.canvasShapes[i];
         const element = document.querySelector(`[data-containerId="${id}"]`);

         // Check if the click happened inside any of the elements
         if (element.contains(e.target)) {
            if (config.currentActive.length)
               config.currentActive[0].isActive = false;
            config.currentActive.push(i);
            this.canvasShapes[i].isActive = true;
            shouldDraw = true;
         } else if (
            isActive &&
            mouseX >= x - this.tolerance &&
            mouseX <= x + width + this.tolerance &&
            mouseY >= y - this.tolerance &&
            mouseY <= y + height + this.tolerance
         ) {
            shouldDraw = true;
            this.canvasShapes[i].isActive = true;
         } else this.canvasShapes[i].isActive = false;
      }
      // Re-render the figures
      shouldDraw && this.draw();
      this.onChange();
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

         /* find the connected lines to the shape */
         object.pointTo.forEach((p) => {
            let l = null;
            this.canvasShapes.forEach((c, i) => {
               if (!c) return;
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
            line.forEach((l) => {
               let start = null;
               let end = null;

               for (let i = 0; i < this.canvasShapes.length; i++) {
                  if (!this.canvasShapes[i]) continue;
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

         if (arrowStartRect.length > 0) {
            arrowStartRect.forEach((ar) => {
               if (ar.id === object.id) {
                  line.forEach((l) => {
                     // if (whichMap(object.type, l.startTo) === object)
                     if (l.startTo === object.id) {
                        const found = this.getCanvasShape(l.endTo);
                        const { curvePoints } = l;

                        lineResizeWhenConnected({
                           line: l,
                           endShape: found ? found : null,
                           startShape: object,
                           storEn: "start",
                        });
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
                        const found = this.getCanvasShape(l.startTo);
                        const { curvePoints } = l;

                        lineResizeWhenConnected({
                           line: l,
                           endShape: found ? found : null,
                           startShape: object,
                           startEn: "end",
                        });
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
            this.newShapeParams?.type,
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

         this.canvasShapes.forEach((shape) => {
            if (!shape || !shape.isActive) return;
            switch (shape.type) {
               case shapeTypes.pencil:
                  shape.minX = mouseX + shape.offsetX;
                  shape.minY = mouseY + shape.offsetY;
                  shape.maxY = shape.minY + shape.height;
                  shape.maxX = shape.minX + shape.width;

                  shape.points.forEach((point) => {
                     point.x = mouseX + point.offsetX;
                     point.y = mouseY + point.offsetY;
                  });
                  break;
               case shapeTypes.line:
                  shape.curvePoints.forEach((point) => {
                     point.x = mouseX + point.offsetX;
                     point.y = mouseY + point.offsetY;
                  });
                  break;
               default:
                  const { offsetY, offsetX } = shape;
                  shape.x = mouseX + offsetX;
                  shape.y = mouseY + offsetY;
                  break;
            }
         });
         this.massiveSelectionRect(
            this.massiveSelection.isSelectedMinX - this.tolerance,
            this.massiveSelection.isSelectedMinY - this.tolerance,
            this.massiveSelection.width + 2 * this.tolerance,
            this.massiveSelection.height + 2 * this.tolerance,
         );

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

         this.canvasShapes.forEach((shape) => {
            if (!shape) return;
            let sx,
               sy,
               swidth,
               sheight = null;
            switch (shape.type) {
               case shapeTypes.circle:
                  sx = shape.x - shape.xRadius;
                  sy = shape.y - shape.yRadius;
                  swidth = 2 * shape.xRadius;
                  sheight = 2 * shape.yRadius;
                  break;
               case shapeTypes.line:
                  sx = shape.minX;
                  sy = shape.minY;
                  swidth = shape.maxX - shape.minX;
                  sheight = shape.maxY - shape.minY;
                  break;
               case shapeTypes.others:
                  sx = shape.x - shape.radius;
                  sy = shape.y - shape.radius;
                  swidth = shape.width;
                  sheight = shape.height;
                  break;
               default:
                  sx = shape.x;
                  sy = shape.y;
                  swidth = shape.width;
                  sheight = shape.height;
                  break;
            }

            if (this.isIn(sx, sy, swidth, sheight, x, y, width, height)) {
               shape.isActive = true;
            } else shape.isActive = false;
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
                  // const { initialSize } = this.resizeElement;
                  textresize({ mouseX, mouseY, theResizeElement });
               }

               this.updateLinesPointTo(theResizeElement);
               break;
            case shapeTypes.pencil:
               const { initialMaxX, initialMinX, initialMinY, initialMaxY } =
                  this.resizeElement;
               const originalWidth = initialMaxX - initialMinX;
               const originalHeight = initialMaxY - initialMinY;

               pencilresize({
                  direction: this.resizeElement.direction,
                  initialMaxX,
                  initialMaxY,
                  initialMinX,
                  initialMinY,
                  mouseX,
                  mouseY,
                  theResizeElement,
               });
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
            case shapeTypes.others:
               const { initailX } = this.resizeElement;
               theResizeElement.radius = Math.abs(theResizeElement.x - mouseX);
               theResizeElement.width = 2 * theResizeElement.radius;
               theResizeElement.height = 2 * theResizeElement.radius;
               this.updateLinesPointTo(theResizeElement);
               break;
            case shapeTypes.figure:
               squareResize(theResizeElement);
               break;
            default:
               break;
         }
      }

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
                  thedragElement.id,
                  thedragElement,
               );

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
                  thedragElement.id,
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
               this.showGuides(
                  thedragElement.minX,
                  thedragElement.minY,
                  thedragElement.maxX - thedragElement.minX,
                  thedragElement.maxY - thedragElement.minY,
                  this.dragElement,
                  thedragElement,
               );
               break;
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
            case shapeTypes.text:
               thedragElement.x = mouseX - thedragElement.offsetX;
               thedragElement.y = mouseY - thedragElement.offsetY;
               this.showGuides(
                  thedragElement.x,
                  thedragElement.y,
                  thedragElement.width,
                  thedragElement.height,
                  thedragElement.id,
                  thedragElement,
               );

               //  this.drawRenderCanvas("text", text);
               this.updateLinesPointTo(thedragElement);
               break;
            default:
               break;
         }
      }

      this.draw();
   }

   insertNewToShapes(shape) {
      const popped = this.emptyIndexes.pop();
      if (popped) {
         this.canvasShapes[popped] = shape;
      } else {
         this.canvasShapes.push(shape);
      }
   }

   mouseUp(e) {
      if (config.mode == "handsFree" || e.altKey) return;
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

      // insert a shape
      this.insertNew(e);

      if (this.copies.length > 0) {
         Bin.insert({ type: redoType.revert, shapes: this.copies });
         this.copies = [];
      }

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

         this.canvasShapes.forEach((shape, i) => {
            if (!shape) return;
            let sx,
               sy,
               swidth,
               sheight = null;
            switch (shape.type) {
               case shapeTypes.circle:
                  sx = shape.x - shape.xRadius;
                  sy = shape.y - shape.yRadius;
                  swidth = 2 * shape.xRadius;
                  sheight = 2 * shape.yRadius;
                  break;
               case shapeTypes.line:
                  sx = shape.minX;
                  sy = shape.minY;
                  swidth = shape.maxX - shape.minX;
                  sheight = shape.maxY - shape.minY;
                  break;
               case shapeTypes.others:
                  sx = shape.x - shape.radius;
                  sy = shape.y - shape.radius;
                  swidth = shape.width;
                  sheight = shape.height;
                  break;
               default:
                  sx = shape.x;
                  sy = shape.y;
                  swidth = shape.width;
                  sheight = shape.height;
                  break;
            }

            if (
               this.isIn(
                  sx,
                  sy,
                  swidth,
                  sheight,
                  minX,
                  minY,
                  maxX - minX,
                  maxY - minY,
               )
            ) {
               if (!this.massiveSelection.isSelected) {
                  this.massiveSelection.isSelected = true;
               }
               config.currentActive.push(i);

               /* recalculate massive selection */
               recalculateMassiveSelection({
                  massiveSelection: this.massiveSelection,
                  breakpointsMap: this.breakPoints,
                  shapes: this.canvasShapes,
               });
               // this.adjustMassiveSelectionXandY(sx, sy, swidth, sheight);
               shape.isActive = true;
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
      }

      // variable to control mouse down for selected
      if (this.massiveSelection.isSelectedDown) {
         this.massiveSelection.isSelectedDown = false;
         this.massiveSelection.isDown = false;

         if (Math.abs(this.massiveSelection.startX - mouseX) <= 10) {
            this.massiveSelection.isSelected = false;
            this.removeActiveForAll();
            this.breakPointsCtx.clearRect(
               0,
               0,
               this.canvasbreakPoints.width,
               this.canvasbreakPoints.height,
            );
            return;
         }

         // massive is selected
         if (this.massiveSelection.isSelected) {
            /* calculate the massive selection parameters update guides */
            recalculateMassiveSelection({
               massiveSelection: this.massiveSelection,
               breakpointsMap: this.breakPoints,
               shapes: this.canvasShapes,
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
               updateRectParams({
                  guidesMap: this.breakPoints,
                  theResizeElement,
                  shapes: this.canvasShapes,
               });
               break;
            case shapeTypes.pencil:
               const {
                  x: _px,
                  y: _py,
                  width: _pW,
                  height: _pH,
               } = adjustWidthAndHeightforPoints({
                  points: theResizeElement.points,
               });
               theResizeElement.x = _px;
               theResizeElement.y = _py;
               theResizeElement.width = _pW;
               theResizeElement.height = _pH;
               break;
            case shapeTypes.line:
               lineConnectShape({
                  theResizeElement,
                  mouseX,
                  mouseY,
                  tolerance: this.tolerance,
                  canvasShapes: this.canvasShapes,
                  direction: this.resizeElement.direction,
               });
               const { height, width, x, y } = adjustWidthAndHeightforPoints({
                  points: theResizeElement.curvePoints,
               });
               theResizeElement.width = width;
               theResizeElement.height = height;
               theResizeElement.x = x;
               theResizeElement.y = y;

               // this.updateLineMinMax(theResizeElement);
               break;
            case shapeTypes.circle:
               theResizeElement.xRadius = Math.max(
                  theResizeElement.xRadius,
                  15,
               );
               theResizeElement.yRadius = Math.max(
                  theResizeElement.yRadius,
                  15,
               );
               theResizeElement.width = theResizeElement.xRadius * 2;
               theResizeElement.height = theResizeElement.yRadius * 2;

               theResizeElement.isActive = true;
               if (theResizeElement.id) {
                  this.updateGuides(
                     theResizeElement.id,
                     theResizeElement.x - theResizeElement.xRadius,
                     theResizeElement.y - theResizeElement.yRadius,
                     theResizeElement.x + theResizeElement.xRadius,
                     theResizeElement.y + theResizeElement.yRadius,
                  );
               }
               break;
            case shapeTypes.figure:
               updateRectParams({
                  guidesMap: this.breakPoints,
                  theResizeElement,
               });
               theResizeElement.width = Math.max(theResizeElement.width, 20);
               theResizeElement.height = Math.max(theResizeElement.height, 20);
               this.getShapesInsideFigure(
                  theResizeElement,
                  this.resizeElement?.key,
               );

               // this.updateGuides(
               //    theResizeElement.id,
               //    x,
               //    y,
               //    x + width,
               //    y + height,
               // );
               break;
            case shapeTypes.others:
               this.updateGuides(
                  theResizeElement?.id,
                  theResizeElement.x - theResizeElement.radius,
                  theResizeElement.y - theResizeElement.radius,
                  theResizeElement.x + theResizeElement.radius,
                  theResizeElement.y + theResizeElement.radius,
               );
               break;
            default:
               break;
         }
      }

      if (this.resizeElement) {
         this.draw();
         this.resizeElement = null;
         return;
      }

      if (theDragElement) {
         switch (theDragElement.type) {
            case shapeTypes.rect:
               this.updateGuides(
                  theDragElement.id,
                  theDragElement.x,
                  theDragElement.y,
                  theDragElement.x + theDragElement.width,
                  theDragElement.y + theDragElement.height,
               );

               if (theDragElement.pointTo?.length > 0) {
                  theDragElement.pointTo.forEach((l) => {
                     // this.updateLineMinMax(l);
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
               this.updateGuides(
                  theDragElement.id,
                  theDragElement.x - theDragElement.xRadius,
                  theDragElement.y - theDragElement.yRadius,
                  theDragElement.x + theDragElement.xRadius,
                  theDragElement.y + theDragElement.yRadius,
               );
               theDragElement.width = 2 * theDragElement.xRadius;
               theDragElement.height = 2 * theDragElement.yRadius;
               if (theDragElement.pointTo?.length > 0) {
                  theDragElement.pointTo.forEach((l) => {
                     for (let i = 0; i < this.canvasShapes.length; i++) {
                        if (!this.canvasShapes[i]) continue;
                        if (l === this.canvasShapes[i].id) {
                           this.updateLineMinMax(this.canvasShapes[i]);
                           break;
                        }
                     }
                  });
               }

               break;
            case shapeTypes.line:
               this.updateLineMinMax(theDragElement);
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
               const {
                  x: _lx,
                  y: _ly,
                  width: _lW,
                  height: _lH,
               } = adjustWidthAndHeightforPoints({
                  points: theDragElement.curvePoints,
               });
               theDragElement.x = _lx;
               theDragElement.y = _ly;
               theDragElement.width = _lW;
               theDragElement.height = _lH;
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
            case shapeTypes.text:
               this.checkShapeIfInContainer(
                  theDragElement.x,
                  theDragElement.y,
                  theDragElement.width,
                  theDragElement.height,
                  theDragElement,
               );
               break;
            case shapeTypes.pencil:
               const {
                  x: _px,
                  y: _py,
                  width: _pW,
                  height: _pH,
               } = adjustWidthAndHeightforPoints({
                  points: theDragElement.points,
               });
               theDragElement.x = _px;
               theDragElement.y = _py;
               theDragElement.width = _pW;
               theDragElement.height = _pH;
               break;
            default:
               break;
         }
      }

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
      this.breakPointsCtx.restore();
   }

   insertImage(imageFile) {
      const popped = this.emptyIndexes.pop();

      console.log(imageFile);
      if (popped !== null) {
         this.canvasShapes[popped] = imageFile;
      } else {
         this.canvasShapes.push(imageFile);
      }
      this.breakPoints.set(imageFile.id, {
         minX: imageFile.x,
         minY: imageFile.y,
         maxX: imageFile.x + imageFile.width,
         maxY: imageFile.y + imageFile.height,
      });
      this.draw();
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
         if (!this.canvasShapes[i]) continue;
         if (
            id === this.canvasShapes[i].id &&
            this.canvasShapes[i].type !== shapeTypes.line
         ) {
            shapeFound = this.canvasShapes[i];
            break;
         }
      }
      return shapeFound;
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

   updateLineMinMax(line) {
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
      line.width = line.maxX - line.minX;
      line.height = line.maxY - line.minY;
      line.x = line.minX;
      line.y = line.minY;
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

      this.canvasShapes.forEach((shape) => {
         if (!shape) return;
         const type = shape.type;

         if (type == shapeTypes.circle) {
            const distance = Math.sqrt(
               (mouseX - shape.x) ** 2 + (mouseY - shape.y) ** 2,
            );
            if (
               Math.abs(distance - shape.xRadius) <= 2 * tolerance &&
               Math.abs(distance - shape.yRadius) <= 2 * tolerance
            ) {
               path.ellipse(
                  shape.x,
                  shape.y,
                  shape.xRadius + tolerance,
                  shape.yRadius + tolerance,
                  0,
                  0,
                  Math.PI * 2,
                  false,
               );
            }
         } else if (type == shapeTypes.text) {
            const { x, y, width, height } = shape;
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
               drawRoundedRect(shape);
            }
         } else if (type == shapeTypes.rect || type == shapeTypes.image) {
            if (this.squareLineParams(shape, mouseX, mouseY)) {
               drawRoundedRect(shape);
            }
         } else if (type == shapeTypes.others) {
            const { radius, x, y } = shape;
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
         case shapeTypes.rect:
            const newShape = new Rect();
            const id = newShape.id;
            Object.assign(newShape, current);
            newShape.id = id;
            this.canvasShapes.push(newShape);
            return newShape;
         case shapeTypes.circle:
            const newSphere = new Circle(
               current.x,
               current.y,
               current.xRadius,
               current.yRadius,
               current.text,
               current.textSize,
               true,
            );
            this.canvasShapes.push(newSphere);
            return newSphere;
         case shapeTypes.text:
            const newText = new Text(
               current.x,
               current.y,
               current.textSize,
               current.content,
               current.font,
               true,
            );
            newText.height = newText.content.length * newText.textSize;
            this.canvasShapes.push(newText);
            return newText;
         case shapeTypes.others:
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
            this.canvasShapes.push(newS);
            return newS;
         case shapeTypes.line:
            const newL = new Line(current.lineType);
            const lid = newL.id;
            Object.assign(newL, current);
            newL.id = lid;
            this.canvasShapes.push(newL);
            current.isActive = false;

            return newL;
         default:
            return;
      }
   }

   duplicate(e) {
      if (e.altKey && config.mode === "free") {
         const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);
         const index = this.canvasClick(e);
         const current = this.canvasShapes[index];
         if (!current) return;

         const newShape = this.getCurrentShape(current);

         if (newShape.type === shapeTypes.line) {
            newShape?.curvePoints.forEach((p) => {
               p.offsetX = mouseX - p.x;
               p.offsetY = mouseY - p.y;
            });
         }

         const mouseMoveHandler = (moveEvent) => {
            const { x, y } = this.getTransformedMouseCoords(moveEvent);
            if (newShape.type === shapeTypes.line) {
               newShape?.curvePoints.forEach((p) => {
                  p.x = x - p.offsetX;
                  p.y = y - p.offsetY;
               });
            } else {
               newShape.x = x;
               newShape.y = y;
            }

            newShape.isActive = true;
            config.currentActive = newShape;
            this.draw();
         };
         const mouseUpHandler = () => {
            if (newShape.type === shapeTypes.rect) {
               this.breakPoints.set(newShape.id, {
                  minX: newShape.x,
                  maxX: newShape.x + newShape.width,
                  minY: newShape.y,
                  maxX: newShape.y + newShape.height,
               });
            } else if (newShape.type === shapeTypes.circle) {
               this.breakPoints.set(newShape.id, {
                  minX: newShape.x - newShape.xRadius,
                  maxX: newShape.x + newShape.xRadius,
                  minY: newShape.y - newShape.yRadius,
                  maxX: newShape.y + newShape.yRadius,
               });
            }
            // this.onChange()
            this.canvas.removeEventListener("mousemove", mouseMoveHandler);
            this.canvas.removeEventListener("mouseup", mouseUpHandler);
            this.canvas.removeEventListener("click", this.canvasClick);
            this.onChange([index]);
         };
         this.canvas.addEventListener("mousemove", mouseMoveHandler);
         this.canvas.addEventListener("mouseup", mouseUpHandler);
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
         };
         const handlerUp = () => {
            this.canvas.removeEventListener("mousemove", handlermove);
            this.canvas.removeEventListener("mouseup", handlerUp);
         };
         this.canvas.addEventListener("mousemove", handlermove);
         this.canvas.addEventListener("mouseup", handlerUp);
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

         this.canvasShapes.forEach((shape) => {
            if (!shape.isActive) return;
            this.copyShapes.push(shape);
         });
      } else if (e.ctrlKey && e.key === "v") {
         if (this.copyShapes.length === 0) return;
         e.preventDefault();
         this.copyShapes.forEach((shape) => {
            shape.isActive = false;
            const type = shape.type;

            const newShape = { ...shape };
            newShape.id = Date.now();
            newShape.x = shape.x + (x - shape.x);
            newShape.y = shape.y + (y - shape.y);

            const poppedIndex = this.emptyIndexes.pop();
            if (poppedIndex != null) {
               this.canvasShapes[poppedIndex] = newShape;
            } else {
               this.canvasShapes.push(newShape);
            }
         });
         this.copyShapes = [];
         this.draw();
      } else if (e.ctrlKey && e.key === "d") {
         e.preventDefault();
         this.copies = [];
         let id = null;
         const padding = 10;

         this.canvasShapes.forEach((shape) => {
            if (!shape) return;
            const types = [
               shapeTypes.rect,
               shapeTypes.text,
               shapeTypes.circle,
               shapeTypes.line,
               shapeTypes.others,
            ];

            const create = {
               [shapeTypes.rect]: () => {
                  let newRect = new Rect(
                     shape.x + padding,
                     shape.y + padding,
                     shape.width,
                     shape.height,
                     shape.text,
                     shape.textSize,
                     true,
                  );
                  newRect.radius = shape.radius;
                  newRect.text = shape.text;
                  newRect.fillStyle = shape.fillStyle;
                  newRect.borderColor = shape.borderColor;

                  this.breakPoints.set(newRect.id, {
                     minX: shape.x,
                     minY: shape.y,
                     maxX: shape.x + shape.width,
                     maxY: shape.y + shape.height,
                  });
                  shape.isActive = false;
                  return newRect;
               },
               [shapeTypes.circle]: () => {
                  const newSphere = new Circle(
                     shape.x + padding,
                     shape.y + padding,
                     shape.xRadius,
                     shape.yRadius,
                     shape.text,
                     shape.textSize,
                     true,
                  );
                  newSphere.fillStyle = shape.fillStyle;
                  newSphere.borderColor = shape.borderColor;
                  newSphere.text = shape.text;

                  this.breakPoints.set(newSphere.id, {
                     minX: newSphere.x - newSphere.xRadius,
                     minY: newSphere.y - newSphere.yRadius,
                     maxX: newSphere.x + newSphere.xRadius,
                     maxY: newSphere.y + newSphere.xRadius,
                  });
                  shape.isActive = false;
                  return newSphere;
               },
               [shapeTypes.text]: () => {
                  const newText = new Text();
                  id = newText.id;
                  Object.assign(newText, shape);
                  newText.x = shape.x + padding;
                  newText.y = shape.y + padding;
                  newText.id = id;
                  shape.isActive = false;
                  return newText;
               },
               [shapeTypes.line]: () => {
                  const curvePoints = shape.curvePoints.map((p) => ({
                     x: p.x + padding,
                     y: p.y + padding,
                  }));
                  const newLine = new Line(
                     shape.lineType,
                     shape.minX + padding,
                     shape.minY + padding,
                     shape.maxX + padding,
                     shape.maxY + padding,
                     curvePoints,
                     true,
                  );
                  let id = newLine.id;
                  Object.assign(newLine, shape);
                  newLine.id = id;
                  newLine.x = newLine.x + padding;
                  newLine.y = newLine.y + padding;

                  shape.isActive = false;
                  return newLine;
               },
               [shapeTypes.others]: () => {
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
                  return newS;
               },
               [shapeTypes.pencil]: () => {
                  const points = shape.points.map((point) => {
                     return {
                        x: point.x + padding,
                        y: point.y + padding,
                     };
                  });
                  const newPencil = new Pencil(
                     points,
                     shape.minX + padding,
                     shape.minY + padding,
                     shape.maxX + padding,
                     shape.maxY + padding,
                  );
                  newPencil.isActive = true;
                  this.pencilMap.set(newPencil.id, newPencil);
                  shape.isActive = false;
                  return newPencil;
               },
            };

            if (!shape.isActive) return;
            for (let i = 0; i < types.length; i++) {
               if (types[i] === shape.type) {
                  const func = create[types[i]];
                  if (!func) return;

                  const result = func();
                  const poppedIndex = this.emptyIndexes.pop();
                  if (poppedIndex != null) {
                     this.canvasShapes[poppedIndex] = result;
                     config.currentActive = [poppedIndex];
                  } else {
                     this.canvasShapes.push(result);
                     config.currentActive = [this.canvasShapes.length - 1];
                  }

                  this.copies.push(JSON.parse(JSON.stringify(shape)));
                  break;
               }
            }
         });

         Bin.insert({ type: redoType.fresh, shapes: this.copies });
         this.copies = [];
         this.onChange(config.currentActive);
         this.draw();
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
            this.checkShapeAndDelete(shape);
         } else if (type === redoType.delete) {
            const newRect = new Rect();
            Object.assign(newRect, shape);
            const poppedIndex = this.emptyIndexes.pop();
            if (poppedIndex) {
               this.canvasShapes[poppedIndex] = newRect;
            } else {
               this.canvasShapes.push(newRect);
            }
            this.copies.push({ ...shape });
         } else {
            for (let i = 0; i < this.canvasShapes.length; i++) {
               if (shape.id === this.canvasShapes[i]?.id) {
                  Object.assign(this.canvasShapes[i], shape);
                  this.copies.push({ ...shape });
                  break;
               }
            }
         }
      });
      if (!this.copies.length) return;
      Restore.insert({ type: type, shapes: this.copies });
   }

   redo(arr = [], type) {
      if (!arr.length) return;
      this.copies = [];

      arr.forEach((val) => {
         if (type === redoType.delete) {
            this.checkShapeAndDelete(val);
         } else if (type === redoType.fresh) {
            const poppedIndex = this.emptyIndexes.pop();
            if (poppedIndex !== null) {
               this.canvasShapes[poppedIndex] = val;
            } else {
               this.canvasShapes.push(val);
            }
            this.copies.push({ ...val });
         } else {
            for (let i = 0; i < this.canvasShapes.length; i++) {
               if (val.id === this.canvasShapes[i]?.id) {
                  Object.assign(this.canvasShapes[i], val);
                  this.copies.push({ ...val });
                  break;
               }
            }
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
      } else if (e.ctrlKey && e.key === "y") {
         const redo = Restore.popOut();
         if (!redo) return;

         this.redo(redo.shapes, redo.type);
         this.draw();
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

   checkShapeAndDelete(shape) {
      for (let i = 0; i < this.canvasShapes.length; i++) {
         if (!this.canvasShapes[i]) continue;
         if (shape.id === this.canvasShapes[i].id) {
            this.copies.push({ ...shape });
            this.emptyIndexes.push(i);
            this.canvasShapes[i] = null;
            break;
         }
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

            this.canvasShapes.push(newText);

            config.currentActive = newText;
            this.onChange();
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

      const html = `<div class="w-fit absolute px-[3px] min-w-[10ch] text-[14px] outline-none z-[999] h-fit shadow-sm bg-transparent" id="input" contenteditable="true"></div>`;

      let isClickOnText = false;
      let selectedText = null;

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

      this.inputText(mouseX, mouseY, html);
   }

   canvasDblClick(e) {
      const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);
      if (updateCanvasText({ mouseX, mouseY, shapes: this.canvasShapes })) {
         this.draw();
         return;
      }

      const html = `<div class="w-fit absolute px-[3px] min-w-[10ch] text-[14px] outline-none z-[999] h-fit shadow-sm bg-transparent" id="input" contenteditable="true"></div>`;
      this.inputText(mouseX, mouseY, html);
      this.insertNewLine();
      this.draw();
   }

   removeActiveForAll() {
      // Reset all shapes to inactive
      this.canvasShapes.forEach((shape) => {
         if (!shape) return;
         shape.isActive = false;
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

   takeShapeToTop(index) {
      const shape = this.canvasShapes[index];
      if (!shape) return;

      this.canvasShapes[index] = this.canvasShapes.pop();
      this.canvasShapes.push(shape);

      this.draw();
      this.onChange([this.canvasShapes.length - 1]);
   }

   takeShapeToVBottom(index) {
      if (index < 0 || index >= this.canvasShapes.length) return;
      console.log("in");
      [this.canvasShapes[index], this.canvasShapes[0]] = [
         this.canvasShapes[0],
         this.canvasShapes[index],
      ];
      this.draw();
      this.onChange([0]);
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
      this.canvas.addEventListener("dblclick", this.canvasDblClick.bind(this));
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

      this.canvas.removeEventListener(
         "dblclick",
         this.canvasDblClick.bind(this),
      );
   }
}
