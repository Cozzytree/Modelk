import { ShapeParams } from "./canvasTypes";
import { updateLineParameters } from "./resizeAndDrag/lineResize";
import { breakpointsMap, updateBreakpoints } from "./breakpoints";

interface MassiveSelection {
  isDown: boolean;
  isSelectedMinX: number;
  isSelectedMaxX: number;
  isSelectedMinY: number;
  isSelectedMaxY: number;
}

type props = {
  massiveSelection: MassiveSelection;
  shapes: ShapeParams[];
  breakpointsMap: breakpointsMap;
};

export const adjustMassiveSelectionParameters = ({
  x,
  y,
  width,
  height,
  massiveSelection,
}: {
  x: number;
  y: number;
  height: number;
  width: number;
  massiveSelection: MassiveSelection;
}) => {
  if (x + width > massiveSelection.isSelectedMaxX) {
    massiveSelection.isSelectedMaxX = x + width;
  }
  if (x < massiveSelection.isSelectedMinX) {
    massiveSelection.isSelectedMinX = x;
  }
  if (y < massiveSelection.isSelectedMinY) {
    massiveSelection.isSelectedMinY = y;
  }
  if (y + height > massiveSelection.isSelectedMaxY) {
    massiveSelection.isSelectedMaxY = y + height;
  }
};

export const recalculateMassiveSelection = ({
  massiveSelection,
  shapes,
  breakpointsMap,
}: props) => {
  massiveSelection.isDown = false;
  massiveSelection.isSelectedMinX = Infinity;
  massiveSelection.isSelectedMinY = Infinity;
  massiveSelection.isSelectedMaxX = -Infinity;
  massiveSelection.isSelectedMaxY = -Infinity;

  shapes.forEach((shape) => {
    if (!shape) return;
    let x = 0,
      y = 0,
      width = 0,
      height = 0;

    if (shape.isActive) {
      switch (shape.type) {
        case "sphere":
          if (shape.xRadius && shape.yRadius) {
            x = shape.x - shape.xRadius;
            y = shape.y - shape.yRadius;
            width = 2 * shape.xRadius;
            height = 2 * shape.yRadius;
          }
          break;
        case "line":
          updateLineParameters(shape);
          x = shape.minX as number;
          y = shape.minY as number;
          width = (shape.maxX as number) - x;
          height = (shape.maxX as number) - y;

          break;
        case "others":
          x = shape.x - shape.radius;
          y = shape.y = shape.radius;
          width = width;
          height = shape.height;
          break;
        case "pencil":
          x = shape.minX as number;
          y = shape.minY as number;
          width = shape.width;
          height = shape.height;
          break;
        default:
          x = shape.x;
          y = shape.y;
          width = shape.width;
          height = shape.height;
          break;
      }

      adjustMassiveSelectionParameters({
        x,
        y,
        width,
        height,
        massiveSelection,
      });
      updateBreakpoints({
        key: shape.id,
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height,
        guidesMap: breakpointsMap,
      });
    }
  });
};
