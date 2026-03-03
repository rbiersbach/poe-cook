import React from "react";

interface TwoColumnLayoutProps {
    left: React.ReactNode;
    right: React.ReactNode;
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ left, right }) => (
    <div className="grid gap-6 lg:grid-cols-7 w-full max-w-screen-2xl mx-auto px-2 md:px-8">
        <div className="lg:col-span-4 w-full">{left}</div>
        <aside className="hidden lg:block lg:col-span-3 w-full">{right}</aside>
    </div>
);
