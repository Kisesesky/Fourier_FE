// lib/mocks/worksheet.ts

import type { Worksheet, WorksheetMeta } from "@/workspace/worksheet/_model/types";
import { defaultMembers } from "@/workspace/members/_model/mocks";

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const memberName = (id: string, fallback: string) =>
  defaultMembers.find((member) => member.id === id)?.name ?? fallback;

const YOU = memberName("mem-you", "You");
const ALICE = memberName("mem-alice", "Alice");
const BOB = memberName("mem-bob", "Bob");

export function createDefaultWorksheets(): Worksheet[] {
  const now = Date.now();

  return [
    {
      id: "ws-001",
      title: "Launch Checklist",
      ownerName: ALICE,
      updatedAt: now - HOUR * 5,
      status: "in-review",
      columns: [
        { id: "col-title", title: "Task", type: "text" },
        { id: "col-owner", title: "Owner", type: "text" },
        { id: "col-status", title: "Status", type: "select", options: ["Pending", "In Progress", "Done"] },
        { id: "col-due", title: "Due Date", type: "date" },
      ],
      rows: [
        {
          id: "row-1",
          updatedAt: now - HOUR * 5,
          cells: [
            { columnId: "col-title", value: "QA sign-off" },
            { columnId: "col-owner", value: BOB },
            { columnId: "col-status", value: "In Progress" },
            { columnId: "col-due", value: "2025-10-30" },
          ],
        },
        {
          id: "row-2",
          updatedAt: now - HOUR * 8,
          cells: [
            { columnId: "col-title", value: "Release notes" },
            { columnId: "col-owner", value: YOU },
            { columnId: "col-status", value: "Pending" },
            { columnId: "col-due", value: "2025-10-31" },
          ],
        },
      ],
      tags: ["launch", "checklist"],
      description: "Tasks to complete before the release freeze.",
    },
    {
      id: "ws-002",
      title: "Customer Success Plans",
      ownerName: BOB,
      updatedAt: now - DAY,
      status: "done",
      columns: [
        { id: "col-account", title: "Account", type: "text" },
        { id: "col-owner", title: "Owner", type: "text" },
        { id: "col-health", title: "Health", type: "select", options: ["Green", "Yellow", "Red"] },
        { id: "col-renewal", title: "Renewal", type: "date" },
      ],
      rows: [
        {
          id: "row-1",
          updatedAt: now - HOUR * 30,
          cells: [
            { columnId: "col-account", value: "Acme Inc." },
            { columnId: "col-owner", value: ALICE },
            { columnId: "col-health", value: "Green" },
            { columnId: "col-renewal", value: "2025-12-01" },
          ],
        },
        {
          id: "row-2",
          updatedAt: now - HOUR * 20,
          cells: [
            { columnId: "col-account", value: "Globex" },
            { columnId: "col-owner", value: YOU },
            { columnId: "col-health", value: "Yellow" },
            { columnId: "col-renewal", value: "2026-01-12" },
          ],
        },
      ],
    },
    {
      id: "ws-003",
      title: "Experiment Tracker",
      ownerName: YOU,
      updatedAt: now - 1000 * 60 * 30,
      status: "draft",
      columns: [
        { id: "col-exp", title: "Experiment", type: "text" },
        { id: "col-hypothesis", title: "Hypothesis", type: "text" },
        { id: "col-result", title: "Result", type: "select", options: ["Pending", "Positive", "Negative"] },
        { id: "col-created", title: "Created", type: "date" },
      ],
      rows: [],
    },
  ];
}

export function createDefaultWorksheetMeta(source: Worksheet[]): WorksheetMeta[] {
  return source.map(({ id, title, ownerName, updatedAt, status }) => ({
    id,
    title,
    ownerName,
    updatedAt,
    status,
  }));
}

export function createDefaultWorksheetMap(source: Worksheet[]): Record<string, Worksheet> {
  return source.reduce<Record<string, Worksheet>>((acc, worksheet) => {
    acc[worksheet.id] = worksheet;
    return acc;
  }, {});
}
