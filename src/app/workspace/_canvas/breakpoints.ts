export type breakpointsMap = Map<
  string,
  { minX: number; minY: number; maxX: number; maxY: number }
>;

interface BreakPoints {
  guidesMap: breakpointsMap;
  key: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const updateBreakpoints = ({
  guidesMap,
  key,
  minX,
  minY,
  maxX,
  maxY,
}: BreakPoints) => {
  const found = guidesMap.get(key);
  if (!found) return;
  found.minX = minX;
  found.maxX = maxX;
  found.minY = minY;
  found.maxY = maxY;
};
