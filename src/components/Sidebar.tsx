import React, { useState, useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useSidebarContext } from '../context/SidebarContext';  
import { useProjects } from '../context/ProjectContext'; // Import project context
import { 
    Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, 
    Typography, Collapse, CircularProgress, useTheme 
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
// NEW ICONS
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import PersonPinIcon from '@mui/icons-material/PersonPin';


// --- Constants ---
const drawerWidth = 260;
const collapsedWidth = 76;
const appBarHeight = 72; 

// --- Component Definition ---
const Sidebar: React.FC = () => {
    const theme = useTheme();
    const { isCollapsed, toggleCollapse } = useSidebarContext();
    const { projects, isLoading: isProjectsLoading, fetchProjects } = useProjects();
    const [isProjectsOpen, setIsProjectsOpen] = useState(true);

    // --- NEW: Vendor state and hooks ---
    const { 
        currentProjectVendors, 
        isVendorLoading, 
        fetchVendorsForProject 
    } = useProjects();
    const [isVendorsOpen, setIsVendorsOpen] = useState(true);
    
    // Check if we are on a single project page
    const params = useParams<{ project_id: string }>();
    const currentProjectId = params.project_id;

    // Effect to fetch vendors when the project ID in the URL changes
    useEffect(() => {
        if (currentProjectId) {
            fetchVendorsForProject(currentProjectId);
            // Optionally auto-open the vendor list when navigating to a project
            setIsVendorsOpen(true);
        }
    }, [currentProjectId, fetchVendorsForProject]);
    // --- End Vendor state ---


    const handleProjectsClick = () => {
        if (!isCollapsed) {
            setIsProjectsOpen(prev => !prev);
        } else {
             setIsProjectsOpen(true);
        }
        
        if (projects.length === 0 && !isProjectsLoading) {
            fetchProjects();
        }
    };

    const handleVendorsClick = () => {
        if (!isCollapsed) {
            setIsVendorsOpen(prev => !prev);
        }
    };

    // Common styles for nav items
    const navItemStyles = {
        my: 0.5,
        mx: 1.5,
        borderRadius: 2,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        '&.active': { 
            backgroundColor: '#1e293b',
            color: '#ffffff',
            '& .MuiListItemIcon-root': { color: '#ffffff' },
            boxShadow: '0 4px 12px rgba(30, 41, 59, 0.15)',
            '&:hover': { 
                backgroundColor: '#334155',
                transform: 'translateX(2px)'
            }
        },
        '&:hover': { 
            backgroundColor: '#f1f5f9',
            transform: 'translateX(4px)',
            '& .MuiListItemIcon-root': { color: '#1e293b' }
        }
    };

    return (
        <Drawer
            variant="permanent"
            anchor="left"
            sx={{
                width: isCollapsed ? collapsedWidth : drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: isCollapsed ? collapsedWidth : drawerWidth,
                    boxSizing: 'border-box',
                    borderRight: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    transition: 'width 300ms cubic-bezier(0.4, 0, 0.6, 1)',
                    overflowX: 'hidden',
                    top: appBarHeight, 
                    height: `calc(100% - ${appBarHeight}px)`, 
                    zIndex: theme.zIndex.drawer + 1,
                },
            }}
        >
            {/* Navigation Label */}
            <Box sx={{ px: 3, pt: 3, pb: 1 }}>
                <Collapse in={!isCollapsed} orientation="horizontal" timeout={300}>
                    <Typography 
                        variant="overline" 
                        sx={{ 
                            color: '#94a3b8', 
                            fontSize: 11, 
                            fontWeight: 600,
                            letterSpacing: '0.1em'
                        }}
                    >
                        Navigation
                    </Typography>
                </Collapse>
            </Box>

            <List sx={{ flexGrow: 1, px: 0, pt: 0 }} disablePadding>

                {/* --- 1. Dashboard Link --- */}
                <ListItemButton
                    component={NavLink}
                    to="/dashboard"
                    sx={{
                        ...navItemStyles,
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        px: isCollapsed ? 0 : 2,
                        '&.active .MuiListItemText-primary': {
                            color: '#ffffff'
                        }
                    }}
                >
                    <ListItemIcon sx={{ 
                        minWidth: isCollapsed ? 0 : 40, 
                        color: '#64748b',
                        justifyContent: 'center',
                        mr: isCollapsed ? 0 : 1
                    }}>
                        <DashboardIcon sx={{ fontSize: 22 }} />
                    </ListItemIcon>
                    {!isCollapsed && (
                        <ListItemText 
                            primary="Dashboard" 
                            primaryTypographyProps={{ 
                                fontWeight: 500, 
                                fontSize: 14,
                                color: 'inherit'
                            }} 
                        />
                    )}
                </ListItemButton>

                {/* --- 2. Projects Parent Link / Toggle --- */}
                <ListItemButton
                    component={NavLink}
                    to="/projects" 
                    end
                    onClick={handleProjectsClick}
                    sx={{
                        ...navItemStyles,
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        px: isCollapsed ? 0 : 2,
                        '&.active': { 
                            backgroundColor: '#1e293b',
                            color: '#ffffff',
                            '& .MuiListItemIcon-root': { color: '#ffffff' },
                            '&:hover': { backgroundColor: '#334155' }
                        },
                    }}
                >
                    <ListItemIcon sx={{ 
                        minWidth: isCollapsed ? 0 : 40, 
                        justifyContent: 'center',
                        mr: isCollapsed ? 0 : 1
                    }}>
                        <FolderCopyIcon sx={{ fontSize: 22 }} />
                    </ListItemIcon>
                    {!isCollapsed && (
                        <>
                            <ListItemText 
                                primary="Projects" 
                                primaryTypographyProps={{ 
                                    fontWeight: 500, 
                                    fontSize: 14 
                                }} 
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {isProjectsOpen ? <ExpandLess sx={{ fontSize: 20 }} /> : <ExpandMore sx={{ fontSize: 20 }} />}
                            </Box>
                        </>
                    )}
                </ListItemButton>

                {/* --- 3. Collapsible Project List --- */}
                <Collapse in={isProjectsOpen && !isCollapsed} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 2 }}>
                        {isProjectsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={18} sx={{ color: '#f59e0b' }} />
                            </Box>
                        ) : projects.slice(0, 5).map((project) => ( 
                                <ListItemButton
                                    key={project.project_id}
                                    component={NavLink}
                                    to={`/projects/${project.project_id}`}
                                    sx={{ 
                                        py: 0.75,
                                        px: 2,
                                        mx: 1.5,
                                        borderRadius: 1.5,
                                        transition: 'all 0.2s ease',
                                        '&.active': { 
                                            backgroundColor: '#fef3c7',
                                            borderLeft: '3px solid #f59e0b',
                                            '& .MuiTypography-root': { color: '#b45309', fontWeight: 600 },
                                            '& .MuiListItemIcon-root': { color: '#f59e0b' }
                                        },
                                        '&:hover': { 
                                            backgroundColor: '#fffbeb',
                                            '& .MuiTypography-root': { color: '#b45309' },
                                            '& .MuiListItemIcon-root': { color: '#f59e0b' }
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 28, transition: 'color 0.2s ease' }}>
                                        <ArticleIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={project.name} 
                                        primaryTypographyProps={{ 
                                            fontSize: 13, 
                                            noWrap: true,
                                            color: '#64748b'
                                        }}
                                    />
                                </ListItemButton>
                            ))
                        }
                        
                        {projects.length > 5 && (
                             <ListItemButton
                                component={NavLink}
                                to="/projects"
                                sx={{ py: 0.75, px: 2, mx: 1.5, borderRadius: 1.5 }}
                            >
                                <ListItemText 
                                    primary={`View all ${projects.length} projects`} 
                                    primaryTypographyProps={{ 
                                        fontSize: 12, 
                                        fontWeight: 500,
                                        color: '#f97316'
                                    }}
                                />
                            </ListItemButton>
                        )}
                    </List>
                </Collapse>

                {/* --- 4. NEW: Conditional Vendor List --- */}
                <Collapse in={!!currentProjectId} timeout="auto" unmountOnExit>
                    {/* Vendors Label - Only show when expanded */}
                    {!isCollapsed && (
                        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
                            <Typography 
                                variant="overline" 
                                sx={{ 
                                    color: '#94a3b8', 
                                    fontSize: 11, 
                                    fontWeight: 600,
                                    letterSpacing: '0.1em'
                                }}
                            >
                                Vendors
                            </Typography>
                        </Box>
                    )}
                    
                    {/* Collapsed: Just show a divider line */}
                    {isCollapsed && (
                        <Box sx={{ mx: 2, my: 1.5, borderTop: '1px solid #e2e8f0' }} />
                    )}
                    
                    <ListItemButton
                        component={NavLink}
                        to={`/projects/${currentProjectId}/vendors`}
                        onClick={handleVendorsClick}
                        sx={{
                            ...navItemStyles,
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            px: isCollapsed ? 0 : 2,
                            '&.active': { 
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                '& .MuiListItemIcon-root': { color: '#ffffff' },
                            },
                        }}
                    >
                        <ListItemIcon sx={{ 
                            minWidth: isCollapsed ? 0 : 40, 
                            justifyContent: 'center',
                            mr: isCollapsed ? 0 : 1
                        }}>
                            <GroupWorkIcon sx={{ fontSize: 22 }} />
                        </ListItemIcon>
                        {!isCollapsed && (
                            <>
                                <ListItemText 
                                    primary="Vendor List" 
                                    primaryTypographyProps={{ fontWeight: 500, fontSize: 14 }} 
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {isVendorsOpen ? <ExpandLess sx={{ fontSize: 20 }} /> : <ExpandMore sx={{ fontSize: 20 }} />}
                                </Box>
                            </>
                        )}
                    </ListItemButton>

                    <Collapse in={isVendorsOpen && !isCollapsed} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ pl: 2 }}>
                            {isVendorLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={18} sx={{ color: '#059669' }} />
                                </Box>
                            ) : currentProjectVendors.length === 0 ? (
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        display: 'block', 
                                        pl: 3, 
                                        pt: 1,
                                        color: '#94a3b8',
                                        fontStyle: 'italic'
                                    }}
                                >
                                    No vendors found
                                </Typography>
                            ) : (
                                currentProjectVendors.map((vendor) => (
                                    <ListItemButton
                                        key={vendor.vendor_id}
                                        component={NavLink}
                                        to={`/projects/${vendor.project_id}/vendors/${vendor.vendor_id}`}
                                        sx={{ 
                                            py: 0.75,
                                            px: 2,
                                            mx: 1.5,
                                            borderRadius: 1.5,
                                            transition: 'all 0.2s ease',
                                            '&.active': { 
                                                backgroundColor: '#ecfdf5',
                                                borderLeft: '3px solid #059669',
                                                '& .MuiTypography-root': { color: '#059669', fontWeight: 600 },
                                                '& .MuiListItemIcon-root': { color: '#059669' }
                                            },
                                            '&:hover': { 
                                                backgroundColor: '#f0fdf4',
                                                '& .MuiTypography-root': { color: '#059669' },
                                                '& .MuiListItemIcon-root': { color: '#10b981' }
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 28, transition: 'color 0.2s ease' }}>
                                            <PersonPinIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={vendor.name} 
                                            primaryTypographyProps={{ 
                                                fontSize: 13, 
                                                noWrap: true,
                                                color: '#64748b'
                                            }}
                                        />
                                    </ListItemButton>
                                ))
                            )}
                        </List>
                    </Collapse>
                </Collapse>

            </List>
            
            {/* Collapse Toggle Button */}
            <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                <ListItemButton 
                    onClick={toggleCollapse}
                    sx={{
                        borderRadius: 2,
                        py: 1,
                        '&:hover': { backgroundColor: '#f1f5f9' },
                        justifyContent: 'center',
                        px: isCollapsed ? 0 : 2,
                    }}
                >
                    <ListItemIcon sx={{ 
                        minWidth: isCollapsed ? 0 : 40, 
                        color: '#64748b',
                        justifyContent: 'center',
                        mr: isCollapsed ? 0 : 1
                    }}>
                        {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </ListItemIcon>
                    {!isCollapsed && (
                        <ListItemText 
                            primary="Collapse"
                            primaryTypographyProps={{ 
                                fontWeight: 500, 
                                fontSize: 14,
                                color: '#64748b'
                            }}
                        />
                    )}
                </ListItemButton>
            </Box>
        </Drawer>
    );
};

export default Sidebar;