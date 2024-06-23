"use client";

import Canvas from "../_component/canvas.jsx";
import DrawBoard from "../_component/canvas.jsx";

export default function Workspace() {
  return (
    <div className="h-screen w-screen grid grid-cols-[0.5fr_1fr] overflow-hidden">
      <div className="">Hello</div>
      <div className="relative w-full">
        <Canvas />
      </div>
    </div>
  );
}
