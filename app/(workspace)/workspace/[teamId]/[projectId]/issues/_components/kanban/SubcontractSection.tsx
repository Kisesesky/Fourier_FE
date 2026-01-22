import { useKanban } from "@/workspace/issues/_model/store";
import type { SubcontractStatus } from "@/workspace/issues/_model/kanbanTypes";
import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SUBCONTRACT_PILL } from "./constants";
import { KANBAN_TEXT } from "./text";
import { entityToList } from "./utils";

export function SubcontractSection() {
  const { subcontracts, filters, openFilterPanel, updateSubcontract } = useKanban((state) => ({
    subcontracts: state.subcontracts,
    filters: state.filters,
    openFilterPanel: state.openFilterPanel,
    updateSubcontract: state.updateSubcontract,
  }));
  const [searchTerm, setSearchTerm] = useState("");
  const vendorItems = useMemo(() => {
    const items = entityToList(subcontracts);
    const filtered = filters.vendor === "all" ? items : items.filter((item) => item.status === filters.vendor);
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return filtered;
    return filtered.filter((item) =>
      item.name.toLowerCase().includes(keyword) || item.vendor.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword),
    );
  }, [filters.vendor, subcontracts, searchTerm]);

  return (
    <section className="rounded-2xl border border-border bg-panel/95 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-1 items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs text-muted">
          <Search size={12} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={KANBAN_TEXT.filters.subcontractSearch}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => openFilterPanel("subcontract")}
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted hover:border-brand hover:bg-brand/5 hover:text-brand"
        >
          <Filter size={12} /> {KANBAN_TEXT.actions.filter}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="border-b border-border/70 bg-background/70 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Work</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Period</th>
              <th className="px-4 py-3 text-left"> {KANBAN_TEXT.filters.status.label}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {vendorItems.map((item) => (
              <tr key={item.id} className="bg-background/90">
                <td className="px-4 py-3 text-xs font-semibold text-muted">{item.code}</td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-3 text-xs text-muted">{item.vendor}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  <input
                    className="w-full rounded-full border border-border/60 bg-background px-2 py-1 text-xs"
                    value={item.period}
                    onChange={(event) => updateSubcontract(item.id, { period: event.target.value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold", SUBCONTRACT_PILL[item.status]].join(" ")}
                    value={item.status}
                    onChange={(event) => updateSubcontract(item.id, { status: event.target.value as SubcontractStatus })}
                  >
                    {(["planned", "in-progress", "delayed"] as SubcontractStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {subcontractLabel(status)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!vendorItems.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted">
                  {KANBAN_TEXT.empty.noSubcontract}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const subcontractLabel = (status: SubcontractStatus) => KANBAN_TEXT.statuses.subcontract[status];


