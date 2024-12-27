import { ShapeParams } from "../canvasTypes";
import { rectDraw } from "../draw/rectdraw";
import { adjustWidthAndHeightforPoints } from "../utils";

const buildShape = ({
   shapeParams,
   mouseX,
   mouseY,
}: {
   mouseX: number;
   mouseY: number;
   shapeParams: ShapeParams;
}) => {
   switch (shapeParams.type) {
      case "rect":
         if (mouseX > shapeParams.x) {
            shapeParams.width = mouseX - shapeParams.x;
         } else {
            shapeParams.width = shapeParams.x - mouseX;
            shapeParams.x = mouseX;
         }

         if (mouseY > shapeParams.y) {
            shapeParams.height = mouseY - shapeParams.y;
         } else {
            shapeParams.height = shapeParams.y - mouseY;
            shapeParams.y = mouseY;
         }

         shapeParams.width = Math.max(shapeParams.width, 20);
         shapeParams.height = Math.max(shapeParams.height, 20);
         break;
      case "sphere":
         shapeParams.xRadius = Math.max(mouseX - shapeParams.x, 20);
         shapeParams.yRadius = Math.max(mouseY - shapeParams.y, 20);
         shapeParams.width = 2 * shapeParams.xRadius;
         shapeParams.height = 2 * shapeParams.yRadius;
         break;
      case "pencil":
         const { x, y, width, height } = adjustWidthAndHeightforPoints({
            points: shapeParams.points as { x: number; y: number }[],
         });
         shapeParams.width = width;
         shapeParams.height = height;
         shapeParams.x = x;
         shapeParams.y = y;
         break;
      case "line":
         const {
            x: px,
            y: py,
            width: pw,
            height: ph,
         } = adjustWidthAndHeightforPoints({
            points: shapeParams.curvePoints as { x: number; y: number }[],
         });
         shapeParams.width = pw;
         shapeParams.height = ph;
         shapeParams.x = px;
         shapeParams.y = py;
         break;
   }
};

const buildingNewShape = ({
   mouseX,
   ctx,
   mouseY,
   shape,
}: {
   mouseX: number;
   mouseY: number;
   shape: ShapeParams;
   ctx: CanvasRenderingContext2D;
}) => {
   console.log(shape);
   switch (shape?.type) {
      case "rect":
         rectDraw({
            context: ctx,
            isActive: false,
            massiveSelected: false,
            rect: shape,
         });
         break;
   }
};

export { buildShape, buildingNewShape };
