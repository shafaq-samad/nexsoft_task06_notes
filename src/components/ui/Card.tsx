import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return <div className={`rounded-xl border border-outline-variant bg-white shadow-sm ${className}`}>{children}</div>;
}
