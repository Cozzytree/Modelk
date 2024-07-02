class DefaultStyles {
   constructor() {
      this.lineWidth = 1.7;
      this.isActive = false;
      this.radius = 10;
      this.containerId = null;
      this.borderColor = "white";
      this.fillStyle = "transparent";
      this.id = Date.now();
      this.textSize = 20;
      this.text = [];
   }
}

export class Rect extends DefaultStyles {
   constructor(x, y, width, height, text = [], textSize = 20, isActive) {
      super();
      this.pointTo = [];
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.type = "rect";
      this.text = text;
      this.textSize = textSize;
      this.isActive = isActive;
   }
}

export class Circle extends DefaultStyles {
   constructor(x, y, xRadius, yRadius, text = [], textSize = 20, isActive) {
      super();
      this.x = x;
      this.y = y;
      this.xRadius = xRadius;
      this.yRadius = yRadius;
      this.pointTo = [];
      this.type = "sphere";
      this.text = text;
      this.textSize = textSize;
      this.isActive = isActive;
   }
}

export class Line extends DefaultStyles {
   constructor(
      lineType,
      minX = null,
      minY = null,
      maxX = null,
      maxY = null,
      curvePoints = [],
      isActive
   ) {
      super();
      this.startTo = null;
      this.endTo = null;
      this.curvePoints = curvePoints;
      this.lineType = lineType;
      this.type = "line";
      this.minX = minX;
      this.maxX = minY;
      this.minY = minY;
      this.maxY = maxY;
      this.isActive = isActive;
   }
}

export class Text extends DefaultStyles {
   constructor(
      x,
      y,
      size,
      content = [],
      font,
      isActive,
      height = 0,
      width = 0
   ) {
      super();
      this.content = content;
      this.pointTo = [];
      this.fillStyle = "white";
      this.type = "text";
      this.x = x;
      this.y = y;
      this.font = font;
      this.textSize = size;
      this.isActive = isActive;
      this.height = height;
      this.width = width;
   }
}

export class Figure extends DefaultStyles {
   constructor(x, y, title, width, height) {
      super();
      this.x = x;
      this.y = y;
      this.title = title;
      this.width = width;
      this.height = height;
      this.isActive = true;
   }
}


// document.addEventListener("DOMContentLoaded", function () {
//     const canvas = document.getElementById('myCanvas');
//     const ctx = canvas.getContext('2d');

//     // Define the rectangle
//     const rect = {
//         x: 100,
//         y: 100,
//         width: 200,
//         height: 150
//     };

//     // Define the points
//     const pointA = { x: 120, y: 120 };  // Point connected to the rectangle
//     let pointB = { x: 350, y: 300 };  // Point not connected to the rectangle

//     function draw() {
//         ctx.clearRect(0, 0, canvas.width, canvas.height);

//         // Draw the rectangle
//         ctx.strokeStyle = 'black';
//         ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

//         // Draw the points
//         ctx.fillStyle = 'red';
//         ctx.beginPath();
//         ctx.arc(pointA.x, pointA.y, 5, 0, Math.PI * 2, true); // Point A
//         ctx.fill();

//         ctx.fillStyle = 'blue';
//         ctx.beginPath();
//         ctx.arc(pointB.x, pointB.y, 5, 0, Math.PI * 2, true); // Point B
//         ctx.fill();

//         // Draw the line connecting pointA to the rectangle
//         ctx.beginPath();
//         ctx.moveTo(pointA.x, pointA.y);
//         ctx.lineTo(rect.x + rect.width, pointA.y);
//         ctx.strokeStyle = 'black';
//         ctx.stroke();

//         // Calculate the closest point on the rectangle to pointB
//         function clamp(value, min, max) {
//             return Math.max(min, Math.min(max, value));
//         }

//         const closestPointOnRect = {
//             x: clamp(pointB.x, rect.x, rect.x + rect.width),
//             y: clamp(pointB.y, rect.y, rect.y + rect.height)
//         };

//         // Draw the closest point on the rectangle
//         ctx.fillStyle = 'green';
//         ctx.beginPath();
//         ctx.arc(closestPointOnRect.x, closestPointOnRect.y, 5, 0, Math.PI * 2, true); // Closest point on rectangle
//         ctx.fill();

//         // Draw the line from pointB to the closest point on the rectangle
//         ctx.beginPath();
//         ctx.moveTo(pointB.x, pointB.y);
//         ctx.lineTo(closestPointOnRect.x, closestPointOnRect.y);
//         ctx.strokeStyle = 'blue';
//         ctx.stroke();

//         // Calculate the distance
//         const distance = Math.sqrt(
//             (closestPointOnRect.x - pointB.x) ** 2 +
//             (closestPointOnRect.y - pointB.y) ** 2
//         );

//         console.log('Distance:', distance);

//         // Update pointA to the closest point on the rectangle
//         pointA.x = closestPointOnRect.x;
//         pointA.y = closestPointOnRect.y;
//     }

//     draw();

//     // Add mousemove event listener to update pointB and redraw
//     canvas.addEventListener('mousemove', function (event) {
//         const rect = canvas.getBoundingClientRect();
//         pointB.x = event.clientX - rect.left;
//         pointB.y = event.clientY - rect.top;
//         draw();
//     });
// });
