import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { 
    Box, Typography, Card, CardContent, Grid, Chip, Divider,
    CircularProgress, Dialog, DialogContent, DialogActions,
    TextField, Button, InputAdornment, Fab, Zoom
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import LaunchIcon from '@mui/icons-material/Launch';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AddIcon from '@mui/icons-material/Add';
import type { Vendor } from '../services/ApiService';
import { Email } from '@mui/icons-material';

// Vendor card style configurations for visual variety
const vendorCardStyles = [
    {
        gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        accentColor: '#f59e0b',
        scoreColor: '#10b981',
        badgeColor: '#f59e0b',
        theme: 'dark'
    },
    {
        gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
        accentColor: '#fff',
        scoreColor: '#fff',
        badgeColor: '#065f46',
        theme: 'green'
    },
    {
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
        accentColor: '#fff',
        scoreColor: '#fef3c7',
        badgeColor: '#5b21b6',
        theme: 'purple'
    },
    {
        gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
        accentColor: '#fff',
        scoreColor: '#fef3c7',
        badgeColor: '#991b1b',
        theme: 'red'
    },
    {
        gradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
        accentColor: '#fff',
        scoreColor: '#ecfdf5',
        badgeColor: '#075985',
        theme: 'blue'
    },
];

// ============================================================================
// CREATE VENDOR MODAL
// ============================================================================
interface CreateVendorModalProps {
    open: boolean;
    onClose: () => void;
    project_id: string;
}

const CreateVendorModal: React.FC<CreateVendorModalProps> = ({ open, onClose, project_id }) => {
    const { createVendor } = useProjects();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [estimatedCost, setEstimatedCost] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Vendor name is required');
            return;
        }
        if (!specialty.trim()) {
            setError('Specialty is required');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const newVendor = await createVendor(
                project_id,
                name.trim(),
                estimatedCost.trim(),
                specialty.trim(),
            );
            
            if (newVendor) {
                setName('');
                setSpecialty('');
                setEstimatedCost('');
                onClose();
                navigate(`/projects/${project_id}/vendors/${newVendor.vendor_id}`);
            } else {
                setError('Failed to create vendor. Please try again.');
            }
        } catch (err) {
            console.error('Error creating vendor:', err);
            setError('Failed to create vendor. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (!isCreating) {
            setName('');
            setSpecialty('');
            setEstimatedCost('');
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden'
                }
            }}
        >
            <Box 
                sx={{ 
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    p: 3,
                    color: '#fff'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                        sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 2,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <PersonAddIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Add New Vendor
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Add a vendor to collaborate on this project
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <DialogContent sx={{ p: 3, pt: 4 }}>
                <TextField
                    autoFocus
                    fullWidth
                    label="Vendor Name"
                    placeholder="e.g., Alpha Solutions, TechCorp Inc."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={!!error && !name.trim()}
                    sx={{ mb: 3 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <BusinessIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                />
                
                <TextField
                    fullWidth
                    label="Company"
                    placeholder="Google / AWS / ..."
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    error={!!error && !specialty.trim()}
                    sx={{ mb: 3 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <ApartmentIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    fullWidth
                    label="Email Adress"
                    placeholder="max@mustermann.de"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Email sx={{ color: '#94a3b8', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                    helperText="ENter EMail to get more infrmation about the vendor"
                />

                {error && (
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: '#ef4444', 
                            mt: 2,
                            p: 1.5,
                            backgroundColor: '#fef2f2',
                            borderRadius: 2
                        }}
                    >
                        {error}
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
                <Button 
                    onClick={handleClose}
                    disabled={isCreating}
                    sx={{ color: '#64748b', fontWeight: 500, px: 3 }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleCreate}
                    variant="contained"
                    disabled={isCreating || !name.trim() || !specialty.trim()}
                    startIcon={isCreating ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <AddIcon />}
                    sx={{ 
                        backgroundColor: '#059669',
                        fontWeight: 600,
                        px: 3,
                        borderRadius: 2,
                        '&:hover': { backgroundColor: '#047857' },
                        '&:disabled': { backgroundColor: '#94a3b8' }
                    }}
                >
                    {isCreating ? 'Adding...' : 'Add Vendor'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ============================================================================
// VENDOR CARDS COMPONENT
// ============================================================================
interface VendorCardsProps {
    vendors: Vendor[];
    project_id: string;
    showTitle?: boolean;
    showAddButton?: boolean;
    showFab?: boolean;
}

const VendorCards: React.FC<VendorCardsProps> = ({ 
    vendors, 
    project_id, 
    showTitle = true,
    showAddButton = true,
    showFab = true
}) => {
    const navigate = useNavigate();
    const [isCreateVendorModalOpen, setIsCreateVendorModalOpen] = useState(false);

    const handleVendorClick = (vendor_id: string) => {
        navigate(`/projects/${project_id}/vendors/${vendor_id}`);
    };

    return (
        <>
            {showTitle && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        Project Vendors
                    </Typography>
                    {showAddButton && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setIsCreateVendorModalOpen(true)}
                            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                            sx={{ 
                                borderRadius: 2,
                                borderColor: '#e2e8f0',
                                color: '#64748b',
                                fontWeight: 500,
                                '&:hover': {
                                    borderColor: '#059669',
                                    color: '#059669',
                                    backgroundColor: '#ecfdf5'
                                }
                            }}
                        >
                            Add Vendor
                        </Button>
                    )}
                </Box>
            )}

            <Grid container spacing={3}> 
                {vendors.map((vendor, index) => {
                    const style = vendorCardStyles[index % vendorCardStyles.length];
                    
                    return (
                        <Grid size={{ xs: 12, md: 6 }} key={vendor.vendor_id}> 
                            <Card 
                                elevation={0}
                                sx={{ 
                                    height: '100%', 
                                    borderRadius: 4,
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    overflow: 'hidden',
                                    background: style.gradient,
                                    position: 'relative',
                                    '&:hover': {
                                        transform: 'translateY(-4px) scale(1.01)',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                                    }
                                }}
                                onClick={() => handleVendorClick(vendor.vendor_id)}
                            >
                                {/* Decorative Elements */}
                                <Box sx={{ 
                                    position: 'absolute', 
                                    top: -40, 
                                    right: -40, 
                                    width: 150, 
                                    height: 150, 
                                    borderRadius: '50%', 
                                    background: 'rgba(255,255,255,0.08)' 
                                }} />
                                <Box sx={{ 
                                    position: 'absolute', 
                                    bottom: -30, 
                                    left: '20%', 
                                    width: 100, 
                                    height: 100, 
                                    borderRadius: '50%', 
                                    background: 'rgba(255,255,255,0.05)' 
                                }} />
                                
                                <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                                    {/* Header Row */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                                <Chip 
                                                    label="NEW"
                                                    size="small"
                                                    sx={{ 
                                                        backgroundColor: style.badgeColor,
                                                        color: '#fff',
                                                        fontWeight: 700,
                                                        fontSize: 9,
                                                        letterSpacing: 1,
                                                        height: 22
                                                    }} 
                                                />
                                            </Box>
                                            <Typography 
                                                variant="h5" 
                                                sx={{ 
                                                    fontWeight: 800,
                                                    color: '#fff',
                                                    letterSpacing: '-0.02em',
                                                    mb: 0.5
                                                }}
                                            >
                                                {vendor.name}
                                            </Typography>
                                        </Box>
                                        
                                        {/* Score Circle */}
                                        <Box sx={{ 
                                            textAlign: 'center', 
                                            p: 1.5, 
                                            borderRadius: 3, 
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            backdropFilter: 'blur(10px)',
                                            minWidth: 80
                                        }}>
                                        </Box>
                                    </Box>
                                    
                                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                                    
                                    {/* Info Row */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', gap: 3 }}>
                                            <Typography 
                                                variant="body2" 
                                                sx={{
                                                    color: 'rgba(255,255,255,0.8)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5
                                                }}
                                            >
                                                <ApartmentIcon sx={{ fontSize: 16 }} />
                                                {vendor.company}
                                            </Typography>  
                                            <Typography 
                                                variant="body2" 
                                                sx={{
                                                    color: 'rgba(255,255,255,0.8)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5
                                                }}
                                            >
                                                <Email sx={{ fontSize: 16 }} />
                                                {vendor.emailAddress}
                                            </Typography>                                            
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}

                {/* Add Vendor Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card 
                        elevation={0}
                        sx={{ 
                            height: '100%', 
                            minHeight: 260,
                            borderRadius: 4,
                            border: '3px dashed #d1fae5',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                                borderColor: '#059669',
                                transform: 'translateY(-4px) scale(1.01)',
                                boxShadow: '0 20px 40px rgba(5, 150, 105, 0.15)',
                                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
                            }
                        }}
                        onClick={() => setIsCreateVendorModalOpen(true)}
                    >
                        <Box sx={{ 
                            position: 'absolute', 
                            top: -30, 
                            right: -30, 
                            width: 120, 
                            height: 120, 
                            borderRadius: '50%', 
                            background: 'rgba(5, 150, 105, 0.08)' 
                        }} />
                        
                        <CardContent sx={{ textAlign: 'center', p: 4, position: 'relative', zIndex: 1 }}>
                            <Box 
                                sx={{ 
                                    width: 72, 
                                    height: 72, 
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                    boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3)'
                                }}
                            >
                                <PersonAddIcon sx={{ fontSize: 32, color: '#fff' }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669', mb: 0.5 }}>
                                Add New Vendor
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                Start a new negotiation journey
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Floating Action Button */}
            {showFab && (
                <Zoom in={true}>
                    <Fab
                        color="primary"
                        aria-label="add vendor"
                        onClick={() => setIsCreateVendorModalOpen(true)}
                        sx={{
                            position: 'fixed',
                            bottom: 32,
                            right: 32,
                            backgroundColor: '#059669',
                            '&:hover': { backgroundColor: '#047857' },
                            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3)'
                        }}
                    >
                        <PersonAddIcon />
                    </Fab>
                </Zoom>
            )}

            <CreateVendorModal
                open={isCreateVendorModalOpen}
                onClose={() => setIsCreateVendorModalOpen(false)}
                project_id={project_id}
            />
        </>
    );
};

export default VendorCards;
