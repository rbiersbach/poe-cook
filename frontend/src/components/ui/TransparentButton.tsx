import React from "react";

export interface TransparentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  "data-testid"?: string;
}

export const TransparentButton: React.FC<TransparentButtonProps> = ({
  children,
  iconLeft,
  iconRight,
  className = "",
  "data-testid": dataTestId,
  ...props
}) => {
  return (
    <button
      type="button"
      className={`p-1 rounded text-gray-500 hover:text-red-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1 ${className}`}
      style={{ lineHeight: 0 }}
      data-testid={dataTestId}
      {...props}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
};
