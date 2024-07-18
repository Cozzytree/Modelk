export function drawRect(rect, context, activeColor, isFigure = false) {
   const {
      lineWidth,
      borderColor,
      fillStyle,
      x,
      y,
      width,
      height,
      radius,
      isActive,
   } = rect;
   // Draw rounded rectangle
   context.beginPath();
   if (isFigure) {
      context.strokeStyle = isActive ? activeColor : "grey";
      context.lineWidth = 1;
      context.fillStyle = "black";
   } else {
      context.strokeStyle = borderColor;
      context.lineWidth = lineWidth;
      context.fillStyle = fillStyle;
   }

   context.moveTo(x + radius, y);
   context.arcTo(x + width, y, x + width, y + height, radius);
   context.arcTo(x + width, y + height, x, y + height, radius);
   context.arcTo(x, y + height, x, y, radius);
   context.arcTo(x, y, x + width, y, radius);
   context.stroke();
   context.fill();
   context.closePath();
}

export function drawSphere(
   lineWidth,
   fillStyle,
   borderColor,
   x,
   y,
   xRadius,
   yRadius,
   context,
) {
   context.beginPath();
   context.lineWidth = lineWidth;
   context.fillStyle = fillStyle;
   context.strokeStyle = borderColor;
   context.ellipse(x, y, xRadius, yRadius, 0, 0, 2 * Math.PI);
   context.fill();
   context.stroke();
   context.closePath();
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
   text.height = content.length * textSize - tolerance;

   let currentY = y;
   content.forEach((c) => {
      const textMetrics = context.measureText(c);
      context.fillText(c, x, currentY + textMetrics.actualBoundingBoxAscent);
      currentY +=
         textMetrics.actualBoundingBoxAscent +
         textMetrics.actualBoundingBoxDescent +
         tolerance;
   });
}

export function findSlope(y2, y1, x2, x1) {
   return (y2 - y1) / (x2 - x1);
}

export function drawSHapes(shape, context) {
   const { radius, x, y, inset, lines } = shape;
   context.save();
   context.shadowOffsetX = 2;
   context.shadowOffsetY = 2;
   context.shadowBlur = 2;
   context.shadowColor = "red";
   context.beginPath();
   context.lineWidth = 2;
   context.fillStyle = "transparent";
   context.strokeStyle = "white";
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
