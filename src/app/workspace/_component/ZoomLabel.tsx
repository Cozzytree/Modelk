import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";

export default function ZoomLabel({
   scale,
   canvas,
}: {
   scale: Number | any;
   canvas: HTMLCanvasElement;
}) {
   const handleImage = () => {
      // Create a temporary canvas
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;
      // Set dimensions
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      // Fill the temporary canvas with black
      tempCtx.fillStyle = "black";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the original canvas content onto the temporary canvas
      tempCtx.drawImage(canvas, 0, 0);

      // Get the data URL from the temporary canvas
      const dataURL = tempCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "canvas-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   return (
      <div className="absolute right-5 z-[999] w-[100px] top-10 flex justify-center gap-1 items-center h-[40px]">
         <MinusIcon cursor="pointer" />
         <span className="text-lg font-bold">{scale * 100} %</span>
         <PlusIcon cursor="pointer" />
         <div onClick={handleImage}>Save as image</div>
      </div>
   );
}
