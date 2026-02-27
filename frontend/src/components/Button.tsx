import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  color?: "blue" | "green" | "red" | "gray";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}


const colorMap: Record<string, string> = {
  blue: "bg-blue-600 text-white dark:bg-blue-700 dark:text-gray-100",
  green: "bg-green-600 text-white dark:bg-green-700 dark:text-gray-100",
  red: "bg-red-600 text-white dark:bg-red-700 dark:text-gray-100",
  gray: "bg-gray-400 text-white dark:bg-gray-700 dark:text-gray-100",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  color = "blue",
  className = "",
  disabled = false,
  onClick,
  type = "button",
}) => (
  <button
    type={type}
    className={`px-4 py-2 rounded ${colorMap[color]} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);
