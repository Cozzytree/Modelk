export function drawRect(rect, context) {
   const {
      x,
      y,
      width,
      height,
      radius,
      text,
      textSize,
      textPosition,
      fontVarient,
      font,
      fontWeight,
      allignVertical,
   } = rect;

   const path = new Path2D();
   path.moveTo(x + radius, y);
   path.lineTo(x + width - radius, y);
   path.arcTo(x + width, y, x + width, y + radius, radius);
   path.lineTo(x + width, y + height - radius);
   path.arcTo(x + width, y + height, x + width - radius, y + height, radius);
   path.lineTo(x + radius, y + height);
   path.arcTo(x, y + height, x, y + height - radius, radius);
   path.lineTo(x, y + radius);
   path.arcTo(x, y, x + radius, y, radius);

   renderText(
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
      allignVertical,
      6,
      context,
   );

   return path;
}

export function renderText(
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
   tolerance,
   context,
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
         startY = y + 3 * tolerance;
         break;
      case "bottom":
         startY = y + height - totalTextHeight;
         break;
   }

   // Set the text properties
   context.fillStyle = "white";
   context.font = `${fontVarient} ${fontWeight} ${textSize}px ${font}`;

   // Iterate through the text array and render each line
   for (let i = 0; i < textArray.length; i++) {
      // Measure the width of the current line of text
      const metrics = context.measureText(textArray[i]);

      // Calculate the x-coordinate to center the text horizontally
      let midPoint;

      switch (position) {
         case "center":
            midPoint = x + (width - metrics.width) * 0.5;
            break;
         case "left":
            midPoint = x + tolerance;
            break;
         case "right":
            midPoint = x + (width - metrics.width) - tolerance;
            break;
         default:
            break;
      }

      // Render the text
      context.fillText(textArray[i], midPoint, startY);

      // Move to the next line
      startY += textSize;
   }
}

export function drawSphere(sphere, context) {
   const {
      x,
      y,
      xRadius,
      yRadius,
      text,
      textPosition,
      textSize,
      fontWeight,
      fontVarient,
      font,
      allignVertical,
   } = sphere;
   const path = new Path2D();
   path.ellipse(x, y, xRadius, yRadius, 0, 0, 2 * Math.PI);
   renderText(
      text,
      x - xRadius,
      y - yRadius,
      textSize,
      2 * yRadius,
      2 * yRadius,
      textPosition,
      fontWeight,
      fontVarient,
      font,
      allignVertical,
      6,
      context,
   );
   return path;
}

export function drawText(text, tolerance, context) {
   const { fillStyle, fontVarient, fontWeight, textSize, font, content, y, x } =
      text;
   // Set the font size and style before measuring the text
   context.fillStyle = fillStyle;
   context.font = `${fontVarient} ${fontWeight} ${textSize}px ${
      font || "Arial"
   }`;

   let maxWidth = 0;
   content.forEach((c) => {
      const textMetrics = context.measureText(c);
      maxWidth = Math.max(maxWidth, textMetrics.width);
   });

   // Store the measured dimensions
   text.width = maxWidth;
   let totalHeight = 0;

   let currentY = y;
   content.forEach((c) => {
      const textMetrics = context.measureText(c);

      const lineHeight =
         textMetrics.actualBoundingBoxAscent +
         textMetrics.actualBoundingBoxDescent;
      totalHeight += lineHeight + tolerance;

      context.fillText(c, x, currentY + textMetrics.actualBoundingBoxAscent);
      currentY +=
         textMetrics.actualBoundingBoxAscent +
         textMetrics.actualBoundingBoxDescent +
         tolerance;
   });
   text.height = totalHeight;
}

export function findSlope(y2, y1, x2, x1) {
   return (y2 - y1) / (x2 - x1);
}

export function drawSHapes(shape, context) {
   const { radius, x, y, inset, lines, borderColor, fillStyle, lineWidth } =
      shape;
   context.save();
   // context.shadowOffsetX = 2;
   // context.shadowOffsetY = 2;
   // context.shadowBlur = 2;
   // context.shadowColor = "red";
   context.beginPath();
   context.lineWidth = lineWidth;
   context.fillStyle = fillStyle;
   context.strokeStyle = borderColor;
   context.translate(x, y);
   context.moveTo(0, 0 - radius);
   for (let i = 0; i < lines; i++) {
      context.rotate(Math.PI / lines);
      context.lineTo(0, 0 - radius * inset);
      context.rotate(Math.PI / lines);
      context.lineTo(0, 0 - radius);
   }
   context.closePath();
   context.stroke();
   context.fill();
   context.restore();
}

function drawArrows(startPoint, endPoint, arrowLength, context) {
   const angle = Math.atan2(
      endPoint.y - startPoint.y,
      endPoint.x - startPoint.x,
   );

   // First side of the arrowhead
   context.moveTo(endPoint.x, endPoint.y);
   context.lineTo(
      endPoint.x - arrowLength * Math.cos(angle - Math.PI / 6),
      endPoint.y - arrowLength * Math.sin(angle - Math.PI / 6),
   );
   context.stroke();
   context.closePath();

   // Second side of the arrowhead
   context.beginPath();
   context.moveTo(endPoint.x, endPoint.y);
   context.lineTo(
      endPoint.x - arrowLength * Math.cos(angle + Math.PI / 6),
      endPoint.y - arrowLength * Math.sin(angle + Math.PI / 6),
   );
   context.stroke();
   context.closePath();
}

export function drawLine({ line, headlen, context }) {
   const { curvePoints, lineType, arrowLeft, arrowRight, radius = 0 } = line;
   const path = new Path2D();

   if (lineType === "straight") {
      path.moveTo(curvePoints[0].x, curvePoints[0].y);
      for (let i = 1; i < curvePoints.length; i++) {
         path.lineTo(curvePoints[i].x, curvePoints[i].y);
      }
      if (arrowLeft) {
         drawArrows(
            {
               x: curvePoints[curvePoints.length - 1].x,
               y: curvePoints[curvePoints.length - 1].y,
            },
            {
               x: curvePoints[0].x,
               y: curvePoints[0].y,
            },
            headlen,
            context,
         );
      }
      if (arrowRight) {
         drawArrows(
            {
               x: curvePoints[0].x,
               y: curvePoints[0].y,
            },
            {
               x: curvePoints[curvePoints.length - 1].x,
               y: curvePoints[curvePoints.length - 1].y,
            },
            headlen,
            context,
         );
      }
   } else if (lineType === "elbow") {
      const first = curvePoints[0];
      const last = curvePoints[curvePoints.length - 1];
      const mid = {
         x: (first.x + last.x) / 2,
         y: (first.y + last.y) / 2,
      };

      path.moveTo(first.x, first.y);
      path.arcTo(mid.x, first.y, mid.x, mid.y, radius);
      path.arcTo(mid.x, last.y, last.x, last.y, radius);
      path.lineTo(last.x, last.y);

      if (arrowLeft) {
         mid.x == first.x
            ? drawArrows(mid, first, headlen, context)
            : drawArrows({ x: mid.x, y: first.y }, first, headlen, context);
      }
      if (arrowRight) {
         mid.x == first.x
            ? drawArrows(mid, last, headlen, context)
            : drawArrows({ x: mid.x, y: last.y }, last, headlen, context);
      }
   } else {
      const last = curvePoints.length - 1;
      path.moveTo(curvePoints[0].x, curvePoints[0].y);
      const t = 0.8;

      for (let i = 1; i < curvePoints.length - 1; i++) {
         const cp1 = curvePoints[i];
         const cp2 = curvePoints[i + 1];
         const midPointX = (1 - t) * cp1.x + t * cp2.x;
         const midPointY = (1 - t) * cp1.y + t * cp2.y;
         path.quadraticCurveTo(cp1.x, cp1.y, midPointX, midPointY);
      }

      const secondToLastPoint = curvePoints[curvePoints.length - 2];
      const lastPoint = curvePoints[curvePoints.length - 1];
      const controlPointX = (1 - t) * secondToLastPoint.x + t * lastPoint.x;
      const controlPointY = (1 - t) * secondToLastPoint.y + t * lastPoint.y;

      path.quadraticCurveTo(
         controlPointX,
         controlPointY,
         lastPoint.x,
         lastPoint.y,
      );

      if (arrowLeft) {
         drawArrows(
            {
               x: curvePoints[1].x,
               y: curvePoints[1].y,
            },
            {
               x: curvePoints[0].x,
               y: curvePoints[0].y,
            },
            headlen,
            context,
         );
      }
      if (arrowRight) {
         drawArrows(
            {
               x: curvePoints[last - 1].x,
               y: curvePoints[last - 1].y,
            },
            {
               x: curvePoints[last].x,
               y: curvePoints[last].y,
            },
            headlen,
            context,
         );
      }
   }

   // Draw the path
   return path;
   // context.stroke(path);
}
