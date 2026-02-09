"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams, useParams } from "next/navigation";
import {
  Archive,
  Download,
  Eye,
  FileArchive,
  FileImage,
  FileText,
  FileType2,
  Upload,
  X,
} from "lucide-react";

import { emitFileVaultChanged, FILE_VAULT_EVENT } from "@/workspace/file/_model/vault";
import {
  deleteProjectFile,
  listFileFolders,
  listProjectFiles,
  type ProjectFileDto,
  uploadProjectFile,
} from "@/workspace/file/_service/api";

type ViewFile = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  ext: string;
  category: "image" | "document" | "other";
  createdAt: string;
  url: string;
  folderId: string | null;
};

const MAX_SIZE_MB = {
  image: 10,
  document: 20,
  other: 30,
};

const PREVIEWABLE_TEXT_EXTS = new Set(["txt", "md", "csv", "json", "js", "ts", "tsx", "jsx"]);
const PREVIEWABLE_DOC_EXTS = new Set(["pdf", ...PREVIEWABLE_TEXT_EXTS]);

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const getExt = (name: string) => {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
};

const detectCategory = (fileName: string, mimeType: string): ViewFile["category"] => {
  const ext = getExt(fileName);
  if (mimeType.startsWith("image/")) return "image";
  if (["pdf", "txt", "md", "csv", "json", "js", "ts", "tsx", "jsx", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "hwp"].includes(ext)) {
    return "document";
  }
  return "other";
};

const getCategoryLabel = (category: ViewFile["category"]) => {
  if (category === "image") return "사진";
  if (category === "document") return "문서";
  return "기타";
};

const getTypeIcon = (file: ViewFile) => {
  if (file.category === "image") return <FileImage size={16} className="text-sky-600" />;
  if (file.category === "document" && file.ext === "pdf") return <FileType2 size={16} className="text-rose-600" />;
  if (file.category === "document") return <FileText size={16} className="text-amber-600" />;
  return <FileArchive size={16} className="text-slate-600" />;
};

const toViewFile = (item: ProjectFileDto): ViewFile => {
  const name = item.fileName;
  const ext = getExt(name);
  const mimeType = item.mimeType;
  return {
    id: item.id,
    name,
    size: Number(item.fileSize || 0),
    mimeType,
    ext,
    category: detectCategory(name, mimeType),
    createdAt: item.createdAt,
    url: item.fileUrl,
    folderId: item.folder?.id ?? item.folderId ?? null,
  };
};

export default function WorkspaceFilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { projectId } = useParams<{ projectId: string }>();

  const selectedFolderId = searchParams?.get("folder") ?? null;

  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [files, setFiles] = useState<ViewFile[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewFile, setPreviewFile] = useState<ViewFile | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadFolders = async () => {
    if (!projectId) return;
    const data = await listFileFolders(projectId);
    setFolders(data.map((item) => ({ id: item.id, name: item.name })));
  };

  const loadFiles = async () => {
    if (!projectId) return;
    const data = await listProjectFiles(projectId, selectedFolderId ?? undefined);
    setFiles(data.map(toViewFile));
  };

  useEffect(() => {
    if (!projectId) return;
    void loadFolders();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    void loadFiles();
  }, [projectId, selectedFolderId]);

  useEffect(() => {
    const onChanged = () => {
      void loadFolders();
      void loadFiles();
    };
    window.addEventListener(FILE_VAULT_EVENT, onChanged);
    return () => window.removeEventListener(FILE_VAULT_EVENT, onChanged);
  }, [projectId, selectedFolderId]);

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
      const category = detectCategory(file.name, file.type);
      const maxBytes = MAX_SIZE_MB[category] * 1024 * 1024;
      if (file.size > maxBytes) {
        rejected.push(`${file.name}: ${MAX_SIZE_MB[category]}MB 초과`);
        return;
      }
      accepted.push(file);
    });

    if (rejected.length > 0) {
      setErrorMessage(`업로드 제한: ${rejected.slice(0, 3).join(" / ")}`);
    } else {
      setErrorMessage("");
    }

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

  const openPreview = async (file: ViewFile) => {
    setPreviewFile(file);
    setPreviewText("");
    if (file.category === "other") return;

    if (file.category === "document" && PREVIEWABLE_TEXT_EXTS.has(file.ext)) {
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

  return (
    <div className="h-full bg-background px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive size={18} className="text-blue-500" />
          <h1 className="text-lg font-semibold text-foreground">파일 보관함</h1>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-panel px-4 py-3">
          <p className="text-xs text-muted">파일 수</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{files.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-panel px-4 py-3">
          <p className="text-xs text-muted">총 용량</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{formatSize(totalSize)}</p>
        </div>
        <div className="rounded-lg border border-border bg-panel px-4 py-3">
          <p className="text-xs text-muted">업로드 제한</p>
          <p className="mt-1 text-xs font-medium text-foreground">사진 10MB / 문서 20MB / 기타 30MB</p>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">{errorMessage}</div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{scopeLabel}</p>
            <p className="text-xs text-muted">{files.length}개 파일</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
            <Upload size={15} />
            파일 업로드
            <input
              type="file"
              multiple
              className="hidden"
              onChange={onUpload}
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.ico,.pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.zip,.rar,.7z,.mp4,.mov,.avi,.mp3,.wav"
            />
          </label>
        </div>
        <div className="grid grid-cols-[1.5fr_100px_90px_150px_130px_130px] items-center border-b border-border px-4 py-2 text-xs font-semibold text-muted">
          <span>파일명</span>
          <span>카테고리</span>
          <span>크기</span>
          <span>업로드 일시</span>
          <span>유형</span>
          <span className="text-right">관리</span>
        </div>
        <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
          {files.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted">표시할 파일이 없습니다.</div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-[1.5fr_100px_90px_150px_130px_130px] items-center gap-2 border-b border-border/60 px-4 py-2 text-sm last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {getTypeIcon(file)}
                  <span className="truncate text-foreground">{file.name}</span>
                </div>
                <span className="text-muted">{getCategoryLabel(file.category)}</span>
                <span className="text-muted">{formatSize(file.size)}</span>
                <span className="text-muted">{formatDate(file.createdAt)}</span>
                <span className="truncate text-muted">{file.ext.toUpperCase()}</span>
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => void openPreview(file)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition hover:bg-subtle hover:text-foreground"
                    title="열기"
                  >
                    <Eye size={14} />
                  </button>
                  <a
                    href={file.url}
                    download={file.name}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition hover:bg-subtle hover:text-foreground"
                    title="다운로드"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => void removeFile(file.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-500 transition hover:bg-rose-50"
                    title="삭제"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {previewFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="flex h-[80vh] w-[min(1080px,100%)] flex-col overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{previewFile.name}</p>
                <p className="text-xs text-muted">
                  {getCategoryLabel(previewFile.category)} · {formatSize(previewFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition hover:bg-subtle hover:text-foreground"
                title="닫기"
              >
                <X size={14} />
              </button>
            </div>
            <div className="h-full overflow-auto bg-muted/20 p-4">
              {previewFile.category === "other" ? (
                <div className="flex h-full items-center justify-center text-sm text-muted">미리보기를 할 수 없습니다.</div>
              ) : null}
              {previewFile.category === "image" ? (
                <img src={previewFile.url} alt={previewFile.name} className="mx-auto max-h-full max-w-full rounded-md object-contain" />
              ) : null}
              {previewFile.category === "document" && previewFile.ext === "pdf" ? (
                <iframe title={previewFile.name} src={previewFile.url} className="h-full w-full rounded-md border border-border bg-background" />
              ) : null}
              {previewFile.category === "document" && PREVIEWABLE_TEXT_EXTS.has(previewFile.ext) ? (
                previewLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted">문서를 불러오는 중입니다...</div>
                ) : (
                  <pre className="whitespace-pre-wrap break-words rounded-md bg-background p-4 font-mono text-xs leading-6 text-foreground">
                    {previewText || "문서 내용이 없습니다."}
                  </pre>
                )
              ) : null}
              {previewFile.category === "document" && !PREVIEWABLE_DOC_EXTS.has(previewFile.ext) ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted">
                  <p>브라우저에서 직접 미리보기 어려운 문서입니다.</p>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    새 창에서 열기
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
