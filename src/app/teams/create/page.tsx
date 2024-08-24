"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateTeam } from "@/requests/teams";
import { useState } from "react";

export default function Create() {
   const { isPending, mutate } = useCreateTeam();
   const [teamname, setTeamName] = useState("");
   function handleCreateTeam(e: any) {
      e.preventDefault();
      if (teamname.length <= 6) return;
      mutate({ name: teamname });
   }
   return (
      <div className="min-h-[80vh] w-screen flex justify-center items-center">
         <div className="flex flex-col items-center gap-3">
            <h1 className="text-4xl font-black">
               What shoul we call your team ?
            </h1>
            <p className="text-md text-zinc-400">
               Team&apos;s name can be changed in th future
            </p>

            <form
               onSubmit={handleCreateTeam}
               className="flex flex-col gap-3 mt-9 items-end w-[80%]"
            >
               <Input
                  placeholder="Team Name"
                  onChange={(e) => setTeamName(e.target.value)}
               />

               <Button
                  disabled={teamname.length <= 6 || isPending}
                  type="submit"
                  variant="default"
                  size="lg"
               >
                  Create Team,
               </Button>
            </form>
         </div>
      </div>
   );
}
