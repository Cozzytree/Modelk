interface MouseDown {
   x: number;
   y: number;
   canvasShape: any;
}

export function mouseDownDrag({ x, y, canvasShape }: MouseDown) {
   canvasShape.type;
}
