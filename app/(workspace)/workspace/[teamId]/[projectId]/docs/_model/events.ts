// events.ts

export function subscribeDocsEvent(callback: () => void) {
  const handler = () => callback();

  window.addEventListener("docs:refresh", handler);

  return () => {
    window.removeEventListener("docs:refresh", handler);
  };
}
