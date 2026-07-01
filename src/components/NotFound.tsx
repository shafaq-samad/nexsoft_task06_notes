import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <h1 className="text-3xl font-semibold text-primary">Page not found</h1>
      <p className="max-w-md text-sm text-on-surface-variant">The route you requested doesn’t exist. Return to the workspace to continue.</p>
      <Link to="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
        Go home
      </Link>
    </div>
  );
}
