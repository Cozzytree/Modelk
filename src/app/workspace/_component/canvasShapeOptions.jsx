import ColorOptions from "./colorOptions.tsx";
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
import { config, colors, thickness, lineType, fontsizes } from "@/lib/utils.ts";
import { PlusIcon, SquareIcon } from "@radix-ui/react-icons";

export default function CanvasShapeOptions({
  currentActive,
  setCurrent,
  shapeClassRef,
  canvasRef,
}) {
  const handleRadius = (val) => {
    if (config.currentActive) {
      config.currentActive.radius = val;
      setCurrent(config.currentActive);
      if (shapeClassRef) shapeClassRef.draw();
    }
  };

  const handleAddText = (x, y) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = x + rect.left;
    const mouseY = y + rect.top;
    const shape = shapeClassRef;

    const html = `<textarea class="border z-[999] text-xs absolute outline-none bg-background/35 border-zinc-800 rounded-sm p-2" id="text" placeholder="text"/>`;
    document.body.insertAdjacentHTML("afterbegin", html);
    const text = document.getElementById("text");
    text.style.top = mouseY + "px";
    text.style.left = mouseX + "px";
    text.style.width = currentActive.width + "px";
    text.focus();

    // text.addEventListener("change", (e) => {});
    if (currentActive.text.length > 0) {
      currentActive.text.forEach((t) => {
        text.textContent += t + "\n";
      });
    }
    text.addEventListener("blur", (e) => {
      const content = e.target.value.split("\n");
      currentActive.text = content;
      shape.draw();
      text.remove();
    });
  };

  const changeFontSizes = (value) => {
    if (config.currentActive) {
      config.currentActive.textSize = value;
      setCurrent(config.currentActive);
      if (shapeClassRef) shapeClassRef.draw();
    }
  };

  return (
    <>
      <div className="absolute bottom-5 left-[50%] z-[999] translate-x-[-50%] flex items-center divide-x-2 border border-zinc-800 gap-1">
        <Button
          onClick={() => handleAddText(currentActive.x, currentActive.y)}
          variant="ghost"
          size="icon"
          className=""
        >
          <PlusIcon />
        </Button>

        <Menubar>
          <MenubarMenu className="p-1">
            <MenubarTrigger
              style={{
                background:
                  currentActive.fillStyle || currentActive.borderColor,
              }}
              className="w-[30px] h-[30px]"
            ></MenubarTrigger>
            <MenubarContent className="grid grid-cols-4 w-fit gap-[3px]">
              {colors.map((color) => (
                <ColorOptions
                  color={color}
                  key={color}
                  onClick={() => {
                    if (config.currentActive) {
                      if (config.currentActive.type === "line") {
                        config.currentActive.borderColor = color;
                      } else config.currentActive.fillStyle = color;
                      setCurrent(config.currentActive);
                      if (shapeClassRef) shapeClassRef.draw();
                    }
                  }}
                />
              ))}
            </MenubarContent>
          </MenubarMenu>
          {/* {line thickness} */}
          {currentActive.type !== "text" && (
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
                        <ColorOptions
                          color={color}
                          key={color}
                          onClick={() => {
                            if (config.currentActive) {
                              config.currentActive.borderColor = color;
                              setCurrent(config.currentActive);
                              if (shapeClassRef) shapeClassRef.draw();
                            }
                          }}
                        />
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
          )}
          {/* {font size} */}
          <MenubarMenu>
            <MenubarTrigger>Size</MenubarTrigger>
            <MenubarContent className="w-[200px]">
              {fontsizes.map((font) => (
                <div
                  onClick={() => changeFontSizes(font.q)}
                  key={font.size}
                  className="text-center text-sm cursor-pointer hover:bg-secondary transition-all duration-150 p-1 rounded-sm"
                >
                  {font.size}
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
    </>
  );
}
