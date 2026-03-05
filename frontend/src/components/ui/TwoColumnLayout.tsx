import React, { createContext, useContext } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";

interface TwoColumnLayoutProps {
    left: React.ReactNode;
    right: React.ReactNode;
}

const SidebarVisibleContext = createContext<boolean>(false);

/** Returns true when the TwoColumnLayout's right sidebar column is currently visible. */
export function useSidebarVisible(): boolean {
    return useContext(SidebarVisibleContext);
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ left, right }) => {
    const sidebarVisible = useMediaQuery("(min-width: 1024px)");
    return (
        <SidebarVisibleContext.Provider value={sidebarVisible}>
            <div className="grid gap-6 lg:grid-cols-7 w-full max-w-screen-2xl mx-auto mt-2 px-2 md:px-8">
                <div className="lg:col-span-4 w-full">{left}</div>
                <aside className="hidden lg:block lg:col-span-3 w-full">{right}</aside>
            </div>
        </SidebarVisibleContext.Provider>
    );
};
