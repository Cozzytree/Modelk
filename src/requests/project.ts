import { useMutation, useQuery, QueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export const useCreateProject = () => {
  const queryClient = new QueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      teamId,
      projectdata,
    }: {
      teamId: String;
      projectdata: Object;
    }) => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/project/create_project/${teamId}`,
          {
            method: "POST",
            body: JSON.stringify(projectdata),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
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
      toast.success("File Successfully created", {
        position: "bottom-left",
      });
      queryClient.invalidateQueries("teamProjects");
    },
    onError: (err) => {
      if (err) toast.error(err?.message, { position: "bottom-left" });
    },
  });
  return { mutate, isPending };
};

export const useTeamFiles = (teamId: String) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryFn: async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/project/get_projects/${teamId}`,
          {
            method: "GET",
            credentials: "include",
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
    queryKey: ["teamProjects"],
    enabled: false,
  });
  return { data, isLoading, refetch };
};

export const useGetProjectAssets = () => {
  const params = useParams();
  const {
    data: projectData,
    isLoading,
    error,
  } = useQuery({
    queryFn: async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APIURL}/project/getProjectAssets/${params?.workspaceId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await res.json();

        return data;
      } catch (error: any) {
        if (error) throw new Error(error?.message);
      }
    },
    queryKey: ["projectAssets"],
  });
  return { projectData, isLoading, error };
};
