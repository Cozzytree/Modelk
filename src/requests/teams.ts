import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export const useGetUserTeams = () => {
   const { data, isLoading, error, refetch } = useQuery({
      queryFn: async () => {
         try {
            const res = await fetch(
               `http://localhost:4000/v1/team/get_user_teams`,
               {
                  method: "GET",
                  credentials: "include",
                  cache: "default",
               },
            );
            const data = await res.json();
            if (!data.success) {
               throw new Error(data?.message || "unknown error");
            }
            return data?.data;
         } catch (error: any) {
            throw new Error(error?.message);
         }
      },
      queryKey: ["userTeams"],
      enabled: false,
   });
   return { data, isLoading, error, refetch };
};

export const useCreateTeam = () => {
   const router = useRouter();
   const { isAuthenticated, isLoading: userLoading } = useKindeBrowserClient();
   useEffect(() => {
      if (!isAuthenticated && !userLoading) {
         router.replace("/");
      }
   }, [isAuthenticated, userLoading, router]);

   const { mutate, isPending } = useMutation({
      mutationFn: async (details: { name: String }) => {
         try {
            const res = await fetch(
               `http://localhost:4000/v1/team/create_new_team`,
               {
                  method: "POST",
                  credentials: "include",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify(details),
                  cache: "no-store",
                  signal: AbortSignal.timeout(20000),
               },
            );
            const data = await res.json();
            if (!data?.success)
               throw new Error(data?.message || "error while creating team");
            return data?.data;
         } catch (error: any) {
            if (error?.type === "AbortSignal") {
               throw new Error("timeout");
            } else {
               throw new Error(error?.message);
            }
         }
      },
      onSuccess: () => {
         toast("team successfully created", {
            position: "bottom-left",
            duration: 5000,
         });

         router.push("/dashboard");
      },
      onError: (err) => {
         if (err?.message) {
            toast(err.message, {
               position: "bottom-left",
               duration: 5000,
            });
         }
      },
   });

   return { isPending, mutate };
};

export const useGetTeams = () => {
   useQuery({
      queryFn: async () => {
         try {
            const res = await fetch(`${process.env.URL}/teams/get_user_teams`, {
               method: "GET",
               credentials: "include",
            });
            const data = await res.json();
            if (!data?.success)
               throw new Error(data?.message || "error while creating team");
            return data;
         } catch (err: any) {
            throw new Error(err?.message);
         }
      },
      queryKey: ["teans"],
   });
};

export const useAddMembers = () => {
   useMutation({
      mutationFn: async ({
         userId,
         teamId,
      }: {
         userId: string;
         teamId: string;
      }) => {
         try {
            const res = await fetch(
               `${process.env.URL}/team/add_members/${teamId}`,
               {
                  method: "POST",
                  headers: {
                     "COntent-Type": "application/json",
                  },
                  body: JSON.stringify({ userId }),
               },
            );
            const data = await res.json();
            if (!data.success)
               throw new Error(data?.message || "error while adding members");
         } catch (err: any) {
            if (err) {
               throw err.message;
            }
         }
      },
   });
};

export const useRemoveMembers = () => {
   useMutation({
      mutationFn: async ({
         teamId,
         to_remove,
      }: {
         teamId: string;
         to_remove: string[];
      }) => {
         try {
            const res = await fetch(
               `http://localhost:4000/v1/team/remove_members/${teamId}`,
               {
                  method: "PATCH",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ to_remove }),
               },
            );
            const data = await res.json();
            if (!data.success)
               throw new Error(data?.message || "error while removing members");
            return data?.data;
         } catch (err: any) {
            if (err) throw err?.message;
         }
      },
   });
};
