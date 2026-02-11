// app/(workspace)/workspace/[teamId]/[projectId]/file/_model/hooks/useFilePageData.ts

import { useEffect, useMemo, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams, useParams } from "next/navigation";
import { emitFileVaultChanged } from "@/workspace/file/_model/vault";
import { useProjectFileFolders } from "@/workspace/file/_model/hooks/useProjectFileFolders";
import { deleteProjectFile, listProjectFiles, uploadProjectFile } from "@/workspace/file/_service/api";
import { detectUploadCategory, MAX_SIZE_MB, parseProjectFiles } from "../schemas/file.schemas";
import { useFilePageStore } from "../store/useFilePageStore";
import type { ViewFile } from "../file-page.types";

export function useFilePageData() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { projectId } = useParams<{ projectId: string }>();
  const { folders } = useProjectFileFolders(projectId);
  const selectedFolderId = searchParams?.get("folder") ?? null;

  const {
    files,
    errorMessage,
    previewFile,
    previewText,
    previewLoading,
    setFiles,
    setErrorMessage,
    setPreviewFile,
    setPreviewText,
    setPreviewLoading,
  } = useFilePageStore();

  const loadFiles = async () => {
    if (!projectId) return;
    const data = await listProjectFiles(projectId, selectedFolderId ?? undefined);
    setFiles(parseProjectFiles(data));
  };

  useEffect(() => {
    if (!projectId) return;
    void loadFiles();
  }, [projectId, selectedFolderId]);

  useEffect(() => {
    void loadFiles();
  }, [folders, projectId, selectedFolderId]);

  useEffect(() => {
    if (!selectedFolderId) return;
    const exists = folders.some((folder) => folder.id === selectedFolderId);
    if (!exists && pathname) {
      router.replace(pathname);
    }
  }, [folders, pathname, router, selectedFolderId]);

  const totalSize = useMemo(() => files.reduce((sum, item) => sum + item.size, 0), [files]);

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length || !projectId) return;

    const rejected: string[] = [];
    const accepted: globalThis.File[] = [];

    selected.forEach((file) => {
      const category = detectUploadCategory(file);
      const maxBytes = MAX_SIZE_MB[category] * 1024 * 1024;
      if (file.size > maxBytes) {
        rejected.push(`${file.name}: ${MAX_SIZE_MB[category]}MB 초과`);
        return;
      }
      accepted.push(file);
    });

    if (rejected.length > 0) setErrorMessage(`업로드 제한: ${rejected.slice(0, 3).join(" / ")}`);
    else setErrorMessage("");

    if (!accepted.length) {
      event.target.value = "";
      return;
    }

    for (const file of accepted) {
      await uploadProjectFile(projectId, file, selectedFolderId ?? undefined);
    }

    emitFileVaultChanged();
    await loadFiles();
    event.target.value = "";
  };

  const removeFile = async (id: string) => {
    await deleteProjectFile(id);
    await loadFiles();
  };

  const openPreview = async (file: ViewFile, previewableTextExts: Set<string>) => {
    setPreviewFile(file);
    setPreviewText("");
    if (file.category === "other") return;

    if (file.category === "document" && previewableTextExts.has(file.ext)) {
      try {
        setPreviewLoading(true);
        const text = await fetch(file.url).then((res) => res.text());
        setPreviewText(text);
      } catch {
        setPreviewText("문서 미리보기를 불러오지 못했습니다.");
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const scopeLabel = selectedFolderId
    ? folders.find((folder) => folder.id === selectedFolderId)?.name ?? "폴더"
    : "전체보기";

  return {
    projectId,
    pathname,
    folders,
    selectedFolderId,
    files,
    errorMessage,
    previewFile,
    previewText,
    previewLoading,
    totalSize,
    scopeLabel,
    setPreviewFile,
    onUpload,
    removeFile,
    openPreview,
  };
}
