import { config, Scale, scrollBar } from "../../../lib/utils.ts";
import { Circle, Figure, Line, Pencil, Rect, Text } from "./stylesClass.js";
import getStroke from "perfect-freehand";

const getStrokeOptions = {
  size: 5,
  // thinning: 0.5,
  // smoothing: 4,
  // streamline: 0.5,
  // easing: (t) => t,
  // simulatePressure: true,
  // last: true,
  // start: {
  //   cap: true,
  //   taper: 0,
  //   easing: (t) => t,
  // },
  // end: {
  //   cap: true,
  //   taper: 0,
  //   easing: (t) => t,
  // },
};

class RevFor {
  constructor() {
    this.recycleBin = [];
  }

  insert(value) {
    if (!value || !value.length) return;
    if (this.getLength() >= 10) {
      this.recycleBin.shift();
      this.recycleBin.push(value);
    } else {
      this.recycleBin.push(value);
    }
  }

  getLastDeleted() {
    if (!this.getLength()) return;
    return this.recycleBin.pop();
  }

  getLength() {
    return this.recycleBin.length;
  }

  getbin() {
    return this.recycleBin;
  }
}

export const recycleAndUse = new RevFor();

export default class Shapes {
  lastPoint = null;
  constructor(canvas, canvasbreakPoints, renderCanvas) {
    this.canvas = canvas;
    this.canvasbreakPoints = canvasbreakPoints;
    this.renderCanvas = renderCanvas;
    //   this.activeColor = "#2165ee";
    this.isDrawing = false;
    this.mewShapeParams = null;
    this.canvasDiv = document.getElementById("canvas-div");
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
    this.cache = new Map();
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
  }

  newShape(x, y) {
    this.lastPoint = { x, y };
    if (config.mode === "rect") {
      this.isDrawing = true;
      const newRect = new Rect(x, y);
      newRect.isActive = true;
      this.newShapeParams = newRect;
      return;
    } else if (config.mode === "sphere") {
      this.isDrawing = true;
      const newSphere = new Circle(x, y);
      newSphere.isActive = true;
      this.newShapeParams = newSphere;
      return;
    } else if (config.mode === "pencil") {
      this.isDrawing = true;
      const newPencil = new Pencil();
      this.newShapeParams = newPencil;
      return;
    } else if (config.mode === "arrowLine" && !this.newShapeParams) {
      const newarrowLine = new Line("elbow");
      newarrowLine.isActive = true;
      this.isDrawing = true;
      this.newShapeParams = newarrowLine;
      return;
    } else if (config.mode === "figure") {
      const newFigure = new Figure(x, y, `Figure ${this.figureMap.size}`);
      newFigure.isActive = false;
      this.newShapeParams = newFigure;
      this.isDrawing = true;
    } else if (config.mode === "line" && !this.newShapeParams) {
      const newLine = new Line("curve");
      newLine.isActive = true;
      this.isDrawing = true;
      this.newShapeParams = newLine;
      return;
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
      case "rect":
        adjust();
        return;
      case "sphere":
        this.newShapeParams.xRadius = Math.abs(this.newShapeParams.x - x);
        this.newShapeParams.yRadius = Math.abs(this.newShapeParams.y - y);
        return;
      case "pencil":
        if (x < this.newShapeParams.minX) {
          this.newShapeParams.minX = x;
        } else if (x > this.newShapeParams.maxX) {
          this.newShapeParams.maxX = x;
        } else if (y < this.newShapeParams.minY) {
          this.newShapeParams.minY = y;
        } else if (y > this.newShapeParams.maxY) {
          this.newShapeParams.maxY = y;
        }
        this.newShapeParams.points.push({ x, y });
        return;
      case "figure":
        adjust();
        return;
    }
  }

  insertNew(x, y) {
    if (
      this.newShapeParams &&
      this.newShapeParams.type !== "line" &&
      this.isDrawing
    ) {
      switch (this.newShapeParams?.type) {
        case "rect":
          if (this.newShapeParams.width < 10) {
            this.newShapeParams.width = 15;
          }
          if (this.newShapeParams.height < 10) {
            this.newShapeParams.height = 15;
          }
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
        case "sphere":
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
        case "pencil":
          this.pencilMap.set(this.newShapeParams.id, this.newShapeParams);
          this.lastPoint = null;
          this.isDrawing = false;
          this.drawImage();
          break;
        case "figure":
          this.figureMap.set(this.newShapeParams.id, this.newShapeParams);
          this.breakPoints.set(this.newShapeParams.id, {
            minX: this.newShapeParams.x,
            minY: this.newShapeParams.y,
            maxX: this.newShapeParams.x + this.newShapeParams.width,
            maxY: this.newShapeParams.y + this.newShapeParams.height,
          });
          this.isDrawing = false;
          config.mode = "free";
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
      config.currentActive = this.newShapeParams;
      this.draw();
      this.newShapeParams = null;
      this.lastPoint = null;
      return;
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
      this.newShapeParams = null;
      this.lastPoint = null;
      return;
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
          this.lineMap.set(this.newShapeParams.id, this.newShapeParams);
          this.isDrawing = false;
          config.mode = "free";
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

      this.draw();
      this.drawImage();
    } else if (e.key === "Delete") {
      let total = [];
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
          const bp = this.breakPoints.get(key);
          total.push({ s: rect, bp });
          this.rectMap.delete(key);
          this.breakPoints.delete(key);
        }
      });

      this.lineMap.forEach((line, key) => {
        if (line.isActive) {
          if (line.startTo) {
            const { rect, text, sphere, image } = this.getShape(line.startTo);
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
            const { rect, text, sphere, image } = this.getShape(line.endTo);

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
          total.push({ s: line, bp: null });
          total.push(line);
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
          const bp = this.breakPoints.get(key);
          total.push({ s: arc, bp });
          this.circleMap.delete(key);
          this.breakPoints.delete(key);
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
          total.push({ s: text, bp: null });
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

            const bp = this.breakPoints.get(key);
            total.push({ s: image, bp });
            this.imageMap.delete(key);
            this.breakPoints.delete(key);
          });
        }
      });

      this.pencilMap.forEach((pencil, key) => {
        if (pencil.isActive) {
          this.pencilMap.delete(key);
          total.push({ s: pencil, bp: null });
        }
      });

      recycleAndUse.insert(total);
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

    // Reset all shapes to inactive
    //   const allShapes = [
    //      ...this.rectMap.values(),
    //      ...this.circleMap.values(),
    //      ...this.textMap.values(),
    //      ...this.lineMap.values(),
    //   ];
    //   allShapes.forEach((shape) => {
    //      shape.isActive = false;
    //   });

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

  draw() {
    // Clear the canvas
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this.context.save();

    this.context.translate(
      -scrollBar.scrollPositionX,
      -scrollBar.scrollPositionY,
    );
    //   const centerX = this.canvas.width / 2;
    //   const centerY = this.canvas.height / 2;

    //   // Translate to the center, apply scaling, and then translate back
    //   this.context.translate(centerX, centerY);
    //   this.context.translate(-centerX, -centerY);
    this.context.scale(Scale.scale, Scale.scale);
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
        fontVarient,
        font,
        fontWeight,
      } = rect;

      drawDotsAndRect(x, y, width, height, this.tolerance, isActive);
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
      this.renderText(
        text,
        x,
        y,
        textSize,
        height,
        width,
        textPosition,
        fontWeight,
        fontVarient,
        font,
      );
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
      } = sphere;
      const x = sphere.x - xRadius;
      const y = sphere.y - yRadius;
      const width = 2 * xRadius;
      const height = 2 * yRadius;

      drawDotsAndRect(x, y, width, height, this.tolerance, isActive);

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
        2 * Math.PI,
      );
      this.context.fill();
      this.context.stroke();
      this.context.closePath();

      // Render text
      this.renderText(
        text,
        x,
        y,
        textSize,
        height,
        width,
        textPosition,
        fontWeight,
        fontVarient,
        font,
      );
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
      this.context.fillStyle = fillStyle;
      this.context.font = `${fontVarient} ${fontWeight} ${textSize}px ${
        font || "Arial"
      }`;

      let maxWidth = 0;
      content.forEach((c) => {
        const textMetrics = this.context.measureText(c);
        maxWidth = Math.max(maxWidth, textMetrics.width);
      });

      // Store the measured dimensions
      t.width = maxWidth;
      t.height = content.length * textSize - this.tolerance;

      let currentY = y;
      content.forEach((c) => {
        const textMetrics = this.context.measureText(c);
        this.context.fillText(
          c,
          x,
          currentY + textMetrics.actualBoundingBoxAscent,
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
      } = line;

      this.context.beginPath();
      this.context.lineWidth = lineWidth;

      if (isActive) {
        if (lineType === "curve") {
          this.context.beginPath();
          this.context.lineWidth = 0.8;
          this.context.strokeStyle = "red";
          this.context.moveTo(curvePoints[0].x, curvePoints[0].y);
          for (let i = 1; i < curvePoints.length; i++) {
            this.context.lineTo(curvePoints[i].x, curvePoints[i].y);
          }
          this.context.stroke();
          this.context.closePath();
        }

        this.context.strokeStyle = this.activeColor;

        if (!this.massiveSelection.isSelected)
          this.dots(...curvePoints, { context: this.context });
      } else {
        this.context.strokeStyle = borderColor;
      }

      const headlen = 12;

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
            headlen,
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
            headlen,
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
        const last = curvePoints.length - 1;
        this.context.moveTo(curvePoints[0].x, curvePoints[0].y);
        const t = 0.8; // Weighting factor, 0.5 for halfway, closer to 1 for closer to cp2

        for (let i = 1; i < curvePoints.length - 1; i++) {
          const cp1 = curvePoints[i];
          const cp2 = curvePoints[i + 1];
          const midPointX = (1 - t) * cp1.x + t * cp2.x;
          const midPointY = (1 - t) * cp1.y + t * cp2.y;
          this.context.quadraticCurveTo(cp1.x, cp1.y, midPointX, midPointY);
        }
        const secondToLastPoint = curvePoints[curvePoints.length - 2];
        const lastPoint = curvePoints[curvePoints.length - 1];
        const controlPointX = (1 - t) * secondToLastPoint.x + t * lastPoint.x;
        const controlPointY = (1 - t) * secondToLastPoint.y + t * lastPoint.y;

        this.context.quadraticCurveTo(
          controlPointX,
          controlPointY,
          lastPoint.x,
          lastPoint.y,
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
            headlen,
          );
        }
        if (arrowRight) {
          this.drawArrows(
            {
              x: curvePoints[last - 1].x,
              y: curvePoints[last - 1].y,
            },
            {
              x: curvePoints[last].x,
              y: curvePoints[last].y,
            },
            headlen,
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
        textPosition,
        fontWeight,
        fontVarient,
        font,
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
        ele.classList.add("z-[2]", "text-xs", "text-zinc-400");
        this.canvasDiv.append(ele);
      }

      // Update the content and position of the element
      ele.textContent = title;
      ele.style.position = "absolute";
      ele.style.top = y - 20 - scrollBar.scrollPositionY + "px";
      ele.style.left = x - scrollBar.scrollPositionX + "px";

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

      this.context.beginPath();
      this.context.strokeStyle = isActive ? this.activeColor : "grey";
      this.context.lineWidth = 0.9;
      this.context.moveTo(x + 3, y);
      this.context.arcTo(x + width, y, x + width, y + height, 3);
      this.context.arcTo(x + width, y + height, x, y + height, 3);
      this.context.arcTo(x, y + height, x, y, 3);
      this.context.arcTo(x, y, x + width, y, 3);
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
      this.renderCanvas.height,
    );
    this.renderCanvasCtx.save();
    this.renderCanvasCtx.translate(
      -scrollBar.scrollPositionX,
      -scrollBar.scrollPositionY,
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

    this.pencilMap.forEach((pencil) => {
      const { points, isActive, minX, minY, maxX, maxY } = pencil;
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
      const outline = getStroke(points, getStrokeOptions);
      const stroke = this.getSvgPathFromStroke(outline);
      this.renderCanvasCtx.beginPath();
      this.renderCanvasCtx.fillStyle = "white";
      this.renderCanvasCtx.fill(new Path2D(stroke));
      this.renderCanvasCtx.closePath();
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
    if (e.altKey || e.ctrlKey || config.mode === "handsFree") return;

    const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

    this.newShape(mouseX, mouseY);
    if (this.isDrawing || this.newShapeParams) return;

    // check if multiple selected exist
    if (
      this.massiveSelection.isSelected &&
      mouseX > this.massiveSelection.isSelectedMinX &&
      mouseX < this.massiveSelection.isSelectedMaxX &&
      mouseY > this.massiveSelection.isSelectedMinY &&
      mouseY < this.massiveSelection.isSelectedMaxY
    ) {
      this.rectMap.forEach((rect) => {
        if (rect.isActive) {
          rect.offsetX = rect.x - mouseX;
          rect.offsetY = rect.y - mouseY;
        }
      });

      this.circleMap.forEach((circle) => {
        if (circle.isActive) {
          circle.offsetX = circle.x - mouseX;
          circle.offsetY = circle.y - mouseY;
        }
      });

      this.textMap.forEach((text) => {
        if (text.isActive) {
          text.offsetX = text.x - mouseX;
          text.offsetY = text.y - mouseY;
        }
      });

      this.lineMap.forEach((line) => {
        if (line.isActive) {
          line.curvePoints.forEach((p) => {
            p.offsetX = p.x - mouseX;
            p.offsetY = p.y - mouseY;
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
      this.massiveSelection.isSelected = false;
      this.massiveSelection.isSelectedDown = false;
      this.massiveSelection.isSelectedMinX = Infinity;
      this.massiveSelection.isSelectedMinY = Infinity;
      this.massiveSelection.isSelectedMaxX = -Infinity;
      this.massiveSelection.isSelectedMaxY = -Infinity;
    }

    config.currentActive = null;
    let isResizing = false;

    //image resize
    this.imageMap.forEach((image, key) => {
      const { x, y, width, height } = image;
      // left right
      const leftEdge = mouseX >= x - this.tolerance && mouseX <= x;
      const rightEdge =
        mouseX >= x + width && mouseX <= x + width + this.tolerance;
      const verticalBounds =
        mouseY >= y + this.tolerance && mouseY <= y + height - this.tolerance;

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

    for (const [key, fig] of this.figureMap) {
      const { x, y, width, height, isActive } = fig;
      if (!isActive) continue;

      // left right
      const leftEdge = mouseX >= x - this.tolerance && mouseX <= x;
      const rightEdge =
        mouseX >= x + width && mouseX <= x + width + this.tolerance;
      const verticalBounds =
        mouseY >= y + this.tolerance && mouseY <= y + height - this.tolerance;

      if (leftEdge && verticalBounds) {
        fig.isActive = true;
        isResizing = true;
        this.isDraggingOrResizing = true;
        config.currentActive = fig;

        this.resizeElement = {
          direction: "left-edge",
          key,
          x: x + width,
        };
      } else if (rightEdge && verticalBounds) {
        fig.isActive = true;
        isResizing = true;
        config.currentActive = fig;

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
        fig.isActive = true;
        isResizing = true;
        config.currentActive = fig;

        this.resizeElement = {
          direction: "top-edge",
          key,
          y: y + height,
        };
      } else if (withinBottomEdge && withinHorizontalBounds) {
        fig.isActive = true;
        isResizing = true;
        config.currentActive = fig;

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
          config.currentActive = fig;
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
    }

    if (isResizing) return;

    // line resize
    this.lineMap.forEach((line, key) => {
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
            config.currentActive = line;
            isResizing = true;
          }
        }
      }
    });
    if (isResizing) return;

    // rect resize
    this.rectMap.forEach((rect, key) => {
      const { x, y, width, height, containerId } = rect;
      // left right
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

      const container = this.figureMap.get(containerId);

      const setActiveResizing = (resizeParams) => {
        rect.isActive = true;
        isResizing = true;
        config.currentActive = rect;
        this.resizeElement = resizeParams;
      };

      const checkAndSetActiveResizing = (resizeParams) => {
        if (container && !container.isActive) {
          console.log("hello");
          setActiveResizing(resizeParams);
        } else if (!containerId) {
          setActiveResizing(resizeParams);
        }
      };

      // resize corners
      if (leftEdge && verticalBounds) {
        checkAndSetActiveResizing({
          direction: "left-edge",
          key,
          x: x + width,
        });
      } else if (rightEdge && verticalBounds) {
        checkAndSetActiveResizing({
          direction: "right-edge",
          key,
          x: x,
        });
      } else if (withinTopEdge && withinHorizontalBounds) {
        checkAndSetActiveResizing({
          direction: "top-edge",
          key,
          y: y + height,
        });
      } else if (withinBottomEdge && withinHorizontalBounds) {
        checkAndSetActiveResizing({
          direction: "bottom-edge",
          key,
          y: y,
        });
      } else {
        rect.isActive = false;
      }

      [
        { cond: withinBottomLeftCorner, d: "bottom-left" },
        { cond: withinBottomRightCorner, d: "bottom-right" },
        { cond: withinTopLeftCorner, d: "top-left" },
        { cond: withinTopRightCorner, d: "top-right" },
      ].forEach((any) => {
        if (any.cond) {
          checkAndSetActiveResizing({
            key,
            rectMaxX: x + width,
            rectMaxY: y + height,
            direction: any.d,
            x: x,
            y: y,
            width: width,
            height: height,
          });
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
      //vertical resizing
      const topEdge = mouseY >= forYless - this.tolerance && mouseY <= forYless;
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
      } else if ((topEdge || bottomEdge) && horizontalBounds) {
        checkAndResize({ direction: "vertical", key });
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
    let smallestPencil = null;
    let smallestFig = null;

    //   image drag params
    const imageDrag = (image, key) => {
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
    };

    const checkRect = (rect, key) => {
      if (rect.isActive) rect.isActive = false;

      const isMouseInRect =
        mouseX >= rect.x &&
        mouseX <= rect.x + rect.width &&
        mouseY >= rect.y &&
        mouseY <= rect.y + rect.height;

      if (isMouseInRect) {
        if (rect.containerId) {
          const container = this.figureMap.get(rect.containerId);
          if (
            !container.isActive &&
            (smallestRect === null || rect.width < smallestRect.rect.width)
          ) {
            smallestRect = { rect, key };
          }
        } else {
          if (smallestRect === null || rect.width < smallestRect.rect.width) {
            smallestRect = { rect, key };
          }
        }
      }
    };

    const checkCircle = (sphere, key) => {
      const distance = Math.sqrt(
        (mouseX - sphere.x) ** 2 + (mouseY - sphere.y) ** 2,
      );

      if (sphere.isActive) sphere.isActive = false;
      if (distance < sphere.xRadius && distance < sphere.yRadius) {
        if (sphere.containerId) {
          const container = this.figureMap.get(sphere.containerId);
          if (!container?.isActive) {
            if (
              smallestCircle === null ||
              sphere.xRadius < smallestCircle.circle.xRadius
            ) {
              smallestCircle = { circle: sphere, key };
            }
          }
        } else {
          if (
            smallestCircle === null ||
            sphere.xRadius < smallestCircle.circle.xRadius
          ) {
            smallestCircle = { circle: sphere, key };
          }
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
      const { curvePoints, lineType } = l;

      if (lineType === "elbow") {
        let midPointX = (curvePoints[0].x + curvePoints[1].x) / 2;

        let firstPart =
          mouseX >
            Math.min(
              curvePoints[0].x - this.tolerance,
              midPointX - this.tolerance,
            ) &&
          mouseX <
            Math.max(
              midPointX + this.tolerance,
              curvePoints[0].x + this.tolerance,
            ) &&
          mouseY > curvePoints[0].y - this.tolerance &&
          mouseY < curvePoints[0].y + this.tolerance;
        let secondPart =
          mouseX > midPointX - this.tolerance &&
          mouseX < midPointX + this.tolerance &&
          mouseY > curvePoints[0].y - this.tolerance &&
          mouseY < curvePoints[1].y + this.tolerance;
        let lastPart =
          mouseX >
            Math.min(
              midPointX - this.tolerance,
              curvePoints[1].x - this.tolerance,
            ) &&
          mouseX <
            Math.max(
              midPointX + this.tolerance,
              curvePoints[1].x + this.tolerance,
            ) &&
          mouseY > curvePoints[1].y - this.tolerance &&
          mouseY < curvePoints[1].y + this.tolerance;

        if (firstPart || secondPart || lastPart) {
          if (l.containerId) {
            const container = this.figureMap.get(l.containerId);
            if (container && !container.isActive) {
              line = { l, key };
            }
          } else if (!l.containerId) {
            line = { l, key };
          }
        } else {
          l.isActive = false;
        }
      } else {
        const width = l.maxX - l.minX;
        let horizontelParams = width < 5 ? -this.tolerance : +this.tolerance;
        let verticalParams =
          l.maxY - l.minY < 5 ? -this.tolerance : +this.tolerance;
        const mouseInSphere =
          mouseX >= l.minX + horizontelParams &&
          mouseX <= l.maxX - horizontelParams &&
          mouseY >= l.minY + verticalParams &&
          mouseY <= l.maxY - verticalParams;
        if (l.isActive) l.isActive = false;
        if (mouseInSphere) {
          if (l.containerId) {
            const container = this.figureMap.get(l.containerId);
            if (
              !container.isActive &&
              (line === null || line.l.maxX - line.l.minX > width)
            ) {
              line = { l, key };
            }
          } else {
            if (line === null || line.l.maxX - line.l.minX > width) {
              line = { l, key };
            }
          }
        }
      }
    };

    const pencilDrag = (pencil, key) => {
      const { minX, maxX, minY, maxY } = pencil;
      if (mouseX > minX && mouseX < maxX && mouseY > minY && mouseY < maxY) {
        if (
          smallestPencil == null ||
          smallestPencil.maxX - smallestPencil.minY > maxX - minX
        ) {
          smallestPencil = { pencil, key };
        }
      } else {
        pencil.isActive = false;
      }
    };

    this.rectMap.forEach(checkRect);
    this.circleMap.forEach(checkCircle);
    this.textMap.forEach(checkText);
    this.lineMap.forEach(simpleLine);
    this.imageMap.forEach(imageDrag);
    this.pencilMap.forEach(pencilDrag);

    for (const [key, fig] of this.figureMap) {
      const { isActive, x, y, width, height } = fig;
      if (!isActive) continue;
      if (
        mouseX >= x &&
        mouseX < x + width &&
        mouseY > y &&
        mouseY < y + width
      ) {
        if (smallestFig === null || smallestFig.width > width) {
          smallestFig = { fig, key };
        }
      }
    }

    // giving priority to image over shapes
    if (smallestImage?.key) {
      const img = new Image();
      img.src = smallestImage.image.src;
      img.style.borderRadius = smallestImage.image.radius + "px";

      smallestImage.image.offsetX = mouseX - smallestImage.image.x;
      smallestImage.image.offsetY = mouseY - smallestImage.image.y;
      smallestImage.image.isActive = true;
      this.dragElement = { src: img, key: smallestImage.key };

      config.currentActive = smallestImage?.image;
      this.draw();
      this.drawImage();
      return;
    }

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
      (!smallestText || smallestRect?.rect.width < smallestText?.text.width) &&
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
        config.currentActive = line.l;
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
    } else if (
      smallestPencil &&
      (!smallestRect ||
        smallestRect.rect.width >
          smallestPencil.pencil.maxX - smallestPencil.pencil.minX) &&
      (!smallestCircle ||
        smallestCircle.circle.xRadius * 2 >
          smallestPencil.pencil.maxX - smallestPencil.pencil.minX)
    ) {
      const { minX, maxX, minY, maxY } = smallestPencil.pencil;
      smallestPencil.pencil.isActive = true;
      smallestPencil.pencil.offsetX = minX - mouseX;
      smallestPencil.pencil.offsetY = minY - mouseY;
      smallestPencil.pencil.width = maxX - minX;
      smallestPencil.pencil.height = maxY - minY;

      smallestPencil.pencil.points.forEach((point) => {
        point.offsetX = point.x - mouseX;
        point.offsetY = point.y - mouseY;
      });
      this.dragElement = smallestPencil.key;
      config.currentActive = smallestPencil.pencil;
    } else if (
      smallestFig?.key &&
      (!smallestRect || smallestRect.rect.width > smallestFig.fig.width)
    ) {
      this.dragElement = smallestFig.key;
      config.currentActive = smallestFig.fig;
      smallestFig.fig.offsetX = mouseX - smallestFig.fig.x;
      smallestFig.fig.offsetY = mouseY - smallestFig.fig.y;

      this.rectMap.forEach((rect) => {
        if (rect.containerId === smallestFig.key) {
          rect.offsetX = mouseX - rect.x;
          rect.offsetY = mouseY - rect.y;
        }
      });
      this.circleMap.forEach((circle) => {
        if (circle.containerId === smallestFig.key) {
          circle.offsetX = mouseX - circle.x;
          circle.offsetY = mouseY - circle.y;
        }
      });
      this.lineMap.forEach((line) => {
        if (line.containerId === smallestFig.key) {
          line.offsetX = mouseX - line.minX;
          line.offsetY = mouseY - line.minY;
          line.width = line.maxX - line.minX;
          line.height = line.maxY - line.minY;
          line.curvePoints.forEach((point) => {
            point.offsetX = point.x - mouseX;
            point.offsetY = point.y - mouseY;
          });
        }
      });
      this.draw();
      return;
    }

    // for massSelection
    if (!this.dragElement && !this.resizeElement && config.mode === "free") {
      this.massiveSelection.isDown = true;
      this.massiveSelection.startX = mouseX;
      this.massiveSelection.startY = mouseY;
    }

    this.draw();
    this.drawImage();
  }

  mouseDownForFif(e) {
    const { x: mouseX, y: mouseY } = this.getTransformedMouseCoords(e);

    for (const [key, value] of this.figureMap) {
      const { id, isActive, x, y, width, height } = value;
      const element = document.querySelector(`[data-containerId="${id}"]`);

      // Check if the click happened inside any of the elements
      if (this.massiveSelection.isSelected) return;
      if (element.contains(e.target)) {
        if (config.currentActive) config.currentActive.isActive = false;
        config.currentActive = value;
        value.isActive = true;
      } else if (
        isActive &&
        mouseX >= x - this.tolerance &&
        mouseX <= x + width + this.tolerance &&
        mouseY >= y - this.tolerance &&
        mouseY <= y + height + this.tolerance
      ) {
        value.isActive = true;
      } else value.isActive = false;
    }

    // Re-render the figures
    this.draw();
  }

  updateCurvePoint(object, x, y, index) {
    object.curvePoints[index].x = x;
    object.curvePoints[index].y = y;
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
    const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
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
                  const { x, y } = this.getClosestPointOnSphere(object, {
                    x: curvePoints[1].x,
                    y: curvePoints[1].y,
                  });
                  this.updateCurvePoint(l, x, y, 0);
                } else {
                  const { x, y } = this.getClosestPoints(object, {
                    x: curvePoints[1].x,
                    y: curvePoints[1].y,
                  });
                  this.updateCurvePoint(l, x, y, 0);
                }

                if (r) {
                  const { x, y } = this.getClosestPoints(r, {
                    x: curvePoints[last - 1].x,
                    y: curvePoints[last - 1].y,
                  });

                  this.updateCurvePoint(l, x, y, last);
                } else if (t) {
                  const { x, y } = this.getClosestPoints(t, {
                    x: curvePoints[last - 1].x,
                    y: curvePoints[last - 1].y,
                  });
                  this.updateCurvePoint(l, x, y, last);
                } else if (s) {
                  const { x, y } = this.getClosestPointOnSphere(s, {
                    x: curvePoints[last - 1].x,
                    y: curvePoints[last - 1].y,
                  });
                  this.updateCurvePoint(l, x, y, last);
                } else if (i) {
                  const { x, y } = this.getClosestPoints(i, {
                    x: curvePoints[last - 1].x,
                    y: curvePoints[last - 1].y,
                  });
                  this.updateCurvePoint(l, x, y, last);
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
                  const { x, y } = this.getClosestPointOnSphere(object, {
                    x: curvePoints[last - 1].x,
                    y: curvePoints[last - 1].y,
                  });
                  this.updateCurvePoint(l, x, y, last);
                } else {
                  const { x, y } = this.getClosestPoints(
                    {
                      x: object.x,
                      y: object.y,
                      width: object.width,
                      height: object.height,
                    },
                    {
                      x: curvePoints[last - 1].x,
                      y: curvePoints[last - 1].y,
                    },
                  );
                  this.updateCurvePoint(l, x, y, last);
                }

                if (r) {
                  const { x, y } = this.getClosestPoints(r, {
                    x: curvePoints[1].x,
                    y: curvePoints[1].y,
                  });
                  this.updateCurvePoint(l, x, y, 0);
                } else if (t) {
                  const { x, y } = this.getClosestPoints(t, {
                    x: curvePoints[1].x,
                    y: curvePoints[1].y,
                  });
                  this.updateCurvePoint(l, x, y, 0);
                } else if (s) {
                  const { x, y } = this.getClosestPointOnSphere(s, {
                    x: curvePoints[1].x,
                    y: curvePoints[1].y,
                  });
                  this.updateCurvePoint(l, x, y, 0);
                } else if (i) {
                  const { x, y } = this.getClosestPoints(i, {
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
    if (shape !== "pencil") {
      this.breakPointsCtx.clearRect(
        0,
        0,
        this.canvasbreakPoints.width,
        this.canvasbreakPoints.height,
      );
    }
    this.breakPointsCtx.save();
    this.breakPointsCtx.scale(Scale.scale, Scale.scale);
    this.breakPointsCtx.translate(
      -scrollBar.scrollPositionX,
      -scrollBar.scrollPositionY,
    );
    this.breakPointsCtx.beginPath();
    this.breakPointsCtx.strokeStyle = "grey";
    this.breakPointsCtx.lineWidth = 1;
    switch (shape) {
      case "rect":
        this.breakPointsCtx.moveTo(obj.x + obj.radius, obj.y);
        this.breakPointsCtx.arcTo(
          obj.x + obj.width,
          obj.y,
          obj.x + obj.width,
          obj.y + obj.height,
          obj.radius,
        );
        this.breakPointsCtx.arcTo(
          obj.x + obj.width,
          obj.y + obj.height,
          obj.x,
          obj.y + obj.height,
          obj.radius,
        );
        this.breakPointsCtx.arcTo(
          obj.x,
          obj.y + obj.height,
          obj.x,
          obj.y,
          obj.radius,
        );
        this.breakPointsCtx.arcTo(
          obj.x,
          obj.y,
          obj.x + obj.width,
          obj.y,
          obj.radius,
        );
        break;
      case "sphere":
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
      case "pencil":
        const outlinePath = getStroke([this.lastPoint], getStrokeOptions);
        const stroke = this.getSvgPathFromStroke(outlinePath);
        const path = new Path2D(stroke);

        this.breakPointsCtx.fillStyle = "white";
        this.breakPointsCtx.fill(path);

        this.lastPoint = { x, y };
        break;
      case "line":
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
          this.breakPointsCtx.arcTo(mid.x, first.y, mid.x, mid.y, obj.radius);
          // Draw the second arc: From mid horizontally to mid vertically aligned with last
          this.breakPointsCtx.arcTo(mid.x, last.y, last.x, last.y, obj.radius);
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
          this.breakPointsCtx.moveTo(
            obj.curvePoints[0].x,
            obj.curvePoints[0].y,
          );

          // Draw the curve through all the points
          for (let i = 0; i < obj.curvePoints.length - 1; i++) {
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
      case "figure":
        this.breakPointsCtx.rect(obj.x, obj.y, obj.width, obj.height);
        break;
      default:
        break;
    }

    this.breakPointsCtx.stroke();
    this.breakPointsCtx.closePath();
    this.breakPointsCtx.restore();
  }

  mouseMove(e) {
    //   if (config.mode === "pencil") return;
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

      // Apply transformations
      this.breakPointsCtx.translate(
        -scrollBar.scrollPositionX,
        -scrollBar.scrollPositionY,
      );
      this.breakPointsCtx.scale(Scale.scale, Scale.scale);

      // Set fill style and draw the rectangle
      this.breakPointsCtx.fillStyle = "#00f7ff17";
      this.breakPointsCtx.beginPath(); // Begin a new path to avoid unwanted drawing
      this.breakPointsCtx.rect(x, y, width, height);
      this.breakPointsCtx.fill();
      this.breakPointsCtx.restore();

      this.rectMap.forEach((rect) => {
        if (
          rect.x > x &&
          rect.x + rect.width < x + width &&
          rect.y > y &&
          rect.y + rect.height < y + height
        ) {
          rect.isActive = true;
        } else {
          rect.isActive = false;
        }
      });

      this.draw();
    }

    if (!this.resizeElement && !this.dragElement) return;

    const squareResize = (shape) => {
      if (this.resizeElement.direction === "left-edge") {
        const { x } = this.resizeElement;
        if (mouseX < x) {
          shape.x = mouseX;
          shape.width = x - mouseX;
        } else if (mouseX > x) {
          shape.x = x;
          shape.width = mouseX - x;
        }
      } else if (this.resizeElement.direction === "right-edge") {
        const { x } = this.resizeElement;
        if (mouseX > x) {
          shape.width = mouseX - x;
        } else if (mouseX < x) {
          shape.x = mouseX;
          shape.width = x - mouseX;
        }
      } else if (this.resizeElement.direction === "top-edge") {
        const { y } = this.resizeElement;
        if (mouseY < y) {
          shape.y = mouseY;
          shape.height = y - mouseY;
        } else if (mouseY > y) {
          shape.y = y;
          shape.height = mouseY - y;
        }
      } else if (this.resizeElement.direction === "bottom-edge") {
        const { y } = this.resizeElement;
        if (mouseY > y) {
          shape.height = mouseY - y;
        } else if (mouseY < y) {
          shape.y = mouseY;
          shape.height = y - mouseY;
        }
      } else {
        const direction = this.resizeElement.direction;
        let { rectMaxX, rectMaxY, x, y, height, width } = this.resizeElement;

        switch (direction) {
          case "top-left":
            shape.x = Math.min(mouseX, rectMaxX);
            shape.y = Math.min(mouseY, rectMaxY);
            shape.width = Math.abs(rectMaxX - mouseX);
            shape.height = Math.abs(rectMaxY - mouseY);
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

    let rectResize = this.rectMap.get(this.resizeElement?.key);
    let circleResize = this.circleMap.get(this.resizeElement?.key);
    let textResize = this.textMap.get(this.resizeElement?.key);
    let lineResize = this.lineMap.get(this.resizeElement?.key);
    let imageResize = this.imageMap.get(this.resizeElement?.key);
    let figResize = this.figureMap.get(this.resizeElement?.key);

    if (rectResize) {
      squareResize(rectResize);
      this.updateLinesPointTo(rectResize);
    } else if (imageResize) {
      squareResize(imageResize);
      this.updateLinesPointTo(imageResize);
      const { x, y, width, height, isActive } = imageResize;
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
          { x: x + width + this.tolerance, y: y - this.tolerance },
          {
            x: x + width + this.tolerance,
            y: y + height + this.tolerance,
          },
          { x: x - this.tolerance, y: y + height + this.tolerance },
          { context: this.breakPointsCtx },
        );

        this.breakPointsCtx.strokeStyle = this.activeColor;
        this.breakPointsCtx.rect(
          x - this.tolerance,
          y - this.tolerance,
          width + 2 * this.tolerance,
          height + 2 * this.tolerance,
        );
        this.breakPointsCtx.stroke();
      }
      this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      this.breakPointsCtx.drawImage(
        this.resizeElement?.img,
        x,
        y,
        width,
        height,
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
      if (mouseX > textResize.x && mouseY > textResize.y) {
        textResize.textSize =
          Math.max(
            12, // Minimum size to prevent text from becoming too small
            (mouseX - textResize.x) * 0.3 + (mouseY - textResize.y) * 0.5,
          ) * 0.5;
      }

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
        lineResize.curvePoints[lineResize.curvePoints.length - 1].x = mouseX;
        if (Math.abs(lineResize.curvePoints[0].y - mouseY) <= 10) {
          lineResize.curvePoints[lineResize.curvePoints.length - 1].y =
            lineResize.curvePoints[0].y;
        } else
          lineResize.curvePoints[lineResize.curvePoints.length - 1].y = mouseY;
        this.lineConnectParams(mouseX, mouseY);
        this.updateLineMinMax(this.resizeElement?.key);
      }
    } else if (figResize) {
      squareResize(figResize);
      for (const [_, rect] of this.rectMap) {
        if (
          rect.x > figResize.x &&
          rect.x + rect.width < figResize.x + figResize.width &&
          rect.y > figResize.y &&
          rect.t + rect.height < figResize.y + figResize.height
        ) {
          rect.containerId = this.resizeElement?.key;
          rect.isActive = true;
        } else {
          rect.containerId = null;
        }
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
    let pencilDrag = this.pencilMap.get(this.dragElement);
    let figDrag = this.figureMap.get(this.dragElement);

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
        rect,
      );
      //  this.drawRenderCanvas(rect.type, rect);

      this.updateLinesPointTo(rect);
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
        arc,
      );
      //  this.drawRenderCanvas(arc.type, arc);

      this.updateLinesPointTo(arc);
    } else if (text) {
      text.x = mouseX - text.offsetX;
      text.y = mouseY - text.offsetY;
      this.showGuides(
        text.x,
        text.y,
        text.width,
        text.height,
        this.dragElement,
        text,
      );

      //  this.drawRenderCanvas("text", text);
      this.updateLinesPointTo(text);
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
          line,
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
          { x: x + width + this.tolerance, y: y - this.tolerance },
          {
            x: x + width + this.tolerance,
            y: y + height + this.tolerance,
          },
          { x: x - this.tolerance, y: y + height + this.tolerance },
          { context: this.breakPointsCtx },
        );

        this.breakPointsCtx.strokeStyle = this.activeColor;
        this.breakPointsCtx.rect(
          x - this.tolerance,
          y - this.tolerance,
          width + 2 * this.tolerance,
          height + 2 * this.tolerance,
        );
        this.breakPointsCtx.stroke();
      }

      this.breakPointsCtx.scale(Scale.scale, Scale.scale);
      this.breakPointsCtx.drawImage(this.dragElement?.src, x, y, width, height);
      this.breakPointsCtx.restore();
    } else if (pencilDrag) {
      pencilDrag.minX = mouseX + pencilDrag.offsetX;
      pencilDrag.minY = mouseY + pencilDrag.offsetY;
      pencilDrag.maxY = pencilDrag.minY + pencilDrag.height;
      pencilDrag.maxX = pencilDrag.minX + pencilDrag.width;

      pencilDrag.points.forEach((point) => {
        point.x = mouseX + point.offsetX;
        point.y = mouseY + point.offsetY;
      });
      this.drawImage();
      this.showGuides(
        pencilDrag.minX,
        pencilDrag.minY,
        pencilDrag.maxX - pencilDrag.minX,
        pencilDrag.maxY - pencilDrag.minY,
        this.dragElement,
        pencilDrag,
      );
      return;
    } else if (figDrag) {
      figDrag.x = mouseX - figDrag.offsetX;
      figDrag.y = mouseY - figDrag.offsetY;

      this.rectMap.forEach((rect) => {
        if (rect.containerId === this.dragElement) {
          rect.x = mouseX - rect.offsetX;
          rect.y = mouseY - rect.offsetY;
          if (rect.pointTo.length > 0) {
            this.updateLinesPointTo(rect);
          }
        }
      });

      this.circleMap.forEach((circle) => {
        if (circle.containerId === this.dragElement) {
          circle.x = mouseX - circle.offsetX;
          circle.y = mouseY - circle.offsetY;
          if (circle.pointTo.length > 0) {
            this.updateLinesPointTo(circle);
          }
        }
      });

      this.lineMap.forEach((line) => {
        if (line.containerId === this.dragElement) {
          line.minX = mouseX - line.offsetX;
          line.minY = mouseY - line.offsetY;
          line.maxX = line.maxX + line.width;
          line.maxX = line.maxX + line.height;
          line.curvePoints.forEach((point) => {
            point.x = mouseX + point.offsetX;
            point.y = mouseY + point.offsetY;
          });
        }
      });
    }
    this.draw();
  }

  mouseUp(e) {
    if (config.mode === "handsFree") return;

    this.insertNew();

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
        if (x > minX && x + width < maxX && y > minY && y + height < maxY) {
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
          x - xRadius > minX &&
          x + xRadius < maxX &&
          y - yRadius > minY &&
          y + yRadius < maxY
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
          text.x > minX &&
          text.x + text.width < maxX &&
          text.y > minY &&
          text.y + text.height < maxY
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
        if (x > minX && width < maxX && y > minY && height < maxY) {
          if (!this.massiveSelection.isSelected) {
            this.massiveSelection.isSelected = true;
          }
          this.adjustMassiveSelectionXandY(x, y, width - x, height - y);
          line.isActive = true;
        }
      });

      this.figureMap.forEach((fig) => {
        const { x, y, width, height } = fig;
        if (x > minX && x + width < maxX && y > minY && y + height < maxY) {
          if (!this.massiveSelection.isSelected) {
            this.massiveSelection.isSelected = true;
          }
          this.adjustMassiveSelectionXandY(x, y, width, height);
          fig.isActive = true;
        }
      });

      this.pencilMap.forEach((pencil) => {
        const { minX: x, maxX: width, minY: y, maxY: height } = pencil;
        if (x > minY && width < maxX && y > minY && height < maxY) {
          if (!this.massiveSelection.isSelected) {
            this.massiveSelection.isSelected = true;
          }
          this.adjustMassiveSelectionXandY(x, y, width - x, height - y);
          pencil.isActive = true;
        }
      });

      this.imageMap.forEach((image) => {
        const { x, y, width, height } = image;
        if (x > minX && x + width < maxX && y > minY && y + height < maxY) {
          if (!this.massiveSelection.isSelected) {
            this.massiveSelection.isSelected = true;
          }
          this.adjustMassiveSelectionXandY(x, y, width, height);
          image.isActive = true;
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

    if (!this.resizeElement && !this.dragElement) return;
    this.breakPointsCtx.clearRect(
      0,
      0,
      this.canvasbreakPoints.width,
      this.canvasbreakPoints.height,
    );

    const rect = this.rectMap.get(this.resizeElement?.key);
    const line = this.lineMap.get(this.resizeElement?.key);
    const sphere = this.circleMap.get(this.resizeElement?.key);
    const imageResize = this.imageMap.get(this.resizeElement?.key);
    const figResize = this.figureMap.get(this.resizeElement?.key);

    if (rect) {
      rect.isActive = true;
      const { x, y, width, height } = rect;
      if (height < 20) rect.height = 25;
      if (width < 20) rect.width = 25;
      if (this.resizeElement?.key)
        this.updateGuides(this.resizeElement.key, x, y, x + width, y + height);
    } else if (imageResize) {
      imageResize.isActive = true;
      this.breakPointsCtx.clearRect(
        0,
        0,
        this.canvasbreakPoints.width,
        this.canvasbreakPoints.height,
      );
      this.drawImage();
      this.resizeElement = null;
      return;
    } else if (line) {
      const key = this.resizeElement.key;
      if (this.resizeElement.direction === "resizeStart") {
        if (line.startTo) {
          const { rect, sphere, text, image } = this.getShape(line.startTo);

          if (rect && rect.pointTo.length > 0) {
            if (
              line.curvePoints[0].x < rect.x ||
              line.curvePoints[0].x > rect.x + rect.width ||
              line.curvePoints[0].y < rect.y ||
              line.curvePoints[0].y > rect.y + rect.height
            ) {
              rect.pointTo = rect.pointTo.filter((r) => r !== key);
              line.startTo = null;
            }
          }

          if (sphere && sphere.pointTo.length > 0) {
            const distance = Math.sqrt(
              (line.curvePoints[0].x - sphere.x) ** 2 -
                (line.curvePoints[0].y - sphere.y) ** 2,
            );
            if (distance > sphere.xRadius || distance > sphere.yRadius) {
              sphere.pointTo = sphere.pointTo.filter((s) => s !== key);
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
              text.pointTo = text.pointTo.filter((r) => {
                return r !== key;
              });
              line.startTo = null;
            }
          }

          if (image && image.length > 0) {
            if (
              line.curvePoints[0].x < image.x ||
              line.curvePoints[0].x > image.x + image.width ||
              line.curvePoints[0].y < image.y ||
              line.curvePoints[0].y > image.y + image.height
            ) {
              image.pointTo = image.pointTo.filter((p) => p !== key);
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
          const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);

          if (
            Math.abs(distance - xRadius) <= this.tolerance &&
            Math.abs(distance - yRadius) <= this.tolerance
          ) {
            if (circle.pointTo.includes(key) || circleKey === line.endTo) {
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
            if (text.pointTo.includes(key) || textKey === line.endTo) return;
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
          const { rect, sphere, text, image } = this.getShape(line.endTo);
          if (rect && rect.pointTo.length > 0) {
            if (
              line.curvePoints[length].x < rect.x ||
              line.curvePoints[length].x > rect.x + rect.width ||
              line.curvePoints[length].y < rect.y ||
              line.curvePoints[length].y > rect.y + rect.height
            ) {
              rect.pointTo = rect.pointTo.filter((r) => {
                return r !== key;
              });
              line.endTo = null;
            }
          }

          if (sphere && sphere.pointTo.length > 0) {
            const distance = Math.sqrt(
              (line.curvePoints[length].x - sphere.x) ** 2 -
                (line.curvePoints[length].y - sphere.y) ** 2,
            );
            if (distance > sphere.xRadius || distance > sphere.yRadius) {
              sphere.pointTo = sphere.pointTo.filter((s) => s !== key);
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
              text.pointTo = text.pointTo.filter((r) => {
                return r !== key;
              });
              line.endTo = null;
            }
          }

          if (image && image.length > 0) {
            if (
              line.curvePoints[length].x < image.x ||
              line.curvePoints[length].x > image.x + image.width ||
              line.curvePoints[length].y < image.y ||
              line.curvePoints[length].y > image.y + image.height
            ) {
              image.pointTo = image.pointTo.filter((p) => p !== key);
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
          const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);

          if (
            Math.abs(distance - xRadius) <= this.tolerance &&
            Math.abs(distance - yRadius) <= this.tolerance
          ) {
            if (pointTo.includes(key) || circleKey === line.startTo) return;
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
            if (text.pointTo.includes(key) || textKey === line.startTo) return;
            text.pointTo.push(key);
            line.endTo = textKey;
          }
        });

        this.imageMap.forEach((img, imgKey) => {
          if (this.squareLineParams(img, mouseX, mouseY)) {
            if (line.startTo === imgKey || img.pointTo.includes(key)) return;
            img.pointTo = img.pointTo.push(key);
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
          sphere.y + sphere.yRadius,
        );
      }
    } else if (figResize) {
      const { x, y, width, height } = figResize;
      this.getShapesInsideFigure(figResize, this.resizeElement?.key);

      this.updateGuides(figResize.id, x, y, x + width, y + height);
    }

    const rectDrag = this.rectMap.get(this.dragElement);
    const arcDrag = this.circleMap.get(this.dragElement);
    const lineDrag = this.lineMap.get(this.dragElement);
    const textDrag = this.textMap.get(this.dragElement);
    const image = this.imageMap.get(this.dragElement?.key);
    const figDrag = this.figureMap.get(this.dragElement);

    if (rectDrag) {
      this.updateGuides(
        this.dragElement,
        rectDrag.x,
        rectDrag.y,
        rectDrag.x + rectDrag.width,
        rectDrag.y + rectDrag.height,
      );

      if (rectDrag.pointTo?.length > 0) {
        rectDrag.pointTo.forEach((l) => {
          this.updateLineMinMax(l);
        });
      }
      this.checkShapeIfInContainer(
        rectDrag.x,
        rectDrag.y,
        rectDrag.width,
        rectDrag.height,
        rectDrag,
      );
    } else if (arcDrag) {
      this.updateGuides(
        this.dragElement,
        arcDrag.x - arcDrag.xRadius,
        arcDrag.y - arcDrag.yRadius,
        arcDrag.x + arcDrag.xRadius,
        arcDrag.y + arcDrag.yRadius,
      );
      if (arcDrag.pointTo?.length > 0) {
        arcDrag.pointTo.forEach((l) => {
          this.updateLineMinMax(l);
        });
      }
      this.checkShapeIfInContainer(
        arcDrag.x - arcDrag.xRadius,
        arcDrag.y - arcDrag.yRadius,
        2 * arcDrag.xRadius,
        2 * arcDrag.yRadius,
        arcDrag,
      );
    } else if (lineDrag) {
      this.updateLineMinMax(this.dragElement);
      lineDrag.isActive = true;
      this.checkShapeIfInContainer(
        lineDrag.minX,
        lineDrag.minY,
        lineDrag.maxX - lineDrag.minX,
        lineDrag.maxY - lineDrag.minY,
        lineDrag,
      );
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
        image.y + image.height,
      );
      this.dragElement = null;
      this.breakPointsCtx.clearRect(
        0,
        0,
        this.canvasbreakPoints.width,
        this.canvasbreakPoints.height,
      );

      this.drawImage();
      if (image.pointTo.length > 0) this.draw();
      return;
    } else if (figDrag) {
      const { x, id, y, width, height } = figDrag;
      this.getShapesInsideFigure(figDrag, this.dragElement);
      this.updateGuides(id, x, y, x + width, y + height);
    }

    this.resizeElement = null;
    this.dragElement = null;
    this.draw();
    //   this.drawImage();
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
      } else {
        obj.containerId = null;
      }
    }
  }

  getShapesInsideFigure(figObj, key) {
    const { x, y, width, height } = figObj;

    for (const [_, rect] of this.rectMap) {
      if (
        rect.x > x &&
        rect.x + rect.width < x + width &&
        rect.y > y &&
        rect.y + rect.height < y + height
      ) {
        rect.containerId = key;
        break;
      }
    }

    for (const [_, circle] of this.circleMap) {
      if (
        circle.x - circle.xRadius > x &&
        circle.x + circle.xRadius < x + width &&
        circle.y - circle.yRadius > y &&
        circle.y + circle.yRadius < y + height
      ) {
        circle.containerId = key;
      }
    }

    for (const [_, line] of this.lineMap) {
      if (
        line.minX > x &&
        line.maxX < x + width &&
        line.minY > y &&
        line.maxY < y + height
      ) {
        line.containerId = key;
        break;
      }
    }
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
    this.breakPointsCtx.translate(
      -scrollBar.scrollPositionX,
      -scrollBar.scrollPositionY,
    );
    this.breakPointsCtx.scale(Scale.scale, Scale.scale);

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
    this.renderCanvasCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
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
        this.renderCanvasCtx.arcTo(x + width, y, x + width, y + height, radius);
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
              this.context.lineTo(lastPoint.x - headlen, lastPoint.y - 5);
              this.context.stroke();
              this.context.closePath();

              // Draw the second side of the arrowhead
              this.context.beginPath();
              this.context.moveTo(lastPoint.x, lastPoint.y);
              this.context.lineTo(lastPoint.x - headlen, lastPoint.y + 5);
            } else {
              // Draw the first side of the arrowhead
              this.context.moveTo(lastPoint.x, lastPoint.y);
              this.context.lineTo(lastPoint.x + headlen, lastPoint.y - 5);
              this.context.stroke();
              this.context.closePath();

              // Draw the second side of the arrowhead
              this.context.beginPath();
              this.context.moveTo(lastPoint.x, lastPoint.y);
              this.context.lineTo(lastPoint.x + headlen, lastPoint.y + 5);
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
            this.context.quadraticCurveTo(cp1.x, cp1.y, midPointX, midPointY);
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
    this.breakPointsCtx.translate(
      -scrollBar.scrollPositionX,
      -scrollBar.scrollPositionY,
    );
    this.breakPointsCtx.scale(Scale.scale, Scale.scale);
    this.breakPointsCtx.lineWidth = 0.8;
    this.breakPointsCtx.strokeStyle = "red";

    // Variable to track if a guide is drawn
    let guideDrawn = false;
    this.breakPointsCtx.beginPath();

    for (let [pointKey, point] of this.breakPoints) {
      if (key !== pointKey) {
        if (Math.abs(point.minX - x) <= this.tolerance) {
          object.x =
            object.type === "sphere" ? point.minX + object.xRadius : point.minX;

          this.breakPointsCtx.moveTo(point.minX, y);
          this.breakPointsCtx.lineTo(point.minX, point.minY);
          guideDrawn = true;
        } else if (Math.abs(point.maxX - x) <= this.tolerance) {
          object.x =
            object.type === "sphere" ? point.maxX + object.xRadius : point.maxX;

          this.breakPointsCtx.moveTo(point.maxX, y);
          this.breakPointsCtx.lineTo(point.maxX, point.minY);
          guideDrawn = true;
        } else if (Math.abs(point.minY - y) <= this.tolerance) {
          object.y =
            object.type === "sphere" ? point.minY + object.yRadius : point.minY;

          this.breakPointsCtx.moveTo(point.minX, point.minY);
          this.breakPointsCtx.lineTo(x, point.minY);
          guideDrawn = true;
        } else if (Math.abs(point.maxY - y) <= this.tolerance) {
          object.y =
            object.type === "sphere" ? point.maxY + object.yRadius : point.maxY;
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
    const adjust = this.breakPoints.get(key);
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
      this.canvasbreakPoints.width,
      this.canvasbreakPoints.height,
    );

    this.breakPointsCtx.save();
    this.breakPointsCtx.translate(
      -scrollBar.scrollPositionX,
      -scrollBar.scrollPositionY,
    );
    this.breakPointsCtx.scale(Scale.scale, Scale.scale);
    this.breakPointsCtx.beginPath();
    const padding = this.tolerance; // padding
    this.breakPointsCtx.lineWidth = padding;
    this.breakPointsCtx.strokeStyle = this.activeColor;

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
        5,
      );

      // Bottom-right corner
      this.breakPointsCtx.arcTo(
        x + width + padding,
        y + height + padding,
        x + width + padding - 5,
        y + height + padding,
        5,
      );

      // Bottom-left corner
      this.breakPointsCtx.arcTo(
        x - padding,
        y + height + padding,
        x - padding,
        y + height + padding - 5,
        5,
      );

      // Top-left corner to close the path
      this.breakPointsCtx.arcTo(
        x - padding,
        y - padding,
        x - padding + 5,
        y - padding,
        5,
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
          this.canvasbreakPoints.width,
          this.canvasbreakPoints.height,
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
          false,
        );
        this.breakPointsCtx.closePath();
      } else {
        this.breakPointsCtx.clearRect(
          0,
          0,
          this.canvasbreakPoints.width,
          this.canvasbreakPoints.height,
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
          5,
        );

        // Bottom-right corner
        this.breakPointsCtx.arcTo(
          x + width + padding,
          y + height + padding,
          x + width + padding - 5,
          y + height + padding,
          5,
        );

        // Bottom-left corner
        this.breakPointsCtx.arcTo(
          x - padding,
          y + height + padding,
          x - padding,
          y + height + padding - 5,
          5,
        );

        // Top-left corner to close the path
        this.breakPointsCtx.arcTo(
          x - padding,
          y - padding,
          x - padding + 5,
          y - padding,
          5,
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
          this.canvasbreakPoints.width,
          this.canvasbreakPoints.height,
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
        const newShape = new Rect(
          current.x,
          current.y,
          current.width,
          current.height,
          current.text,
          current.textSize,
          true,
        );
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
        const { x: moveX, y: moveY } = this.getTransformedMouseCoords(event);
        if (moveX > x) {
          scrollBar.scrollPositionX = scrollBar.scrollPositionX - (moveX - x);
        } else {
          scrollBar.scrollPositionX = scrollBar.scrollPositionX + (x - moveX);
        }

        if (moveY > y) {
          scrollBar.scrollPositionY = scrollBar.scrollPositionY - (moveY - y);
        } else {
          scrollBar.scrollPositionY = scrollBar.scrollPositionY + (y - moveY);
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
            true,
          );
          this.rectMap.set(newRect.id, newRect);
          this.breakPoints.set(newRect.id, {
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
            false,
          );
          this.circleMap.set(newSphere.id, newSphere);
          this.breakPoints.set(newSphere.id, {
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
            true,
          );
          this.textMap.set(newText.id, newText);
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
            true,
          );
          this.lineMap.set(newLine.id, newLine);
          Line.isActive = false;
        }
      });
      this.draw();
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
  ) {
    // Calculate the total height of the text block
    let totalTextHeight = textArray.length * textSize;

    // Calculate the starting y-coordinate to center the text block vertically
    let startY = y + (height - totalTextHeight) * 0.5 + textSize;

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

  redoLastDelete(arr = []) {
    if (!arr.length) return;

    arr.forEach((a) => {
      switch (a.s.type) {
        case "rect":
          this.rectMap.set(a.s.id, a.s);
          if (a.bp) this.breakPoints.set(a.s.id, a.bp);
          break;
        case "sphere":
          this.circleMap.set(a.s.id, a.s);
          if (a.bp) this.breakPoints.set(a.s.id, a.bp);
          break;
        case "line":
          this.lineMap.set(a.s.id, a.s);
          //    if (a.bp) this.breakPoints.set(a.s.id, s.bp);
          break;
        case "image":
          this.imageMap.set(a.s.id, a.s);
          if (a.bp) this.breakPoints.set(a.s.id, a.bp);
          break;
        case "text":
          this.textMap.set(a.s.id, a.s);
          //    if (a.bp) this.breakPoints.set(a.s.id, s.bp);
          break;
        case "pencil":
          this.pencilMap.set(a.s.id, a.s);
        default:
          break;
      }
    });
  }

  redoEvent(e) {
    if (e.ctrlKey && e.key === "z") {
      const last = recycleAndUse.getLastDeleted();
      this.redoLastDelete(last);
      this.draw();
      this.drawImage();
      return last;
    }
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

    if (config.mode === "free" || config.mode === "text") {
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
    this.canvas.addEventListener("click", (e) => {
      const { x, y } = this.getTransformedMouseCoords(e);
      this.insertAPointToLine(x, y);
    });
    this.canvas.addEventListener("mouseup", this.mouseUp.bind(this));
    this.canvas.addEventListener("mousemove", (e) => {
      this.mouseMove(e);
    });
    this.canvasDiv.addEventListener(
      "mousedown",
      this.mouseDownForFif.bind(this),
    );
    this.canvas.addEventListener("mousedown", (e) => {
      this.mouseDownDragAndResize(e);
      this.duplicate(e);
    });
    this.canvas.addEventListener("dblclick", (e) => {
      this.newText(e);
      this.insertNewLine();
    });
    window.addEventListener("keydown", this.duplicateCtrl_D.bind(this), {
      passive: false,
    });
  }

  cleanup() {
    this.canvas.removeEventListener("click", (e) => {
      const { x, y } = this.getTransformedMouseCoords(e);
      this.insertAPointToLine(x, y);
    });
    this.canvas.removeEventListener("mouseup", this.mouseUp.bind(this));
    this.canvas.removeEventListener("mousemove", this.mouseMove.bind(this));
    this.canvasDiv.removeEventListener(
      "mousedown",
      this.mouseDownForFif.bind(this),
    );
    this.canvas.removeEventListener("mousedown", (e) => {
      this.mouseDownDragAndResize(e);
      this.duplicate(e);
    });
    this.canvas.removeEventListener("dblclick", (e) => {
      this.newText();
      this.insertNewLine();
    });
    window.removeEventListener("keydown", this.duplicateCtrl_D.bind(this));
  }
}
