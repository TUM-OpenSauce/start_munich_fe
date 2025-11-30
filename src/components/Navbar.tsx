import React, { useState } from 'react';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext'; // Import context for profile
import {
AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem,
ListItemIcon, ListItemText, Avatar, CircularProgress, IconButton, Popover
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import BusinessIcon from '@mui/icons-material/Business';
import { useSidebarContext } from '../context/SidebarContext'; // Import sidebar context
import { Email, Notifications, KeyboardArrowDown, NotificationsOff } from '@mui/icons-material';

const appBarHeight = 72;

const Navbar: React.FC = () => {
const [user] = useAuthState(auth);
// Use the context states, but rely on Auth state heavily since profile is now mocked
const { userProfile, isProfileLoading } = useProjects();
const { isCollapsed } = useSidebarContext();
const navigate = useNavigate();
const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
const open = Boolean(anchorEl);
const notifOpen = Boolean(notifAnchorEl);

const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
};

const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
};

const handleNotifClose = () => {
    setNotifAnchorEl(null);
};

const handleMenuClose = () => {
    setAnchorEl(null);
};

const handleLogout = async () => {
    handleMenuClose();
    await auth.signOut();
    navigate('/login', { replace: true });
};

// Use custom name if available, otherwise fallback to Google Display Name/Email
const userFirstName = userProfile?.username || user?.displayName?.split(' ')[0] || 'User';
const userEmail = user?.email || 'N/A';
// UPDATED: Use company instead of role
const userCompany = userProfile?.company || 'Not specified';

// Get initials for avatar
const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};


return (
    <AppBar
        position="fixed"
        sx={{
            height: `${appBarHeight}px`,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: 'none',
            zIndex: (theme) => theme.zIndex.drawer + 2,
            
            transition: (theme) => theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: isCollapsed ? theme.transitions.duration.leavingScreen : theme.transitions.duration.enteringScreen,
            }),
        }}
    >
        <Toolbar sx={{ justifyContent: 'space-between', height: '100%', px: 3 }}>
            {/* Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box 
                    sx={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 2, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>OS</Typography>
                </Box>
                <Typography 
                    variant="h6" 
                    noWrap 
                    component="div" 
                    sx={{ 
                        color: '#1e293b', 
                        fontWeight: 700, 
                        letterSpacing: '-0.02em',
                        transition: 'opacity 0.3s',
                        display: { xs: 'none', sm: 'block' }
                    }}
                >
                    {isCollapsed ? '' : 'OpenSauce'}
                </Typography>
            </Box>

            {/* Right Side: Notifications and Account */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Notification Icon */}
                <IconButton 
                    onClick={handleNotifOpen}
                    sx={{ 
                        color: '#64748b',
                        '&:hover': { backgroundColor: '#f1f5f9' }
                    }}
                >
                    <Notifications sx={{ fontSize: 22 }} />
                </IconButton>
                
                {/* Notifications Popover */}
                <Popover
                    open={notifOpen}
                    anchorEl={notifAnchorEl}
                    onClose={handleNotifClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ mt: 1 }}
                    PaperProps={{
                        elevation: 0,
                        sx: {
                            minWidth: 280,
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                        }
                    }}
                >
                    <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            Notifications
                        </Typography>
                    </Box>
                    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <NotificationsOff sx={{ fontSize: 32, color: '#cbd5e1' }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center' }}>
                            No new notifications
                        </Typography>
                    </Box>
                </Popover>

                {/* Simplified loading check */}
                {isProfileLoading && user ? (
                    <CircularProgress size={24} sx={{ color: '#64748b' }} />
                ) : (
                    <Button
                        onClick={handleMenuOpen}
                        sx={{ 
                            color: '#1e293b', 
                            borderRadius: 2,
                            px: 1.5,
                            py: 1,
                            '&:hover': { backgroundColor: '#f1f5f9' }
                        }}
                        endIcon={<KeyboardArrowDown sx={{ fontSize: 18, color: '#64748b' }} />}
                    >
                        <Avatar 
                            sx={{ 
                                width: 34, 
                                height: 34, 
                                mr: 1.5, 
                                bgcolor: '#1e293b',
                                fontSize: 13,
                                fontWeight: 600
                            }}
                        >
                            {getInitials(userFirstName)}
                        </Avatar>
                        <Box sx={{ textAlign: 'left', display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {userFirstName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1 }}>
                                {userCompany}
                            </Typography>
                        </Box>
                    </Button>
                )}
                
                {/* Profile Dropdown Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ mt: 1 }}
                    PaperProps={{ 
                        elevation: 0,
                        sx: {
                            minWidth: 240,
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                        }
                    }}
                >
                    {/* Profile Header */}
                    <Box sx={{ px: 2, py: 2, borderBottom: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {user?.displayName || userFirstName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {userEmail}
                        </Typography>
                    </Box>
                    
                    <MenuItem sx={{ py: 1.5 }}>
                        <ListItemIcon><BusinessIcon fontSize="small" sx={{ color: '#64748b' }} /></ListItemIcon>
                        <ListItemText 
                            primary="Company" 
                            secondary={userCompany}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                        />
                    </MenuItem>
                    <MenuItem sx={{ py: 1.5 }}>
                        <ListItemIcon><Email fontSize="small" sx={{ color: '#64748b' }} /></ListItemIcon>
                        <ListItemText 
                            primary="Email" 
                            secondary={userEmail}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                        />
                    </MenuItem>

                    <Box sx={{ borderTop: '1px solid #e2e8f0', mt: 1, pt: 1 }}>
                        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#ef4444' }}>
                            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                            <ListItemText primary="Sign out" primaryTypographyProps={{ fontWeight: 500 }} />
                        </MenuItem>
                    </Box>
                </Menu>
            </Box>
        </Toolbar>
    </AppBar>
);


};

export default Navbar;