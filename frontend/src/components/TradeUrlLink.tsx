import React from "react";

interface TradeUrlLinkProps {
    url: string;
    className?: string;
}

export const TradeUrlLink: React.FC<TradeUrlLinkProps> = ({ url, className }) => {
    if (!url) return null;
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center link ${className || ""}`}
            aria-label="Open trade URL in new tab"
            data-testid="trade-url-link"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-4 h-4 mr-1"
                aria-hidden="true"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.59 13.41a2 2 0 010-2.82l4-4a2 2 0 112.82 2.82l-1.3 1.3m-4.24 4.24l-1.3 1.3a2 2 0 11-2.82-2.82l4-4" />
            </svg>
            Link
        </a>
    );
};
