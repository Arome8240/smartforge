import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { useMemo } from "react";
import { createPrivyApiClient } from "@/lib/privy-api";
import { Project, CreateProject } from "@/schemas/project.schema";

export function useProjects() {
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await apiClient.get<Project[]>("/projects");
      return data;
    },
  });
}

export function useProject(id: string) {
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Project>(`/projects/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useMutation({
    mutationFn: async (project: CreateProject) => {
      const { data } = await apiClient.post<Project>("/projects", project);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useMutation({
    mutationFn: async ({
      id,
      ...project
    }: Partial<Project> & { id: string }) => {
      const { data } = await apiClient.patch<Project>(
        `/projects/${id}`,
        project
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data._id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeployProject() {
  const queryClient = useQueryClient();
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<Project>(`/projects/${id}/deploy`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data._id] });
    },
  });
}
