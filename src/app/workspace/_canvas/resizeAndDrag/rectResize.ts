import { breakpointsMap, updateBreakpoints } from "../breakpoints";
import { ShapeParams } from "../canvasTypes";

export const rectResizeParams = ({
  x,
  y,
  width,
  height,
  mouseX,
  mouseY,
  tolerance,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  mouseX: number;
  mouseY: number;
  tolerance: number;
}) => {
  const leftEdge = mouseX >= x - tolerance && mouseX <= x;
  const rightEdge = mouseX >= x + width && mouseX <= x + width + tolerance;
  const verticalBounds =
    mouseY >= y + tolerance && mouseY <= y + height - tolerance;
  //  // top - bottom
  const withinTopEdge = mouseY >= y - tolerance && mouseY <= y + tolerance;
  const withinBottomEdge =
    mouseY >= y + height - tolerance && mouseY <= y + height + tolerance;
  const withinHorizontalBounds =
    mouseX > x + tolerance && mouseX < x + width - tolerance;
  const withinTopLeftCorner =
    mouseX >= x - tolerance &&
    mouseX <= x + tolerance &&
    mouseY >= y - tolerance &&
    mouseY <= y + tolerance;

  const withinTopRightCorner =
    mouseX >= x + width - tolerance &&
    mouseX <= x + width + tolerance &&
    mouseY >= y - tolerance &&
    mouseY <= y + tolerance;

  const withinBottomLeftCorner =
    mouseX >= x - tolerance &&
    mouseX <= x + tolerance &&
    mouseY >= y + height - tolerance &&
    mouseY <= y + height + tolerance;

  const withinBottomRightCorner =
    mouseX >= x + width - tolerance &&
    mouseX <= x + width + tolerance &&
    mouseY >= y + height - tolerance &&
    mouseY <= y + height + tolerance;
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
};

export const updateRectParams = ({
  theResizeElement,
  guidesMap,
}: {
  theResizeElement: ShapeParams;
  guidesMap: breakpointsMap;
}) => {
  theResizeElement.isActive = true;
  theResizeElement.width = Math.max(theResizeElement.width, 20);
  theResizeElement.height = Math.max(theResizeElement.height, 20);

  // update line minMx
  theResizeElement.pointTo?.forEach((p) => {
    // this.updateLineMinMax(p);
  });

  updateBreakpoints({
    key: theResizeElement.id,
    minX: theResizeElement.x,
    minY: theResizeElement.y,
    maxX: theResizeElement.x + theResizeElement.width,
    maxY: theResizeElement.y + theResizeElement.height,
    guidesMap,
  });
};
