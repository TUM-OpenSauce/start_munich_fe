import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebarContext } from '../context/SidebarContext';
import { Box, CssBaseline, useTheme } from '@mui/material';

const appBarHeight = 72; // Slightly taller for better proportions

// Inner component that consumes the context
const DashboardContent: React.FC = () => {
const { isCollapsed } = useSidebarContext();
const theme = useTheme();

return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <CssBaseline />
        
        {/* 1. Navbar is fixed at the top */}
        <Navbar /> 
        
        {/* 2. Sidebar is positioned next to the content */}
        <Sidebar />

        {/* 3. Main Content Area */}
        <Box 
            component="main" 
            sx={{
                flexGrow: 1,
                p: 4,
                // Apply transitions to margin-left
                transition: theme.transitions.create('margin', {
                    easing: theme.transitions.easing.sharp,
                    duration: isCollapsed ? theme.transitions.duration.leavingScreen : theme.transitions.duration.enteringScreen,
                }),
                marginTop: `${appBarHeight}px`,
                minHeight: `calc(100vh - ${appBarHeight}px)`,
                width: `100%`, 
            }}
        >
            {/* Router content is rendered here */}
            <Outlet />
        </Box>
    </Box>
);


};

// Outer component that provides the context
const DashboardLayout: React.FC = () => {
return (
<SidebarProvider>
<DashboardContent />
</SidebarProvider>
);
};

export default DashboardLayout;