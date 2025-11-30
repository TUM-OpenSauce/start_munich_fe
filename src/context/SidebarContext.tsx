import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
const [isCollapsed, setIsCollapsed] = useState(false);

const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
};

return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
        {children}
    </SidebarContext.Provider>
);


};

export const useSidebarContext = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebarContext must be used within a SidebarProvider');
    }
    return context;
};