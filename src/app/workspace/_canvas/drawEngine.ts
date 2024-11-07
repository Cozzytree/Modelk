interface coordinates {
  x: number;
  y: number;
}

interface shapeParams {
  points: coordinates[];
  shouldJoin: boolean;
  shouldFille: boolean;
  ctx: CanvasRenderingContext2D;
  radius: number;
}

const drawShape = ({ points, radius, shouldJoin, ctx }: shapeParams) => {
  const path = new Path2D();
  ctx.beginPath();

  path.moveTo(points[0].x + radius, points[0].y);
  path.lineTo(points[1].x - radius, points[1].y);

  for (let i = 1; i < points.length - 1; i++) {
    path.arcTo(
      points[i].x,
      points[i].y,
      points[i].x,
      points[i].y + radius,
      radius,
    );
    path.lineTo(points[i].x, points[i + 1].y);
  }

  ctx.closePath();
};

export { drawShape };
