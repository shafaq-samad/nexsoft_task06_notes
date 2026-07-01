export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="w-full space-y-3 rounded-xl border border-outline-variant bg-surface-container-low p-4" aria-busy="true">
      <div className="h-3 w-24 rounded-full bg-surface-container" />
      <div className="h-3 w-full rounded-full bg-surface-container" />
      <div className="h-3 w-5/6 rounded-full bg-surface-container" />
      <div className="text-sm text-on-surface-variant">{label}</div>
    </div>
  );
}
