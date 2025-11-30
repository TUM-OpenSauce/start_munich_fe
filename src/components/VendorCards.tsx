import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { 
    Box, Typography, Card, CardContent, Grid,
    CircularProgress, Dialog, DialogContent, DialogActions,
    TextField, Button, InputAdornment, DialogTitle
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AddIcon from '@mui/icons-material/Add';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import type { Vendor } from '../services/ApiService';
import { Email } from '@mui/icons-material';

// ============================================================================
// CREATE VENDOR MODAL - Minimalist Design
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
            setError('Company is required');
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
                    borderRadius: 3,
                    border: '1px solid #e2e8f0'
                }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Add Vendor
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                    Add a new vendor to this project
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                <TextField
                    autoFocus
                    fullWidth
                    label="Vendor Name"
                    placeholder="e.g., Alpha Solutions"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={!!error && !name.trim()}
                    sx={{ mb: 2.5 }}
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
                    placeholder="Company name"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    error={!!error && !specialty.trim()}
                    sx={{ mb: 2.5 }}
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
                    label="Email Address"
                    placeholder="vendor@company.com"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Email sx={{ color: '#94a3b8', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                    helperText="Optional: Enter email to get vendor information"
                />

                {error && (
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: '#dc2626', 
                            mt: 2,
                            fontSize: 13
                        }}
                    >
                        {error}
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
                <Button 
                    onClick={handleClose}
                    disabled={isCreating}
                    sx={{ color: '#64748b', fontWeight: 500 }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleCreate}
                    variant="contained"
                    disabled={isCreating || !name.trim() || !specialty.trim()}
                    sx={{ 
                        backgroundColor: '#1e293b',
                        fontWeight: 500,
                        borderRadius: 2,
                        '&:hover': { backgroundColor: '#334155' },
                        '&:disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8' }
                    }}
                >
                    {isCreating ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Add Vendor'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ============================================================================
// VENDOR CARDS COMPONENT - Minimalist Design
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
                        Vendors
                    </Typography>
                    {showAddButton && (
                        <Button
                            size="small"
                            onClick={() => setIsCreateVendorModalOpen(true)}
                            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                            sx={{ 
                                color: '#64748b',
                                fontWeight: 500,
                                '&:hover': {
                                    backgroundColor: '#f1f5f9'
                                }
                            }}
                        >
                            Add
                        </Button>
                    )}
                </Box>
            )}

            <Grid container spacing={2}> 
                {vendors.map((vendor) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={vendor.vendor_id}> 
                        <Card 
                            elevation={0}
                            sx={{ 
                                height: '100%', 
                                borderRadius: 3,
                                border: '1px solid #e2e8f0',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backgroundColor: '#fff',
                                '&:hover': {
                                    borderColor: '#cbd5e1',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    '& .arrow-icon': {
                                        opacity: 1,
                                        transform: 'translate(2px, -2px)'
                                    }
                                }
                            }}
                            onClick={() => handleVendorClick(vendor.vendor_id)}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box 
                                        sx={{ 
                                            width: 40, 
                                            height: 40, 
                                            borderRadius: 2,
                                            backgroundColor: '#f1f5f9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <BusinessIcon sx={{ fontSize: 20, color: '#64748b' }} />
                                    </Box>
                                    <ArrowOutwardIcon 
                                        className="arrow-icon"
                                        sx={{ 
                                            fontSize: 16, 
                                            color: '#94a3b8',
                                            opacity: 0,
                                            transition: 'all 0.2s ease'
                                        }} 
                                    />
                                </Box>
                                
                                <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        mb: 0.5,
                                        lineHeight: 1.3
                                    }}
                                >
                                    {vendor.name}
                                </Typography>
                                
                                {vendor.company && (
                                    <Typography 
                                        variant="body2" 
                                        sx={{ color: '#64748b', mb: 1 }}
                                    >
                                        {vendor.company}
                                    </Typography>
                                )}
                                
                                {vendor.emailAddress && (
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            color: '#94a3b8',
                                            display: 'block'
                                        }}
                                    >
                                        {vendor.emailAddress}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {/* Add Vendor Card */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card 
                        elevation={0}
                        sx={{ 
                            height: '100%', 
                            minHeight: 140,
                            borderRadius: 3,
                            border: '1px dashed #e2e8f0',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fafafa',
                            '&:hover': {
                                borderColor: '#94a3b8',
                                backgroundColor: '#f8fafc'
                            }
                        }}
                        onClick={() => setIsCreateVendorModalOpen(true)}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Box 
                                sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    borderRadius: 2,
                                    backgroundColor: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 1.5
                                }}
                            >
                                <PersonAddIcon sx={{ fontSize: 20, color: '#64748b' }} />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#64748b' }}>
                                Add Vendor
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <CreateVendorModal
                open={isCreateVendorModalOpen}
                onClose={() => setIsCreateVendorModalOpen(false)}
                project_id={project_id}
            />
        </>
    );
};

export default VendorCards;
