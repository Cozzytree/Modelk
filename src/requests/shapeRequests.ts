import { useMutation } from "@tanstack/react-query";

export function useNewRect() {
  const { mutate: newRect, isPending } = useMutation({
    mutationFn: async ({
      projectId,
      type,
      params,
    }: {
      projectId: String;
      type: String;
      params: Object;
    }) => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/shape/new_rect/${projectId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ type, params }),
            credentials: "include",
          }
        );
        const data = await res.json();
        if (!data.success) {
          throw new Error(data?.message);
        }
        return data;
      } catch (error: any) {
        if (error) throw new Error(error?.message);
      }
    },
  });

  return { mutate: newRect, isPending };
}

export function useNewSphere() {
  const { mutate: newSphere, isPending } = useMutation({
    mutationFn: async ({
      projectId,
      sphereData,
    }: {
      projectId: String;
      sphereData: {
        shapeType: String;
        params: any;
      };
    }) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APIURL}/shape/new_sphere/${projectId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: sphereData.shapeType,
              params: sphereData.params,
            }),
            credentials: "include",
          }
        );
        const data = await res.json();
        if (!data.success) {
          throw new Error(data?.message);
        }
        return data;
      } catch (error: any) {
        if (error) throw new Error(error?.message);
      }
    },
  });
  return { newSphere, isPending };
}

export function useNewLine() {
  const { mutate: newSphere, isPending } = useMutation({
    mutationFn: async ({
      projectId,
      lineData,
    }: {
      projectId: String;
      lineData: {
        shapeType: String;
        params: any;
      };
    }) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APIURL}/shape/new_line/${projectId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": JSON.stringify(lineData),
            },
            credentials: "include",
          }
        );
        const data = await res.json();
        if (!data.success) {
          throw new Error(data?.message);
        }
        return data;
      } catch (error: any) {
        if (error) throw new Error(error?.message);
      }
    },
  });
  return { newSphere, isPending };
}
