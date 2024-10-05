import { Button } from "@/components/ui/button";
import { Scale } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";

export default function ZoomLabel({
   scale,
   canvas,
   setScale,
}: {
   setScale: Function;
   scale: Number | any;
   canvas: any;
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

   const handleZoom = (type: "up" | "down") => {
      if (!canvas) return;
      Scale.scale = Math.round(Scale.scale * 10) / 10;
      if (type === "up") {
         Scale.scale *= Scale.scalingFactor;
      } else {
         Scale.scale /= Scale.scalingFactor;
      }
      Scale.scale = Math.round(Scale.scale * 10) / 10;
      setScale(Scale.scale);
      canvas.draw();
   };

   return (
      <div className="z-[999] flex gap-1 items-center flex-col">
         <div className="flex items-center justify-center gap-2">
            <MinusIcon cursor="pointer" onClick={() => handleZoom("down")} />
            <span className="text-sm font-bold">
               {(scale * 100).toFixed(0)} %
            </span>
            <PlusIcon cursor="pointer" onClick={() => handleZoom("up")} />
         </div>
         <Button
            variant={"ghost"}
            size="sm"
            className="p-1 h-fit"
            onClick={handleImage}
         >
            Save as image
         </Button>
      </div>
   );
}
