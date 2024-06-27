import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { error } from "console";
import { toast } from "sonner";

export const useLogin = () => {
  const { replace } = useRouter();
  const {
    mutate: userLogin,
    isPending,
    error,
    data: userData,
  } = useMutation({
    mutationFn: async (user: Object) => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/user/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
            credentials: "include",
            cache: "default",
            //  signal : {}
          }
        );

        const data = await response.json();
        if (!data.success) throw new Error(data?.message);

        return data;
      } catch (error: any) {
        throw error?.message;
      }
    },
    onSuccess: () => {
      toast("logged in", { position: "bottom-right" });
      replace("/");
    },
    onError: (err) => {
      toast(err?.message, { position: "bottom-right" });
    },
  });

  return { userLogin, isPending, error, userData };
};

export const useGetCurrentUser = () => {
  const {
    data: currentUser,
    isLoading,
    error,
  } = useQuery({
    queryFn: async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/user/currentUser",
          {
            method: "GET",
            credentials: "include",
            cache: "default",
          }
        );
        const data = await response.json();
        return data;
      } catch (error: any) {
        throw new error.message();
      }
    },
    queryKey: ["currentUser"],
  });

  return { currentUser, isLoading, error };
};

export const useSignUp = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: async (userData: any) => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/user/sign_up",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(userData),
            signal: AbortSignal.timeout(30000),
          }
        );
        const data = await response.json();
        if (!data?.success) {
          throw new Error(data?.message);
        }
      } catch (error: any) {
        if (error) throw new Error(error?.message);
      }
    },
    onSuccess: () => {
      toast.success("user successfully created", { position: "bottom-left" });
    },
    onError: (err: any) => {
      toast.error(err?.message, { position: "bottom-left" });
    },
  });
  return { mutate, isPending };
};

export const useLogout = () => {
  const { replace } = useRouter();
  const { mutate, error, isPending } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/user/logout", {
          credentials: "include",
          method: "PATCH",
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data?.message);

        return data;
      } catch (error: any) {
        if (error.type === "AbortSignal") {
          throw new Error("timed out");
        } else {
          throw new Error(error?.message);
        }
      }
    },
    onSuccess: () => {
      toast.success("loffed out", { position: "bottom-left" });
      replace("/");
    },
  });

  return { isPending, mutate };
};
