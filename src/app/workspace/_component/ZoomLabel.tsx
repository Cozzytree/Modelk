import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";

export default function ZoomLabel({ scale }: { scale: Number | any }) {
  return (
    <div className="absolute right-5 z-[999] w-[100px] top-10 flex justify-center gap-1 items-center h-[40px]">
      <MinusIcon cursor="pointer" />
      <span className="text-lg font-bold">{scale * 100} %</span>
      <PlusIcon cursor="pointer" />
    </div>
  );
}
