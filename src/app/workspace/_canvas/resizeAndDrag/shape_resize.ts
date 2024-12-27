import { ResizeDirections, ShapeParams } from "../canvasTypes";
import { pencilresize } from "./pencilresize";

const resize_move = ({
   mouseX,
   mouseY,
   shape,
   direction,
   resizeShape,
}: {
   mouseX: number;
   mouseY: number;
   shape: ShapeParams;
   resizeShape: ShapeParams;
   direction: ResizeDirections;
}) => {
   switch (shape.type) {
      case "pencil":
         pencilresize({ direction });
         break;
   }
};

export { resize_move };
