"use client";

import { Button } from "@/components/ui/button";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
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
  ReloadIcon,
} from "@radix-ui/react-icons";
import clsx from "clsx";
import Link from "next/link";
import Share from "./_component/share";
import Copy from "./_component/copy";
import Delete from "./_component/delete";
import Sidebar from "../(component)/sidebar";
import { useGetCurrentUser, useSignUp } from "@/requests/authRequests";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetUserTeams } from "@/requests/teams";
import { useTeamFiles } from "@/requests/project";

const arr = Array.from({ length: 10 }, () => {});

export default function Home() {
  const [activeTeam, setActiveTeam] = useState<any>(null);
  const { user, isLoading } = useKindeBrowserClient();
  const { mutate, isPending } = useSignUp();
  const {
    data: userTeams,
    isLoading: loadingTeams,
    error,
    refetch: getUserTeams,
  } = useGetUserTeams();
  const {
    data: files,
    isLoading: loadingFiles,
    refetch,
  } = useTeamFiles(activeTeam?._id);

  useEffect(() => {
    if (user && !isLoading) {
      mutate(
        {
          username: user.given_name,
          picture: user.picture || "",
          email: user.email,
        },
        {
          onSuccess: () => {
            getUserTeams();
          },
        }
      );
    }
  }, [user, mutate, isLoading]);

  useEffect(() => {
    if (userTeams) setActiveTeam(userTeams.data[0]);
  }, [userTeams]);

  useEffect(() => {
    activeTeam?._id && refetch();
  }, [activeTeam, refetch]);

  return (
    <div className="w-full flex h-[100dvh] overflow-y-auto">
      {loadingTeams ? (
        <div className="w-[200px] flex justify-center">
          <ReloadIcon className="animate-spin" />
        </div>
      ) : (
        <Sidebar
          userTeams={userTeams}
          activeTeam={activeTeam}
          setActiveTeam={setActiveTeam}
          user={user}
        />
      )}

      <div className="w-full flex flex-col items-center">
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
        <main className="w-full flex flex-co items-center px-6">
          {files?.data.length > 0 ? (
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
                {loadingFiles ? (
                  <ReloadIcon className=" animate-spin" />
                ) : (
                  <>
                    {files?.data.length > 0 &&
                      files.data.map((file: any, index: any) => (
                        <TableRow key={index} className="w-full">
                          <TableCell className="w-[30%]">
                            <Link
                              href={`/workspace/${file?._id}`}
                              className="block w-full h-full"
                            >
                              {file?.name}
                            </Link>
                          </TableCell>
                          <TableCell className="w-[20%]">
                            <Link
                              href={`/workspace/${file?._id}`}
                              className="block w-full h-full"
                            ></Link>
                          </TableCell>
                          <TableCell className="">
                            <Link
                              href={`/workspace/${file?._id}`}
                              className="block w-full h-full"
                            >
                              {new Intl.DateTimeFormat("en-GB", {
                                dateStyle: "short",
                              }).format(new Date(file?.createdAt))}
                            </Link>
                          </TableCell>
                          <TableCell className="">
                            <Link
                              href={`/workspace/${file?._id}`}
                              className="block w-full h-full "
                            >
                              0
                            </Link>
                          </TableCell>
                          <TableCell className="">
                            <Link
                              href={`/workspace/${file?._id}`}
                              className="block w-full h-full"
                            ></Link>
                          </TableCell>
                          <TableCell className="">
                            <Link
                              href={`/workspace/${file?._id}`}
                              className="block w-full h-full"
                            >
                              {file?.author}
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
                  </>
                )}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-zinc-400 text-center w-full">No Files</p>
          )}
        </main>
      </div>
    </div>
  );
}
