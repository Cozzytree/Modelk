import { ShapeParams } from "../canvasTypes";
import { isInside } from "../utils";

const getSmallestDragShape = ({
   mouseX,
   mouseY,
   shapes,
}: {
   mouseX: number;
   mouseY: number;
   shapes: ShapeParams[];
}) => {
   let smallestShape: number | null = null;
   shapes.forEach((shape, index) => {
      if (!shape) return;
      shape.isActive = false;
      const { x, y, width, height, xRadius, yRadius, type } = shape;

      if (
         isInside({
            outer: {
               x: type === "sphere" ? x - (xRadius ?? 0) : x,
               y: type === "sphere" ? y - (yRadius ?? 0) : y,
               width,
               height,
            },
            inner: {
               x: mouseX,
               y: mouseY,
               width: 0,
               height: 0,
            },
         })
      ) {
         if (smallestShape == null || shapes[smallestShape].width > width) {
            smallestShape = index;
         }
      }
   });

   return smallestShape;
};

export { getSmallestDragShape };
