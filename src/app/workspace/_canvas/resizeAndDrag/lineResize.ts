import { shapeTypes } from "@/lib/utils";
import { ShapeParams } from "../canvasTypes";
import { findSlope } from "../utilsFunc";

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
        line.curvePoints[line.curvePoints.length - 1].y = line.curvePoints[0].y;
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
              theResizeElement.curvePoints[0].y > theShape.y + theShape.radius
            ) {
              theShape.pointTo = theShape.pointTo?.filter((p) => p !== key);
              theResizeElement.startTo = null;
            }
            break;
          default:
            if (linedetachRect({ theResizeElement, index: 0, key, theShape })) {
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
          if (squareLineParams({ obj: shape, mouseX, mouseY }) && !keyUsed) {
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
            linedetachRect({ key, theResizeElement, theShape, index: length })
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
          (theResizeElement.startTo === id || shape.pointTo?.includes(key)) &&
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
  const distance = Math.sqrt((mouseX - shape.x) ** 2 + (mouseY - shape.y) ** 2);
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
