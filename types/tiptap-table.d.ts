// types/tiptap-table.d.ts
import '@tiptap/core';
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    table: {
      insertTable: (opts: { rows: number; cols: number; withHeaderRow?: boolean }) => ReturnType;
      addRowAfter: () => ReturnType;
      addColumnAfter: () => ReturnType;
      deleteRow: () => ReturnType;
      deleteColumn: () => ReturnType;
      deleteTable: () => ReturnType;
      toggleHeaderRow: () => ReturnType;
      toggleHeaderColumn: () => ReturnType;
      mergeCells: () => ReturnType;
      splitCell: () => ReturnType;
      mergeOrSplit: () => ReturnType;
    };
  }
}
