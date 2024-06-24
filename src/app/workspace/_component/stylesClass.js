class DefaultStyles {
  constructor() {
    this.lineWidth = 1.7;
    this.isActive = false;
    this.angle = 0;
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
  constructor(x, y, width, height, text = [], textSize = 20) {
    super();
    this.pointTo = [];
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = "rect";
    this.text = text;
    this.textSize = textSize;
  }
}

export class Circle extends DefaultStyles {
  constructor(x, y, xRadius, yRadius, text = [], textSize = 20) {
    super();
    this.x = x;
    this.y = y;
    this.xRadius = xRadius;
    this.yRadius = yRadius;
    this.pointTo = [];
    this.type = "sphere";
    this.text = text;
    this.textSize = textSize;
  }
}

export class Line extends DefaultStyles {
  constructor(lineType, minX = null, minY = null, maxX = null, maxY = null) {
    super();
    this.startTo = null;
    this.endTo = null;
    this.curvePoints = [];
    this.lineType = lineType;
    this.type = "line";
    this.minX = null;
    this.maxX = null;
    this.minY = null;
    this.maxY = null;
  }
}

export class Text extends DefaultStyles {
  constructor(x, y, size, content = [], font) {
    super();
    this.content = content;
    this.pointTo = [];
    this.fillStyle = "white";
    this.type = "text";
    this.x = x;
    this.y = y;
    this.font = font;
  }
}
