import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import clsx from "clsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useCreateProject } from "@/requests/project";
import { useLogout } from "@/requests/authRequests";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";

const Sidebar = ({
  userTeams,
  activeTeam,
  setActiveTeam,
  user
}: any) => {
  const { mutate: createProject, isPending: creatingProject } =
    useCreateProject();

  const { mutate, isPending } = useLogout();

  const handleCreateProject = (id: String, data: Object) => {
    createProject({ teamId: id, projectdata: data });
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="grid grid-rows-2 h-[100dvh] py-5 px-5 border-r">
      <div className="flex flex-col gap-4 items-start">
        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`font-extrabold bg-primary hover:bg-secondary text-start px-2 rounded-sm py-[2px] h-fit`}
            >
              {activeTeam?.name}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={clsx(`flex flex-col items-center px-1 w-full`)}
            >
              {userTeams?.data &&
                userTeams?.data?.map((team: any) => (
                  <DropdownMenuItem
                    className={`${activeTeam?._id === team._id && "bg-primary"
                      } w-full`}
                    onClick={() => setActiveTeam(team)}
                    key={team._id}
                  >
                    {team.name}
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem className="w-full">
                <Link href={"/teams/create"}>Create NewTeam</Link>
              </DropdownMenuItem>

              <Dialog>
                <DialogTrigger className="hover:bg-accent w-full text-start rounded-sm px-2 py-1.5 text-sm outline-none transition-colors">
                  Settings
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>Settings</DialogHeader>
                  <div className="w-full grid grid-cols-[0.3fr_1fr] gap-3">
                    <nav className="flex flex-col items-start gap-1 w-full">
                      <p className=" capitalize font-bold text-md py-2">
                        PERSONAL
                      </p>
                      <button className="text-md px-1 py-[2px] hover:bg-secondary w-full text-start rounded-sm">
                        Account
                      </button>
                      <button className="text-md px-1 py-[2px] hover:bg-secondary w-full text-start rounded-sm">
                        Apperance
                      </button>
                    </nav>

                    <div>Username</div>
                  </div>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger className="hover:bg-accent w-full text-start rounded-sm px-2 py-1.5 text-sm outline-none transition-colors">
                  Logout
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>Logout !</AlertDialogHeader>
                  <div className="w-full flex gap-2 items-center justify-end">
                    <AlertDialogCancel
                      className={`${buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}`}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <LogoutLink
                      onClick={() => {
                        mutate();
                      }}
                      className={`${buttonVariants({
                        variant: "destructive",
                        size: "sm",
                      })}`}
                    >
                      {isPending ? (
                        <ReloadIcon className=" animate-spin" />
                      ) : (
                        "Logout"
                      )}
                    </LogoutLink>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </Dialog>

        <div className="flex items-center gap-1">
          <Avatar className="w-[40px] h-[40px]">
            <AvatarImage src={user?.picture} />
            <AvatarFallback>{user?.given_name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <p className="text-sm">{user?.email}</p>
        </div>
      </div>

      <div className="w-full flex flex-col justify-end">
        <Dialog>
          <DialogTrigger
            className={` ${buttonVariants({
              variant: "secondary",
              size: "sm",
            })} w-full py-1.5 hover:bg-accent text-start`}
          >
            New file
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New File</DialogTitle>
              <DialogDescription className="text-xl">
                A Name for the File
              </DialogDescription>

              <Input
                placeholder="file name"
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Description"
                onChange={(e) => setDescription(e.target.value)}
              />
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (name.length <= 6) return;
                    handleCreateProject(activeTeam._id, { name, description });
                  }}
                  disabled={name.length <= 6 || creatingProject}
                  size="sm"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Sidebar;
