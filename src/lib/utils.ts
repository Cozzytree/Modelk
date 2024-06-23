import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const config = {
  mode: "free",
  docMode: "both",
  // for shape options
  currentActive: null,
};

export const fontsizes = [
  { size: "Small", q: 15 },
  { size: "Medium", q: 25 },
  { size: "Large", q: 35 },
  { size: "Extra Large", q: 45 },
];
export const colors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A1",
  "#A133FF",
  "#33FFF5",
];

export const scrollBar = {
  scrollPositionY: 0,
  scrollPositionX: 0,
  isDraggingY: false,
  isDraggingX: false,
  startY: 0,
  startX: 0,
};

export const Scale = {
  scale: 1,
  scalingFactor: 1.1,
};
