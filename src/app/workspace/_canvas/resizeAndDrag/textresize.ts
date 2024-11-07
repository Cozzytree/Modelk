export const textresize = ({
  mouseX,
  mouseY,
  theResizeElement,
}: {
  mouseX: number;
  mouseY: number;
  theResizeElement: any;
}) => {
  if (mouseX > theResizeElement.x && mouseY > theResizeElement.y) {
    theResizeElement.textSize =
      Math.max(
        12, // Minimum size to prevent text from becoming too small
        (mouseX - theResizeElement.x) * 0.2 +
          (mouseY - theResizeElement.y) * 0.3,
      ) * 0.5;
  }
};
