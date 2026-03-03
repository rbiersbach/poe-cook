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
  children,
  "data-testid": dataTestId,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`text-red-600 dark:text-red-400 remove-btn rounded transition-colors duration-150 disabled:opacity-50 ${className}`}
    data-testid={dataTestId}
    aria-label="Remove"
  >
    {children ?? (
      <>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-5">
          <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm2.78-4.22a.75.75 0 0 1-1.06 0L8 9.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 0 1 1.06-1.06L8 6.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L9.06 8l1.72 1.72a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
        </svg>
        <span className="sr-only">Remove</span>
      </>
    )}
  </button>
);
