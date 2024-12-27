import { ResizeDirections, ShapeParams, textPosition } from "./canvasTypes";

function renderText({
   shape,
   context,
   tolerance = 6,
}: {
   tolerance?: number;
   shape: ShapeParams;
   context: CanvasRenderingContext2D;
}) {
   const {
      x,
      y,
      font,
      text,
      width,
      height,
      textSize,
      fontWeight,
      fontVarient,
      textPosition,
      allignVertical,
   } = shape;

   if (!text) return;

   // Calculate the total height of the text block
   let totalTextHeight = text.length * textSize;

   // Calculate the starting y-coordinate to center the text block vertically
   let startY;

   if (allignVertical === "bottom") {
      startY = y + height - totalTextHeight;
   } else if (allignVertical === "top") {
      startY = y;
   } else {
      startY = y + height * 0.5 - totalTextHeight * 0.5;
   }

   // Set the text properties
   context.fillStyle = "white";
   context.font = `${fontVarient} ${fontWeight} ${textSize}px ${font}`;
   context.textAlign = textPosition || "center";

   // Iterate through the text array and render each line
   for (let i = 0; i < text.length; i++) {
      // Measure the width of the current line of text
      const metrics = context.measureText(text[i]);

      // Calculate the x-coordinate to center the text horizontally
      let midPoint;

      // Render the text
      context.fillText(text[i], x + width * 0.5, startY);

      // Move to the next line
      startY += textSize;
   }
}

const drawDotsAndRectActive = ({
   x,
   y,
   width,
   height,
   context,
   isActive,
   tolerance,
   activeColor,
   isMassiveSelected,
}: {
   x: number;
   y: number;
   width: number;
   height: number;
   tolerance: number;
   isActive: boolean;
   activeColor: string;
   isMassiveSelected: boolean;
   context: CanvasRenderingContext2D;
}) => {
   if (isActive) {
      // Draw dots
      if (!isMassiveSelected)
         dots({
            sides: [
               { x: x - tolerance, y: y - tolerance },
               { x: x + width + tolerance, y: y - tolerance },
               { x: x + width + tolerance, y: y + height + tolerance },
               { x: x - tolerance, y: y + height + tolerance },
            ],
            activeColor,
            ctx: context,
         });

      // Draw active rectangle
      context.beginPath();
      context.strokeStyle = activeColor;
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.rect(
         x - tolerance,
         y - tolerance,
         width + 2 * tolerance,
         height + 2 * tolerance,
      );
      context.stroke();
      context.closePath();
   }
};

const dots = ({
   ctx,
   sides,
   activeColor,
}: {
   activeColor: string;
   sides: { x: number; y: number }[];
   ctx: CanvasRenderingContext2D;
}) => {
   for (let i = 0; i < sides.length; i++) {
      ctx.beginPath();
      ctx.lineWidth = 1.7;
      ctx.strokeStyle = activeColor;
      ctx.fillStyle = activeColor;
      ctx.arc(sides[i].x, sides[i].y, 5, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
   }
};

const changeCursors = (type: ResizeDirections) => {
   switch (type) {
      case "left-edge":
         document.body.style.cursor = "ew-resize";
         break;
      case "right-edge":
         document.body.style.cursor = "ew-resize";
         break;
      case "top-edge":
         document.body.style.cursor = "ns-resize";
         break;
      case "bottom-edge":
         document.body.style.cursor = "ns-resize"; // Vertical resizing (up/down)
         break;
      case "top-right":
         document.body.style.cursor = "ne-resize"; // Diagonal resizing (top-left to bottom-right)
         break;
      case "top-left":
         document.body.style.cursor = "nw-resize"; // Diagonal resizing (top-right to bottom-left)
         break;
      case "bottom-left":
         document.body.style.cursor = "ne-resize"; // Diagonal resizing (top-right to bottom-left)
         break;
      case "bottom-right":
         document.body.style.cursor = "se-resize"; // Diagonal resizing (top-left to bottom-right)
         break;
   }
};

function adjustWidthAndHeightforPoints({
   points,
}: {
   points: { x: number; y: number }[];
}) {
   if (!points) return;

   if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }; // Return an empty bounding box if no points are provided
   }

   let minX = points[0].x;
   let minY = points[0].y;
   let maxX = points[0].x;
   let maxY = points[0].y;

   // Iterate over the points to find the min/max values
   for (const point of points) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
   }

   // Calculate width and height of the bounding box
   const width = maxX - minX;
   const height = maxY - minY;

   // Return the bounding box
   return { x: minX, y: minY, width, height };
}

const isInside = ({
   inner,
   outer,
}: {
   inner: { x: number; y: number; height: number; width: number };
   outer: { x: number; y: number; height: number; width: number };
}) => {
   return (
      inner.x > outer.x &&
      inner.x + inner.width < outer.x + outer.width &&
      inner.y > outer.y &&
      inner.y + inner.height < outer.y + outer.height
   );
};

export {
   isInside,
   renderText,
   changeCursors,
   drawDotsAndRectActive,
   adjustWidthAndHeightforPoints,
};
