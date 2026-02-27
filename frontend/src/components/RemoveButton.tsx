import React from "react";

interface RemoveButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const RemoveButton: React.FC<RemoveButtonProps> = ({
  onClick,
  disabled = false,
  className = "",
  children = "Remove",
  "data-testid": dataTestId,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`text-red-600 dark:text-red-400 font-semibold hover:underline ml-2 disabled:opacity-50 ${className}`}
    data-testid={dataTestId}
  >
    {children}
  </button>
);
