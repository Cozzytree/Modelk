import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CopyIcon,
  DotsHorizontalIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import clsx from "clsx";
import Link from "next/link";
import Share from "./component/share";
import Copy from "./component/copy";
import Delete from "./component/delete";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "../(component)/sidebar";

const arr = Array.from({ length: 10 }, () => {});

export default function Home() {
  return (
    <div className="w-full grid grid-cols-[0.3fr_1fr] h-[100dvh] overflow-y-auto">
      <Sidebar />
      <div>
        <nav className="w-full py-5 px-6">
          <menu className="flex gap-5">
            <li>
              <Button
                variant="ghost"
                size="sm"
                className={clsx(` h-fit py-1 cursor-pointer text-md`)}
              >
                All
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                size="sm"
                className={clsx(` h-fit py-1 cursor-pointer text-md`)}
              >
                Recent
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                size="sm"
                className={clsx(` h-fit py-1 cursor-pointer text-md`)}
              >
                Created By Me
              </Button>
            </li>
          </menu>
        </nav>
        <main className="w-full px-6">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">NAME</TableHead>
                <TableHead className="w-[20%]">ORIGIN</TableHead>
                <TableHead className="w-[10%]">CREATED</TableHead>
                <TableHead className="w-[10%]">STARS</TableHead>
                <TableHead className="w-[10%]">COMMENTS</TableHead>
                <TableHead className="w-[10%]">CREATOR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="w-full">
              {arr.map((_, index) => (
                <TableRow key={index} className="w-full">
                  <TableCell className="w-[30%]">
                    <Link
                      href="http://localhost:5173"
                      className="block w-full h-full"
                    >
                      Cozzytree
                    </Link>
                  </TableCell>
                  <TableCell className="w-[20%]">
                    <Link
                      href="http://localhost:5173"
                      className="block w-full h-full"
                    >
                      Hello
                    </Link>
                  </TableCell>
                  <TableCell className="">
                    <Link
                      href="http://localhost:5173"
                      className="block w-full h-full"
                    >
                      {index + 1} weeks ago
                    </Link>
                  </TableCell>
                  <TableCell className="">
                    <Link
                      href="http://localhost:5173"
                      className="block w-full h-full "
                    >
                      Hello
                    </Link>
                  </TableCell>
                  <TableCell className="">
                    <Link
                      href="http://localhost:5173"
                      className="block w-full h-full"
                    >
                      Hello
                    </Link>
                  </TableCell>
                  <TableCell className="">
                    <Link
                      href="http://localhost:5173"
                      className="block w-full h-full"
                    >
                      <Avatar className="w-[40px] h-[40px]">
                        <AvatarImage src="/vercel.sv" />
                        <AvatarFallback>D</AvatarFallback>
                      </Avatar>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <DotsHorizontalIcon cursor="pointer" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem className="flex gap-2">
                          <Pencil1Icon />
                          Rename
                        </DropdownMenuItem>
                        <Copy />
                        <Share />
                        <Delete />
                        <DropdownMenuItem className="flex gap-2">
                          <CopyIcon /> Duplicate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </main>
      </div>
    </div>
  );
}
