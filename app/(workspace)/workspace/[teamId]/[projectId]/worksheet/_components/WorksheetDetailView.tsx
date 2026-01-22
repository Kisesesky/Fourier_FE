// components/worksheet/WorksheetDetailView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorksheet } from "@/workspace/worksheet/_model/store";
import type { WorksheetStatus, WorksheetColumn, WorksheetColumnType, WorksheetRow } from "@/workspace/worksheet/_model/types";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { formatRelative } from "./shared";

const COLUMN_MIN_WIDTH = 96;
const COLUMN_DEFAULT_WIDTH = 160;
const ROW_MIN_HEIGHT = 32;
const FORMULA_FUNCTIONS = ["SUM", "AVERAGE", "MIN", "MAX"] as const;

function columnIndexToLetters(index: number) {
  let i = index;
  let label = "";
  while (i >= 0) {
    label = String.fromCharCode((i % 26) + 65) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

function columnLettersToIndex(letters: string) {
  return (
    letters
      .toUpperCase()
      .split("")
      .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1
  );
}

function parseCellReference(ref: string) {
  const match = ref.trim().match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const [, letters, rowNumber] = match;
  const colIndex = columnLettersToIndex(letters);
  const rowIndex = Number(rowNumber) - 1;
  if (Number.isNaN(rowIndex) || colIndex < 0) return null;
  return { rowIndex, colIndex };
}

export default function WorksheetDetailView({ worksheetId }: { worksheetId: string }) {
  const router = useRouter();
  const worksheet = useWorksheet((state) => state.worksheetMap[worksheetId] ?? null);
  const {
    setActiveWorksheet,
    duplicateWorksheet,
    deleteWorksheet,
    addRow,
    updateCell,
    updateWorksheetTitle,
    setWorksheetStatus,
    deleteRow,
    addColumn,
    updateColumn,
    deleteColumn,
  } = useWorksheet((state) => ({
    setActiveWorksheet: state.setActiveWorksheet,
    duplicateWorksheet: state.duplicateWorksheet,
    deleteWorksheet: state.deleteWorksheet,
    addRow: state.addRow,
    updateCell: state.updateCell,
    updateWorksheetTitle: state.updateWorksheetTitle,
    setWorksheetStatus: state.setWorksheetStatus,
    deleteRow: state.deleteRow,
    addColumn: state.addColumn,
    updateColumn: state.updateColumn,
    deleteColumn: state.deleteColumn,
  }));

  useEffect(() => {
    if (worksheet) {
      setActiveWorksheet(worksheetId);
    }
  }, [worksheet, worksheetId, setActiveWorksheet]);

  const { buildHref } = useWorkspacePath();
  const worksheetListHref = useMemo(() => buildHref("worksheet"), [buildHref]);
  const worksheetDetailHref = useCallback(
    (targetId: string) => buildHref(["worksheet", encodeURIComponent(targetId)]),
    [buildHref],
  );

  useEffect(() => {
    if (!worksheet) {
      router.replace(worksheetListHref);
    }
  }, [worksheet, router, worksheetListHref]);

  if (!worksheet) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted">
        Loading worksheet...
      </div>
    );
  }

  const formulaInputRef = useRef<HTMLInputElement>(null);

  const rowIndexMap = useMemo(
    () => new Map(worksheet.rows.map((row, index) => [row.id, index])),
    [worksheet.rows],
  );
  const columnIndexMap = useMemo(
    () => new Map(worksheet.columns.map((column, index) => [column.id, index])),
    [worksheet.columns],
  );

  const [selectedCell, setSelectedCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [showFormulaSuggestions, setShowFormulaSuggestions] = useState(false);

  useEffect(() => {
    if (selectedCell && rowIndexMap.has(selectedCell.rowId) && columnIndexMap.has(selectedCell.columnId)) {
      return;
    }
    const firstRow = worksheet.rows[0];
    const firstColumn = worksheet.columns[0];
    if (firstRow && firstColumn) {
      setSelectedCell({ rowId: firstRow.id, columnId: firstColumn.id });
      setSelectionAnchor({ rowIndex: 0, colIndex: 0 });
      setSelectedRange({ startRow: 0, endRow: 0, startCol: 0, endCol: 0 });
    }
  }, [selectedCell, worksheet.rows, worksheet.columns, rowIndexMap, columnIndexMap]);

  const getRawValue = useCallback(
    (rowIndex: number, colIndex: number) => {
      const row = worksheet.rows[rowIndex];
      const column = worksheet.columns[colIndex];
      if (!row || !column) return "";
      const cell = row.cells.find((item) => item.columnId === column.id);
      if (!cell || cell.value == null) return "";
      return cell.value;
    },
    [worksheet.rows, worksheet.columns],
  );

  const evaluateCellValue = useCallback(
    (rowIndex: number, colIndex: number, visited = new Set<string>()): string | number => {
      const key = `${rowIndex}:${colIndex}`;
      if (visited.has(key)) return "#CYCLE";
      visited.add(key);
      const raw = getRawValue(rowIndex, colIndex);
      if (typeof raw !== "string" || !raw.trim().startsWith("=")) {
        visited.delete(key);
        return raw ?? "";
      }
      const formula = raw.trim().slice(1);

      const functionMatch = formula.match(/^([A-Z]+)\(([^)]*)\)$/i);
      if (functionMatch) {
        const fn = functionMatch[1].toUpperCase();
        const argsText = functionMatch[2];
        if (FORMULA_FUNCTIONS.includes(fn as (typeof FORMULA_FUNCTIONS)[number])) {
          const tokens = argsText.split(",");
          const values: number[] = [];
          tokens.forEach((token) => {
            const trimmed = token.trim();
            if (!trimmed) return;
            if (trimmed.includes(":")) {
              const [startRef, endRef] = trimmed.split(":");
              const start = startRef ? parseCellReference(startRef) : null;
              const end = endRef ? parseCellReference(endRef) : null;
              if (start && end) {
                const rowStart = Math.min(start.rowIndex, end.rowIndex);
                const rowEnd = Math.max(start.rowIndex, end.rowIndex);
                const colStart = Math.min(start.colIndex, end.colIndex);
                const colEnd = Math.max(start.colIndex, end.colIndex);
                for (let r = rowStart; r <= rowEnd; r += 1) {
                  for (let c = colStart; c <= colEnd; c += 1) {
                    const val = evaluateCellValue(r, c, visited);
                    const num = typeof val === "number" ? val : Number(val);
                    if (Number.isFinite(num)) values.push(num);
                  }
                }
              }
            } else {
              const ref = parseCellReference(trimmed);
              if (ref) {
                const val = evaluateCellValue(ref.rowIndex, ref.colIndex, visited);
                const num = typeof val === "number" ? val : Number(val);
                if (Number.isFinite(num)) values.push(num);
              } else {
                const literal = Number(trimmed);
                if (Number.isFinite(literal)) values.push(literal);
              }
            }
          });
          visited.delete(key);
          if (!values.length) return 0;
          if (fn === "SUM") return values.reduce((sum, val) => sum + val, 0);
          if (fn === "AVERAGE") return values.reduce((sum, val) => sum + val, 0) / values.length;
          if (fn === "MIN") return Math.min(...values);
          if (fn === "MAX") return Math.max(...values);
        }
      }

      const withValues = formula.replace(/([A-Z]+[0-9]+)/gi, (match) => {
        const ref = parseCellReference(match);
        if (!ref) return "0";
        const value = evaluateCellValue(ref.rowIndex, ref.colIndex, visited);
        const num = typeof value === "number" ? value : Number(value);
        return Number.isFinite(num) ? String(num) : "0";
      });
      const sanitized = withValues.replace(/[^0-9+\-*/(). ]/g, "");
      try {
        const result = Function(`"use strict"; return (${sanitized || 0});`)();
        visited.delete(key);
        return Number.isFinite(result) ? result : "#ERR";
      } catch {
        visited.delete(key);
        return "#ERR";
      }
    },
    [getRawValue],
  );

  const getDisplayValue = useCallback(
    (rowIndex: number, colIndex: number) => {
      const raw = getRawValue(rowIndex, colIndex);
      if (typeof raw === "string" && raw.trim().startsWith("=")) {
        return evaluateCellValue(rowIndex, colIndex);
      }
      return raw ?? "";
    },
    [getRawValue, evaluateCellValue],
  );

  const selectedRawValue = useMemo(() => {
    if (!selectedCell) return "";
    const rowIndex = rowIndexMap.get(selectedCell.rowId);
    const colIndex = columnIndexMap.get(selectedCell.columnId);
    if (rowIndex == null || colIndex == null) return "";
    const raw = getRawValue(rowIndex, colIndex);
    return raw == null ? "" : typeof raw === "string" ? raw : String(raw);
  }, [selectedCell, rowIndexMap, columnIndexMap, getRawValue]);

  const selectedDisplayValue = useMemo(() => {
    if (!selectedCell) return "";
    const rowIndex = rowIndexMap.get(selectedCell.rowId);
    const colIndex = columnIndexMap.get(selectedCell.columnId);
    if (rowIndex == null || colIndex == null) return "";
    const value = getDisplayValue(rowIndex, colIndex);
    return value == null ? "" : typeof value === "number" ? value.toString() : value;
  }, [selectedCell, rowIndexMap, columnIndexMap, getDisplayValue]);

  const filteredFormulaSuggestions = useMemo(() => {
    if (!showFormulaSuggestions) return [];
    const token = selectedRawValue.trim().replace(/^=/, "").split("(")[0].toUpperCase();
    if (!token) return FORMULA_FUNCTIONS;
    return FORMULA_FUNCTIONS.filter((fn) => fn.startsWith(token) && fn !== token);
  }, [showFormulaSuggestions, selectedRawValue]);

  const handleBack = () => router.push(worksheetListHref);
  const handleDuplicate = () => {
    const id = duplicateWorksheet(worksheet.id);
    if (id) router.push(worksheetDetailHref(id));
  };
  const handleDelete = () => {
    deleteWorksheet(worksheet.id);
    router.push(worksheetListHref);
  };
  const handleTitleChange = useCallback(
    (value: string) => {
      updateWorksheetTitle(worksheet.id, value);
    },
    [updateWorksheetTitle, worksheet.id],
  );
  const handleStatusChange = (status: WorksheetStatus) => setWorksheetStatus(worksheet.id, status);
  const handleAddRow = () => addRow(worksheet.id);
  const handleDeleteRowAndMaintainSelection = (rowId: string) => {
    deleteRow(worksheet.id, rowId);
    if (selectedCell?.rowId === rowId) setSelectedCell(null);
  };
  const handleAddColumn = () => addColumn(worksheet.id);
  const handleColumnTitleChange = (columnId: string, title: string) => {
    const nextTitle = title.trim() || "Untitled column";
    updateColumn(worksheet.id, columnId, { title: nextTitle });
  };
  const handleColumnTypeChange = (column: WorksheetColumn, type: WorksheetColumnType) => {
    const payload: Partial<Omit<WorksheetColumn, "id">> = { type };
    if (type === "select") {
      payload.options = column.options?.length ? column.options : ["Option 1", "Option 2"];
    } else {
      payload.options = undefined;
    }
    updateColumn(worksheet.id, column.id, payload);
  };
  const handleColumnOptionsChange = (columnId: string, value: string) => {
    const options = value
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);
    updateColumn(worksheet.id, columnId, { options });
  };
  const handleDeleteColumn = (columnId: string) => {
    deleteColumn(worksheet.id, columnId);
    if (selectedCell?.columnId === columnId) setSelectedCell(null);
  };

  const handleAutoSizeColumn = (column: WorksheetColumn, colIndex: number) => {
    const headerLength = column.title.length;
    const cellLengths = worksheet.rows.map((_, rowIndex) => {
      const value = getDisplayValue(rowIndex, colIndex);
      const text = value == null ? "" : String(value);
      return text.length;
    });
    const maxLength = Math.max(headerLength, ...cellLengths, 4);
    const width = Math.min(Math.max(COLUMN_MIN_WIDTH, maxLength * 9 + 32), 420);
    setColumnWidths((prev) => ({ ...prev, [column.id]: width }));
  };

  const handleAutoSizeRow = (row: WorksheetRow, rowIndex: number) => {
    const lineCounts = worksheet.columns.map((_, colIndex) => {
      const raw = getRawValue(rowIndex, colIndex);
      const text = raw == null ? "" : String(raw);
      return text.split("\n").length;
    });
    const maxLines = Math.max(...lineCounts, 1);
    const height = Math.max(ROW_MIN_HEIGHT, maxLines * 18 + 12);
    setRowHeights((prev) => ({ ...prev, [row.id]: height }));
  };

  const handleSelectCell = useCallback(
    (params: {
      rowIndex: number;
      colIndex: number;
      rowId: string;
      columnId: string;
      shiftKey?: boolean;
    }) => {
      const { rowIndex, colIndex, rowId, columnId, shiftKey } = params;
      if (shiftKey && selectionAnchor) {
        setSelectedRange({
          startRow: Math.min(selectionAnchor.rowIndex, rowIndex),
          endRow: Math.max(selectionAnchor.rowIndex, rowIndex),
          startCol: Math.min(selectionAnchor.colIndex, colIndex),
          endCol: Math.max(selectionAnchor.colIndex, colIndex),
        });
      } else {
        setSelectionAnchor({ rowIndex, colIndex });
        setSelectedRange({
          startRow: rowIndex,
          endRow: rowIndex,
          startCol: colIndex,
          endCol: colIndex,
        });
      }
      setSelectedCell({ rowId, columnId });
      setEditingCell(null);
    },
    [selectionAnchor],
  );

  const moveSelection = useCallback(
    (rowDelta: number, colDelta: number, extend: boolean) => {
      if (!selectedCell) return;
      const currentRow = rowIndexMap.get(selectedCell.rowId) ?? 0;
      const currentCol = columnIndexMap.get(selectedCell.columnId) ?? 0;
      const nextRow = Math.max(0, Math.min(worksheet.rows.length - 1, currentRow + rowDelta));
      const nextCol = Math.max(0, Math.min(worksheet.columns.length - 1, currentCol + colDelta));
      const nextRowId = worksheet.rows[nextRow]?.id;
      const nextColId = worksheet.columns[nextCol]?.id;
      if (!nextRowId || !nextColId) return;
      handleSelectCell({
        rowIndex: nextRow,
        colIndex: nextCol,
        rowId: nextRowId,
        columnId: nextColId,
        shiftKey: extend,
      });
    },
    [selectedCell, rowIndexMap, columnIndexMap, worksheet.rows, worksheet.columns, handleSelectCell],
  );

  const updateFormulaValue = (value: string) => {
    if (!selectedCell) return;
    updateCell(worksheet.id, selectedCell.rowId, selectedCell.columnId, value);
  };

  const startEditingCell = (rowId: string, columnId: string, preset?: string) => {
    const rowIndex = rowIndexMap.get(rowId);
    const colIndex = columnIndexMap.get(columnId);
    if (rowIndex == null || colIndex == null) return;
    const raw = getRawValue(rowIndex, colIndex);
    setEditingCell({ rowId, columnId });
    setEditingValue(preset ?? (raw == null ? "" : typeof raw === "string" ? raw : String(raw)));
  };

  const commitEditingCell = () => {
    if (!editingCell) return;
    updateCell(worksheet.id, editingCell.rowId, editingCell.columnId, editingValue);
    setEditingCell(null);
    setEditingValue("");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isFormElement = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      const isFormulaFocused = target === formulaInputRef.current;
      if (!selectedCell) return;
      if (editingCell) {
        if (event.key === "Enter") {
          event.preventDefault();
          commitEditingCell();
          moveSelection(event.shiftKey ? -1 : 1, 0, false);
        }
        return;
      }
      if (isFormElement && !isFormulaFocused) return;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const deltas: Record<string, [number, number]> = {
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
        };
        const [rowDelta, colDelta] = deltas[event.key];
        moveSelection(rowDelta, colDelta, event.shiftKey);
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        moveSelection(0, event.shiftKey ? -1 : 1, false);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        startEditingCell(selectedCell.rowId, selectedCell.columnId);
        return;
      }

      if (
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        startEditingCell(selectedCell.rowId, selectedCell.columnId, event.key);
      }
    };

    const handleCopy = (event: ClipboardEvent) => {
      if (!selectedRange || editingCell || document.activeElement === formulaInputRef.current) {
        return;
      }
      event.preventDefault();
      const rows: string[] = [];
      for (let r = selectedRange.startRow; r <= selectedRange.endRow; r += 1) {
        const line: string[] = [];
        for (let c = selectedRange.startCol; c <= selectedRange.endCol; c += 1) {
          const raw = getRawValue(r, c);
          line.push(raw == null ? "" : typeof raw === "string" ? raw : String(raw));
        }
        rows.push(line.join("\t"));
      }
      event.clipboardData?.setData("text/plain", rows.join("\n"));
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (!selectedCell || editingCell || document.activeElement === formulaInputRef.current) {
        return;
      }
      const text = event.clipboardData?.getData("text/plain");
      if (!text) return;
      event.preventDefault();
      const startRow = rowIndexMap.get(selectedCell.rowId) ?? 0;
      const startCol = columnIndexMap.get(selectedCell.columnId) ?? 0;
      const rows = text.replace(/\r/g, "").split("\n");
      rows.forEach((rowText, rowOffset) => {
        if (!rowText) return;
        const values = rowText.split("\t");
        values.forEach((value, colOffset) => {
          const targetRow = startRow + rowOffset;
          const targetCol = startCol + colOffset;
          if (
            targetRow >= worksheet.rows.length ||
            targetCol >= worksheet.columns.length
          ) {
            return;
          }
          const targetRowId = worksheet.rows[targetRow].id;
          const targetColumnId = worksheet.columns[targetCol].id;
          updateCell(worksheet.id, targetRowId, targetColumnId, value);
        });
      });
      setSelectedRange({
        startRow,
        endRow: Math.min(worksheet.rows.length - 1, startRow + rows.length - 1),
        startCol,
        endCol: Math.min(
          worksheet.columns.length - 1,
          startCol + rows[0].split("\t").length - 1,
        ),
      });
    };

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [
    selectedCell,
    selectedRange,
    editingCell,
    moveSelection,
    startEditingCell,
    commitEditingCell,
    getRawValue,
    rowIndexMap,
    columnIndexMap,
    worksheet.rows,
    worksheet.columns,
    updateCell,
  ]);

  const insertFormulaFunction = (fn: string) => {
    const base = selectedRawValue.trim();
    const next = base.startsWith("=") ? `=${fn}()` : `=${fn}()`;
    updateFormulaValue(next);
    setShowFormulaSuggestions(false);
    requestAnimationFrame(() => {
      const input = formulaInputRef.current;
      if (input) {
        const pos = next.length - 1;
        input.focus();
        input.setSelectionRange(pos, pos);
      }
    });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3 text-sm">
          <button onClick={handleBack} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/60">
            Back to list
          </button>
          <span className="text-muted">{worksheet.id}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDuplicate} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:bg-accent/60">
            Duplicate
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-rose-500 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:text-muted"
          >
            Delete
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-4 py-6 sm:px-6">
        <section className="rounded-xl border border-border bg-panel/60 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <input
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-brand/60"
                value={worksheet.title}
                onChange={(event) => handleTitleChange(event.target.value)}
              />
              <p className="text-xs text-muted">
                Owned by {worksheet.ownerName} · {formatRelative(worksheet.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <span>{worksheet.rows.length} rows</span>
              <span>{worksheet.columns.length} columns</span>
              <select
                value={worksheet.status}
                onChange={(event) => handleStatusChange(event.target.value as WorksheetStatus)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand/60"
              >
                <option value="draft">Draft</option>
                <option value="in-review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-panel/70 p-3">
            <div className="flex flex-1 flex-wrap gap-2">
              <button onClick={handleAddRow} className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-accent/60">
                + Row
              </button>
              <button onClick={handleAddColumn} className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-accent/60">
                + Column
              </button>
              <button className="rounded border border-border px-3 py-1 text-xs text-muted" disabled>
                Filter
              </button>
              <button className="rounded border border-border px-3 py-1 text-xs text-muted" disabled>
                Share
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>Use arrows to move</span>
              <span>•</span>
              <span>Cmd/Ctrl + C / V</span>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <span className="text-xs font-semibold text-muted">fx</span>
              <input
                ref={formulaInputRef}
                className="flex-1 bg-transparent text-sm focus:outline-none"
                value={selectedRawValue}
                onChange={(event) => {
                  const value = event.target.value;
                  setShowFormulaSuggestions(value.trim().startsWith("="));
                  updateFormulaValue(value);
                }}
                placeholder="Formula bar"
              />
              {selectedRawValue.trim().startsWith("=") && (
                <span className="text-xs text-muted">{selectedDisplayValue}</span>
              )}
            </div>
            {showFormulaSuggestions && filteredFormulaSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-60 rounded-md border border-border bg-panel/90 p-2 shadow-lg">
                <p className="text-[11px] uppercase tracking-wide text-muted">Functions</p>
                {filteredFormulaSuggestions.map((fn) => (
                  <button
                    key={fn}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      insertFormulaFunction(fn);
                    }}
                    className="mt-1 w-full rounded-md px-2 py-1 text-left text-xs hover:bg-accent/60"
                  >
                    {fn}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-auto rounded-xl border border-border bg-white shadow-inner">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-muted">
                  <th className="sticky left-0 z-10 w-20 border border-border/70 bg-slate-50" />
                  {worksheet.columns.map((column, colIndex) => {
                    const width = columnWidths[column.id] ?? COLUMN_DEFAULT_WIDTH;
                    return (
                      <th
                        key={column.id}
                        className="border border-border/70 px-3 py-2 align-bottom"
                        style={{ width, minWidth: COLUMN_MIN_WIDTH }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-muted">{columnIndexToLetters(colIndex)}</div>
                          <button
                            onClick={() => handleAutoSizeColumn(column, colIndex)}
                            className="text-[11px] text-muted hover:text-foreground"
                            title="Auto size column"
                          >
                            ↔
                          </button>
                        </div>
                        <input
                          value={column.title}
                          onChange={(event) => handleColumnTitleChange(column.id, event.target.value)}
                          className="mt-1 w-full rounded border border-transparent bg-transparent text-xs font-semibold text-foreground focus:border-brand/60 focus:outline-none"
                        />
                        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted">
                          <select
                            value={column.type}
                            onChange={(event) => handleColumnTypeChange(column, event.target.value as WorksheetColumnType)}
                            className="w-full rounded border border-border/70 bg-white px-1 py-0.5 focus:border-brand/60 focus:outline-none"
                          >
                            {["text", "number", "date", "select"].map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteColumn(column.id)}
                            className="text-rose-500 hover:underline disabled:cursor-not-allowed disabled:text-muted"
                            disabled={worksheet.columns.length <= 1}
                          >
                            ×
                          </button>
                        </div>
                        {column.type === "select" && (
                          <input
                            value={(column.options ?? []).join(", ")}
                            onChange={(event) => handleColumnOptionsChange(column.id, event.target.value)}
                            className="mt-1 w-full rounded border border-border/70 bg-white px-2 py-1 text-[11px] focus:border-brand/60 focus:outline-none"
                            placeholder="Option1, Option2"
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {worksheet.rows.length === 0 ? (
                  <tr>
                    <td colSpan={worksheet.columns.length + 1} className="px-4 py-12 text-center text-sm text-muted">
                      No rows yet. Use the toolbar above to add your first row or column.
                    </td>
                  </tr>
                ) : (
                  worksheet.rows.map((row, rowIndex) => (
                    <tr key={row.id} className="even:bg-slate-50/40">
                      <td
                        className="sticky left-0 z-10 w-20 border border-border/60 bg-white text-center text-[11px] text-muted"
                        style={{ height: rowHeights[row.id] ?? ROW_MIN_HEIGHT }}
                      >
                        <div className="flex items-center justify-between px-2">
                          <span>{rowIndex + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAutoSizeRow(row, rowIndex)}
                              className="text-muted hover:text-foreground"
                              title="Auto size row"
                            >
                              ↕
                            </button>
                            <button
                              onClick={() => handleDeleteRowAndMaintainSelection(row.id)}
                              className="text-rose-500 hover:text-rose-600"
                              title="Delete row"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </td>
                      {worksheet.columns.map((column, colIndex) => {
                        const width = columnWidths[column.id] ?? COLUMN_DEFAULT_WIDTH;
                        const raw = getRawValue(rowIndex, colIndex);
                        const rawString = raw == null ? "" : typeof raw === "string" ? raw : String(raw);
                        const display = getDisplayValue(rowIndex, colIndex);
                        const displayString = display == null ? "" : typeof display === "number" ? display.toString() : display;
                        const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
                        const isInRange =
                          !!selectedRange &&
                          rowIndex >= selectedRange.startRow &&
                          rowIndex <= selectedRange.endRow &&
                          colIndex >= selectedRange.startCol &&
                          colIndex <= selectedRange.endCol;
                        const value = isEditing ? editingValue : displayString;
                        return (
                          <td
                            key={column.id}
                            className={`border border-border/60 px-0 py-0 ${isInRange ? "bg-brand/5" : ""}`}
                            style={{ width, minWidth: COLUMN_MIN_WIDTH, height: rowHeights[row.id] ?? ROW_MIN_HEIGHT }}
                            onMouseDown={(event) =>
                              handleSelectCell({
                                rowIndex,
                                colIndex,
                                rowId: row.id,
                                columnId: column.id,
                                shiftKey: event.shiftKey,
                              })
                            }
                          >
                            <input
                              readOnly={!isEditing}
                              onDoubleClick={() => startEditingCell(row.id, column.id)}
                              onBlur={commitEditingCell}
                              onChange={(event) => {
                                if (isEditing) setEditingValue(event.target.value);
                              }}
                              className={`w-full border-none px-3 py-2 text-xs focus:outline-none ${
                                isInRange ? "ring-1 ring-brand/60" : ""
                              }`}
                              value={value}
                              placeholder={rawString.startsWith("=") ? rawString : ""}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
