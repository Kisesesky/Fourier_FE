import { useKanban } from "@/workspace/issues/_model/store";
import type { MachineStatus, ResourceAlert } from "@/workspace/issues/_model/kanbanTypes";
import { AlertTriangle, CheckCircle, Clock, Settings } from "lucide-react";
import { useMemo } from "react";

import { MACHINE_PILL, RISK_PILL } from "./constants";
import { KANBAN_TEXT } from "./text";
import { entityToList, groupLoadByAssignee } from "./utils";

export function ResourceSection() {
  const { machines, resourceAlerts, humanResources, resourceLoads, updateMachine, acknowledgeAlert } = useKanban((state) => ({
    machines: state.machines,
    resourceAlerts: state.resourceAlerts,
    humanResources: state.humanResources,
    resourceLoads: state.resourceLoads,
    updateMachine: state.updateMachine,
    acknowledgeAlert: state.acknowledgeAlert,
  }));
  const machineList = useMemo(() => entityToList(machines), [machines]);
  const alerts = useMemo(() => entityToList(resourceAlerts), [resourceAlerts]);
  const humans = useMemo(() => entityToList(humanResources), [humanResources]);
  const loadMap = useMemo(() => groupLoadByAssignee(resourceLoads), [resourceLoads]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {machineList.map((machine) => (
          <div key={machine.id} className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{machine.name}</p>
                <p className="text-xs text-muted">{machine.operation}</p>
              </div>
              <select
                className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold", MACHINE_PILL[machine.status]].join(" ")}
                value={machine.status}
                onChange={(event) => updateMachine(machine.id, { status: event.target.value as MachineStatus })}
              >
                {(["available", "busy"] as MachineStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {machineLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Utilisation</span>
                <span>{Math.round(machine.utilization * 100)}%</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(machine.utilization * 100)}
                  onChange={(event) => updateMachine(machine.id, { utilization: Number(event.target.value) / 100 })}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border"
                />
                <span className="text-xs text-muted">{Math.round(machine.utilization * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Team load</h2>
          <Settings size={14} className="text-muted" />
        </div>
        <div className="mt-4 space-y-3">
          {humans.map((person) => {
            const entries = loadMap[person.id] || [];
            const peak = entries.reduce((max, entry) => Math.max(max, entry.workload / person.capacityPerDay), 0);
            const peakPercent = Math.round(peak * 100);
            const overloaded = peak > 1;
            return (
              <div key={person.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: person.color }} />
                    {person.name}
                    <span className="text-xs text-muted">{person.role}</span>
                  </div>
                  <span className={overloaded ? "text-rose-500" : "text-muted"}>{peakPercent}% max</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-border">
                  <div
                    className={`h-full rounded-full ${overloaded ? "bg-rose-500" : "bg-brand"}`}
                    style={{ width: `${Math.min(100, peakPercent)}%` }}
                  />
                </div>
                {entries.length > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    Next spike: {entries[0].date} · {entries[0].workload.toFixed(1)}h
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Alerts</h2>
          <Settings size={14} className="text-muted" />
        </div>
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-4 text-xs">
              {alertIcon(alert.severity)}
              <div className="flex-1">
                <p className="font-semibold text-foreground">{alert.title}</p>
                <p className="mt-1 text-muted">{alert.detail}</p>
              </div>
              {!alert.acknowledged && (
                <button
                  type="button"
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="rounded-full border border-border/60 px-3 py-1 text-[11px] font-semibold text-muted hover:border-brand hover:text-brand"
                >
                  {KANBAN_TEXT.actions.acknowledge}
                </button>
              )}
            </div>
          ))}
          {!alerts.length && <p className="text-center text-xs text-muted">{KANBAN_TEXT.empty.noAlerts}</p>}
        </div>
      </section>
    </div>
  );
}

const machineLabel = (status: MachineStatus) => KANBAN_TEXT.statuses.machine[status];

function alertIcon(severity: ResourceAlert["severity"]) {
  if (severity === "critical") {
    return <AlertTriangle size={16} className="mt-0.5 text-rose-500" />;
  }
  if (severity === "warning") {
    return <Clock size={16} className="mt-0.5 text-amber-600" />;
  }
  return <CheckCircle size={16} className="mt-0.5 text-emerald-500" />;
}


