import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { config, colors, thickness, radius, lineType } from "@/lib/utils.ts";
import { ClockIcon, SquareIcon } from "@radix-ui/react-icons";

export default function CanvasShapeOptions({
  currentActive,
  setCurrent,
  shapeClassRef,
}) {
  const handleRadius = (val) => {
    if (config.currentActive) {
      config.currentActive.radius = val;
      setCurrent(config.currentActive);
      if (shapeClassRef) shapeClassRef.draw();
    }
  };

  return (
    <div className="absolute bottom-5 left-[50%] z-[999] translate-x-[-50%] flex items-center divide-x-2 border border-zinc-800 gap-1">
      <Menubar>
        <MenubarMenu className="p-1">
          <MenubarTrigger
            style={{
              background:
                config?.currentActive.fillStyle ||
                config?.currentActive.borderColor,
            }}
            className="w-[30px] h-[30px]"
          ></MenubarTrigger>
          <MenubarContent className="grid grid-cols-4 w-fit gap-[3px]">
            {colors.map((color) => (
              <div
                onClick={() => {
                  if (config.currentActive) {
                    if (config.currentActive.type === "line") {
                      config.currentActive.borderColor = color;
                    } else config.currentActive.fillStyle = color;
                    setCurrent(config.currentActive);
                    if (shapeClassRef) shapeClassRef.draw();
                  }
                }}
                key={color}
                style={{ background: color }}
                className="w-[30px] h-[30px] rounded-sm border border-zinc-300 shadow-sm shadow-zinc-700 cursor-pointer"
              ></div>
            ))}
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="">Line</MenubarTrigger>
          <MenubarContent className="w-[150px] space-y-1 px-2">
            {currentActive?.type !== "line" && (
              <MenubarSub>
                <MenubarSubTrigger
                  style={{ background: config?.currentActive.borderColor }}
                  className="w-[30px] h-[30px]"
                ></MenubarSubTrigger>
                <MenubarSubContent className="grid grid-cols-4 w-fit gap-[3px]">
                  {colors.map((color) => (
                    <div
                      onClick={() => {
                        if (config.currentActive) {
                          config.currentActive.borderColor = color;
                          setCurrent(config.currentActive);
                          if (shapeClassRef) shapeClassRef.draw();
                        }
                      }}
                      key={color}
                      style={{ background: color }}
                      className="w-[30px] h-[30px] rounded-sm border border-zinc-300 shadow-sm shadow-zinc-700 cursor-pointer"
                    ></div>
                  ))}
                </MenubarSubContent>
              </MenubarSub>
            )}
            {thickness.map((thick) => (
              <div
                onClick={() => {
                  if (config.currentActive) {
                    config.currentActive.lineWidth = thick.q;
                    setCurrent(config.currentActive);
                    if (shapeClassRef) shapeClassRef.draw();
                  }
                }}
                key={thick.size}
                className="grid grid-cols-[0.6fr_1fr] items-center"
              >
                <h2 className="text-[18px] font-bold">{thick.size}</h2>
                <div
                  style={{ height: `${thick.q}px` }}
                  className={` bg-zinc-200`}
                ></div>
              </div>
            ))}
          </MenubarContent>
        </MenubarMenu>

        {currentActive.type === "line" && (
          <MenubarMenu>
            <MenubarTrigger className="">\</MenubarTrigger>
            <MenubarContent>
              {lineType.map((line) => (
                <p
                  onClick={() => {
                    if (config.currentActive) {
                      if (line === "elbow") {
                        config.currentActive.lineType = "elbow";
                        config.currentActive.curvePoints = [
                          config.currentActive.curvePoints[0],
                          config.currentActive.curvePoints[
                            config.currentActive.curvePoints.length - 1
                          ],
                        ];
                      } else {
                        config.currentActive.lineType = "straight";
                        let first = config.currentActive.curvePoints[0];
                        let last =
                          config.currentActive.curvePoints[
                            config.currentActive.curvePoints.length - 1
                          ];
                        let midX = (first.x + last.x) / 2;
                        let midY = (first.y + last.y) / 2;

                        let midpoint = { x: midX, y: midY };

                        config.currentActive.curvePoints = [
                          first,
                          midpoint,
                          last,
                        ];
                      }

                      setCurrent(config.currentActive);
                      if (shapeClassRef) shapeClassRef.draw();
                    }
                  }}
                  key={line}
                  className="text-xs p-1"
                >
                  {line}
                </p>
              ))}
            </MenubarContent>
          </MenubarMenu>
        )}
        {currentActive.type === "rect" && (
          <MenubarMenu>
            <MenubarTrigger>
              <SquareIcon className="h-[30px]" />
            </MenubarTrigger>
            <MenubarContent className="flex flex-col items-center divide-y-2 gap-2">
              <div
                onClick={() => handleRadius(10)}
                className="w-[25px] h-[25px] bg-secondary rounded-md"
              ></div>
              <div
                onClick={() => handleRadius(0)}
                className="w-[25px] h-[25px] bg-secondary rounded-none"
              ></div>
            </MenubarContent>
          </MenubarMenu>
        )}
      </Menubar>
    </div>
  );
}
