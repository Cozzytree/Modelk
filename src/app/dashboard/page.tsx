"use client";

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
import { useLogin } from "@/requests/authRequests";
import {
  useDeleteProject,
  useTeamFiles,
  useUpdateProjectName,
} from "@/requests/project";
import { useGetUserTeams } from "@/requests/teams";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import {
  CopyIcon,
  DotsHorizontalIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "../(component)/sidebar";
import Copy from "./_component/copy";
import Delete from "./_component/delete";
import Share from "./_component/share";
import Rename from "./_component/rename";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const [activeTeam, setActiveTeam] = useState<any>(null);
  const { user, isLoading } = useKindeBrowserClient();
  const { userLogin, userData } = useLogin();
  const {
    data: userTeams,
    isLoading: loadingTeams,
    refetch: getUserTeams,
  } = useGetUserTeams();
  const {
    data: files,
    isLoading: loadingFiles,
    refetch,
  } = useTeamFiles(activeTeam?.ID);

  // Use useEffect for side effects like user login
  useEffect(() => {
    if (user && !isLoading) {
      userLogin(
        {
          email: user.email,
          picture: user.picture,
          username: user.given_name,
        },
        {
          onSuccess: () => {
            getUserTeams();
          },
        },
      );
    }
  }, [user, isLoading, userLogin, getUserTeams]);

  useEffect(() => {
    if (userTeams) {
      setActiveTeam(userTeams[0]);
    }
  }, [userTeams, refetch]);

  useEffect(() => {
    activeTeam?.ID && refetch();
  }, [activeTeam, refetch]);

  return (
    <div className="w-full grid grid-cols-[auto_1fr] h-[100dvh] overflow-y-auto">
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
          {files !== undefined && (
            <Files
              activeTeam={activeTeam?.ID}
              files={files}
              loadingFiles={loadingFiles}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function Files({
  activeTeam,
  files,
  loadingFiles,
}: {
  files: any;
  loadingFiles: boolean;
  activeTeam: any;
}) {
  const { isPending, mutate, data } = useDeleteProject();
  const {
    mutate: rename,
    isPending: isRenaming,
    data: renameData,
  } = useUpdateProjectName();

  function handleDeleteProject(projectId: string) {
    if (!projectId) return;
    mutate({ projectId });
  }

  function handleRenameProject({
    projectId,
    name,
  }: {
    projectId: string;
    name: string;
  }) {
    if (!projectId) return;
    rename({ projectId, name });
  }

  return (
    <>
      {files ? (
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
                {files?.length > 0 &&
                  files.map((file: any, index: any) => (
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
                          {file?.owner}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <DotsHorizontalIcon cursor="pointer" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <Rename
                              handler={function (name: string) {
                                handleRenameProject({
                                  projectId: file?._id,
                                  name,
                                });
                              }}
                              isLoading={isRenaming}
                              defaultV={file?.name}
                            />
                            <Copy />
                            <Share />
                            <Delete
                              handler={function () {
                                handleDeleteProject(file?._id);
                              }}
                            />
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
    </>
  );
}
