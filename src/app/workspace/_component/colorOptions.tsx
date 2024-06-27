import { MouseEvent } from "react";

export default function ColorOptions({
  color,
  onClick,
}: {
  onClick: MouseEvent | any;
  color: String | any;
}) {
  return (
    <div
      onClick={onClick}
      key={color}
      style={{ background: color }}
      className="w-[30px] h-[30px] rounded-sm border border-zinc-300 shadow-sm shadow-zinc-700 cursor-pointer"
    ></div>
  );
}
