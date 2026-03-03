import React from "react";

export interface TimeAgoProps extends React.HTMLAttributes<HTMLSpanElement> {
  date: string | Date;
}

function getTimeAgoString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  // Otherwise, show date string
  return date.toLocaleString();
}

export const TimeAgo: React.FC<TimeAgoProps> = ({ date, className, ...rest }) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return <span className={className} {...rest}>{getTimeAgoString(d)}</span>;
};
