import { ResizeDirections, ShapeParams } from "../canvasTypes";

export const pencilresize = ({
   mouseX,
   mouseY,
   direction,
   initialMinX,
   initialMaxX,
   initialMaxY,
   initialMinY,
   theResizeElement,
}: {
   mouseX: number;
   mouseY: number;
   initialMaxX: number;
   initialMinX: number;
   initialMaxY: number;
   initialMinY: number;
   direction: ResizeDirections;
   theResizeElement: ShapeParams;
}) => {
   const originalWidth = initialMaxX - initialMinX;
   const originalHeight = initialMaxY - initialMinY;

   if (direction == "left-edge") {
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
      theResizeElement.points?.forEach((point) => {
         if (!point.offsetX) return;
         point.x = newMinX + point.offsetX * widthScaleFactor;
      });

      // Update the resized shape
      theResizeElement.minX = newMinX;
      theResizeElement.maxX = newMaxX;
   } else if (direction == "right-edge") {
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
      theResizeElement.points?.forEach((point) => {
         if (!point.offsetX) return;
         point.x = newMaxX + point.offsetX * widthScaleFactor;
      });

      // Update the resized shape
      theResizeElement.minX = newMinX;
      theResizeElement.maxX = newMaxX;
   } else if (direction == "top-edge") {
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
      theResizeElement.points?.forEach((point) => {
         if (point.offsetY)
            point.y = newMinY + point.offsetY * heightScaleFactor;
      });

      // Update the resized shape
      theResizeElement.minY = newMinY;
      theResizeElement.maxY = newMaxY;
   } else if (direction == "bottom-edge") {
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
      let newMinX: number = 0,
         newMaxX: number = 0,
         newMinY: number = 0,
         newMaxY: number = 0;
      let newWidth,
         newHeight,
         heightScaleFactor: number,
         widthScalingFactor: number;
      switch (direction) {
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
            if (theResizeElement.points)
               theResizeElement.points.forEach((point) => {
                  if (!point.offsetX || !point.offsetY) return;

                  point.x = newMinX + point?.offsetX * widthScalingFactor;
                  point.y = newMinY + point?.offsetY * heightScaleFactor;
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

            if (theResizeElement.points)
               theResizeElement.points.forEach((point) => {
                  if (!point.offsetX || !point.offsetY) return;
                  point.y = newMinY + point.offsetY * heightScaleFactor;
                  point.x = newMaxX + point.offsetX * widthScalingFactor;
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

            if (theResizeElement.points)
               theResizeElement.points.forEach((point) => {
                  if (!point.offsetX || !point.offsetY) return;
                  point.y = newMaxY + point.offsetY * heightScaleFactor;
                  point.x = newMinX + point.offsetX * widthScalingFactor;
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

            if (theResizeElement.points)
               theResizeElement.points.forEach((point) => {
                  if (!point.offsetX || !point.offsetY) return;
                  point.y = newMaxY + point.offsetY * heightScaleFactor;
                  point.x = newMaxX + point.offsetX * widthScalingFactor;
               });
            break;
      }
      // Update the resized shape
      theResizeElement.minY = newMinY;
      theResizeElement.maxY = newMaxY;
      theResizeElement.maxX = newMaxX;
      theResizeElement.minX = newMinX;
   }
};
