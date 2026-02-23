import React from "react";

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ children, className }) => (
  <h2 className={"font-semibold mb-2 " + (className || "")}>{children}</h2>
);

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className }) => (
  <div className={"text-red-600 mb-2 " + (className || "")}>{message}</div>
);

interface SuccessMessageProps {
  message: string;
  className?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, className }) => (
  <div className={"text-green-600 mb-2 " + (className || "")}>{message}</div>
);
