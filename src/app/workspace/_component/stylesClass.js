class DefaultStyles {
   constructor() {
      this.lineWidth = 1.7;
      this.isActive = false;
      this.radius = 10;
      this.containerId = null;
      this.borderColor = "white";
      this.fillStyle = "transparent";
      this.fillType = "full"; // full , net
      this.id = Date.now();
      this.textSize = 20;
      this.text = [];
   }
}

export class Rect extends DefaultStyles {
   constructor(x, y, width, height, text = [], textSize = 20, isActive = true) {
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
      lineType = "",
      minX = null,
      minY = null,
      maxX = null,
      maxY = null,
      curvePoints = [],
      isActive = false
   ) {
      super();
      this.startTo = null;
      this.endTo = null;
      this.curvePoints = curvePoints;
      this.lineType = lineType;
      this.type = "line";
      this.minX = minX;
      this.maxX = maxX;
      this.minY = minY;
      this.maxY = maxY;
      this.isActive = isActive;
      this.lineWidth = 1;
      this.arrowLeft = false;
      this.arrowRight = true;
   }
}

export class Text extends DefaultStyles {
   constructor(x, y, size, content = [], font, isActive, height, width) {
      super();
      this.content = content;
      this.pointTo = [];
      this.fillStyle = "white";
      this.type = "text";
      this.x = x;
      this.y = y;
      this.font = font;
      this.textSize = size || this.textSize;
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

// save as image option
// const canvas = document.getElementById("myCanvas");
// const saveButton = document.getElementById("saveButton");

// // Example: Draw something on the canvas
// const ctx = canvas.getContext("2d");
// ctx.fillStyle = "red";
// ctx.fillRect(50, 50, 200, 200);
// ctx.fillStyle = "blue";
// ctx.font = "30px Arial";
// ctx.fillText("Hello Canvas", 70, 100);

// saveButton.addEventListener("click", () => {
//    const dataURL = canvas.toDataURL("image/png");
//    const link = document.createElement("a");
//    link.href = dataURL;
//    link.download = "canvas-image.png";
//    document.body.appendChild(link);
//    link.click();
//    document.body.removeChild(link);
// });
