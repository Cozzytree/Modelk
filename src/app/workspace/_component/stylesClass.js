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
