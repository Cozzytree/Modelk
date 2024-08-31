import { useMutation, useQuery } from "@tanstack/react-query";

export function useInsertShapes() {
   const { mutate, isPending } = useMutation({
      mutationFn: async ({
         shapes,
         projectId,
      }: {
         shapes: object[];
         projectId: string;
      }) => {
         try {
            const res = await fetch(
               `${process.env.NEXT_PUBLIC_API_URL}/shapes/insert_many/${projectId}`,
               {
                  method: "POST",
                  credentials: "include",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ shapes }),
               },
            );
            const data = await res.json();
            if (!data.success)
               throw new Error(data?.message || "unknown error");
            return data;
         } catch (err: any) {
            if (err) {
               throw err?.message;
            }
         }
      },
   });
   return { mutate, isPending };
}

export function useDeleteSHapes() {
   const { mutate, isPending } = useMutation({
      mutationFn: async ({
         projectId,
         shapes,
      }: {
         projectId: string;
         shapes: string[];
      }) => {
         try {
            const res = await fetch(
               `${process.env.NEXT_PUBLIC_API_URL}/shapes/delete_shapes/${projectId}`,
               {
                  method: "DELETE",
                  credentials: "include",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ shapes }),
               },
            );
            const data = await res.json();
            if (!data.success)
               throw new Error(data?.message || "unknown error");
            return data;
         } catch (err: any) {
            if (err) {
               throw err.message;
            }
         }
      },
   });
   return { mutate, isPending };
}

export function useUpdateShapes() {
   const { mutate, isPending } = useMutation({
      mutationFn: async ({
         projectId,
         shapes,
      }: {
         projectId: string;
         shapes: { shapeId: string; params: Object }[];
      }) => {
         try {
            const res = await fetch(
               `${process.env.NEXT_PUBLIC_API_URL}/shapes/update_shapes/${projectId}`,
               {
                  method: "PATCH",
                  credentials: "include",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ shapes }),
               },
            );
            const data = await res.json();
            if (!data.success)
               throw new Error(data?.message || "unknown error");
            return data;
         } catch (err: any) {
            if (err) {
               throw err.message;
            }
         }
      },
   });

   return { mutate, isPending };
}

export function useGetShapes(projectId: string) {
   const { data, isLoading } = useQuery({
      queryFn: async () => {
         try {
            const res = await fetch(
               `${process.env.NEXT_PUBLIC_API_URL}/shapes/get_project_shapes/${projectId}`,
               {
                  method: "GET",
                  credentials: "include",
               },
            );
            const data = await res.json();
            if (!data.success)
               throw new Error(data?.message || "unknown error");
            return data?.data;
         } catch (err: any) {
            if (err) {
               throw err.message;
            }
         }
      },
      queryKey: ["shapes"],
   });

   return { data, isLoading };
}
