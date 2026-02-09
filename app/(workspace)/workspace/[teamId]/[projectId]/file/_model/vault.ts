export const FILE_VAULT_EVENT = "file:vault:changed";
export function emitFileVaultChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FILE_VAULT_EVENT));
}
