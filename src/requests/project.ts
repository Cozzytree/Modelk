import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

const teamProjects = "teamProjects";

export const useCreateProject = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      teamId,
      projectdata,
    }: {
      teamId: String;
      projectdata: { name: string; description: string };
    }) => {
      try {
        const res = await fetch(
          `http://localhost:4000/v1/project/create_new_project/${teamId}`,
          {
            method: "PUT",
            body: JSON.stringify(projectdata),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
            signal: AbortSignal.timeout(20000),
          },
        );
        const data = await res.json();
        if (!data?.success)
          throw new Error(data?.message || "invalid error");
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
      toast.success("File Successfully created", {
        position: "bottom-left",
      });
    },
    onError: (err) => {
      if (err) toast.error(err?.message, { position: "bottom-left" });
    },
  });
  return { mutate, isPending };
};

export const useTeamFiles = (teamId: String) => {
  const { data, isLoading, refetch } = useQuery({
    queryFn: async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/v1/project/get_team_projects/${teamId}`,
          {
            method: "GET",
            credentials: "include",
            signal: AbortSignal.timeout(20000),
          },
        );
        const data = await res.json();
        if (!data?.success)
          throw new Error(data?.message || "unknow error");
        return data?.data;
      } catch (error: any) {
        if (error?.type === "AbortSignal") {
          throw new Error("timeout");
        } else {
          throw new Error(error?.message);
        }
      }
    },
    queryKey: [teamProjects],
    enabled: false,
  });
  return { data, isLoading, refetch };
};

export const useUpdateProjectName = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, data } = useMutation({
    mutationFn: async ({
      projectId,
      name,
    }: {
      projectId: string;
      name: string;
    }) => {
      try {
        const res = await fetch(
          `http://localhost:4000/v1/project/update_name/${projectId}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
          },
        );
        const data = await res.json();
        if (!data?.success)
          throw new Error(data?.message || "unknow error");
        return data;
      } catch (err: any) {
        if (err) {
          throw err?.message;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teamProjects] });
      toast.success("updated name successfully", {
        position: "bottom-right",
      });
    },
    onError: (err) => {
      toast.error(err.message, { position: "bottom-right" });
    },
  });
  return { mutate, isPending, data };
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, data } = useMutation({
    mutationFn: async ({
      projectId
    }: {
      projectId: string;
    }) => {
      try {
        const res = await fetch(
          `http://localhost:4000/v1/project/delete_project/${projectId}`,
          { method: "DELETE", credentials: "include" },
        );
        const data = await res.json();
        if (!data.success)
          throw new Error(data?.message || "error while deleting");
        return data?.data;
      } catch (err: any) {
        if (err) {
          throw err?.message;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("successfully deleted", { position: "bottom-right" });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return { mutate, isPending, data };
};
