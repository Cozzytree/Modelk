import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useUpdateDocument = () => {
   const { mutate, isPending } = useMutation({
      mutationFn: async ({
         projectId,
         data,
      }: {
         projectId: string;
         data: Object;
      }) => {
         try {
            const res = await fetch(
               `${process.env.NEXT_PUBLIC_API_URL}/document/update/${projectId}`,
               {
                  method: "PATCH",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  credentials: "include",
                  body: JSON.stringify({ data: data }),
               },
            );
            const output = await res.json();
            if (!output.success) {
               throw new Error(output?.message || "error while updating");
            }
            return output?.data;
         } catch (err: any) {
            if (err) throw err?.message;
         }
      },
      onSuccess: () => {
         toast.success("updated successfully", { position: "bottom-right" });
      },
      onError: (err) => {
         toast.error(err.message, { position: "bottom-right" });
      },
   });
   return { mutate, isPending };
};
