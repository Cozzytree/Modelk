class DefaultStyles {
  constructor() {
    this.lineWidth = 1.7;
    this.isActive = false;
    this.angle = 0;
    this.radius = 10;
    this.containerId = null;
    this.borderColor = "white";
    this.fillStyle = "transparent";
  }
}

export class Rect extends DefaultStyles {
  constructor(x, y, width, height) {
    super();
    this.pointTo = [];
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = "rect";
  }
}

export class Circle extends DefaultStyles {
  constructor(x, y, xRadius, yRadius) {
    super();
    this.x = x;
    this.y = y;
    this.xRadius = xRadius;
    this.yRadius = yRadius;
    this.pointTo = [];
    this.type = "sphere";
  }
}
