import React from "react";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const Loader: React.FC<LoaderProps> = ({ message, size = "md" }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className={`${sizes[size]} animate-spin text-orange-500`} />
      {message && (
        <p className="text-orange-500 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};
