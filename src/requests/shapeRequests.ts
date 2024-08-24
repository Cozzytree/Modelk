import { useMutation, useQuery } from "@tanstack/react-query";

export function useInsertShapes() {
   useMutation({
      mutationFn: async ({
         shapes,
         projectId,
         teamId,
      }: {
         shapes: object[];
         projectId: string;
         teamId: string;
      }) => {
         try {
            const res = await fetch(
               `${process.env.URL}/insert_many/${projectId}/${teamId}`,
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
}

export function useDeleteSHapes() {
   useMutation({
      mutationFn: async ({
         projectId,
         teamId,
         shapes,
      }: {
         projectId: string;
         teamId: string;
         shapes: string[];
      }) => {
         try {
            const res = await fetch(
               `${process.env.URL}/delete_shapes/${projectId}/${teamId}`,
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
}

export function useUpdateShapes() {
   useMutation({
      mutationFn: async ({
         projectId,
         teamId,
         shapes,
      }: {
         projectId: string;
         teamId: string;
         shapes: { shapeId: string; params: Object }[];
      }) => {
         try {
            const res = await fetch(
               `${process.env.URL}/update_shapes/${projectId}/${teamId}`,
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
}

export function useGetShapes(projectId: string) {
   useQuery({
      queryFn: async () => {
         try {
            const res = await fetch(
               `${process.env.URL}/get_project_shapes/${projectId}`,
               {
                  method: "GET",
                  credentials: "include",
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
      queryKey: ["shapes"],
   });
}
