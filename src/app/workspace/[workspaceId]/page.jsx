"use client";

import { Button } from "@/components/ui/button.tsx";
import Canvas from "../_component/canvas.jsx";
import Doc from "../_component/Doc.jsx";
import { useState } from "react";

const boardView = [{ name: "Document" }, { name: "Both" }, { name: "Canvas" }];

export default function Workspace() {
  const [workspaceMode, setWorksapceMode] = useState("Both");
  return (
    <div className="w-screen h-screen overflow-hidden">
      <div className="fixed top-0 left-0 w-screen flex justify-between items-center border-b py-1 bg-background border-b-zinc-800 z-[999]">
        <h1>Modelk</h1>
        <div className="">
          {boardView.map((view) => (
            <Button
              onClick={() => setWorksapceMode(view.name)}
              key={view.name}
              className={`${
                view.name === workspaceMode ? "bg-secondary" : "bg-black"
              } text-md h-3 py-3`}
              variant="ghost"
              size="sm"
            >
              {view.name}
            </Button>
          ))}
        </div>
        <div>Settings</div>
      </div>

      <div
        className={`h-screen w-screen grid ${
          workspaceMode === "Both" ? "grid-cols-[0.5fr_1fr]" : "grid-cols-1"
        }   overflow-hidden divide-x-2`}
      >
        {/* document */}
        <div
          className={`${
            workspaceMode === "Canvas" ? "hidden" : "block"
          } flex justify-center w-full  mt-12`}
        >
          <Doc />
        </div>

        {/* canvas */}
        <div
          className={`relative w-full ${
            workspaceMode === "Document" ? "hidden" : "block"
          } h-screen`}
        >
          <Canvas />
        </div>
      </div>
    </div>
  );
}
