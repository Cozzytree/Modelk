import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useGetUserTeams = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryFn: async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/teams/get_user_teams`,
          {
            method: "GET",
            credentials: "include",
            cache: "default",
          }
        );
        const data = await res.json();
        if (!data.success) {
          throw new Error(data?.message);
        }
        return data;
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
  const { mutate, isPending } = useMutation({
    mutationFn: async (details: { name: String }) => {
      console.log(details);

      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/teams/create_team`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(details),
            cache: "no-store",
            signal: AbortSignal.timeout(20000),
          }
        );
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message);
        return data;
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
