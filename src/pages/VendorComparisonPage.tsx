import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { VendorService } from '../services/VendorService';
import { 
    Box, Typography, CircularProgress, Card,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Button, Rating, Chip, ToggleButtonGroup, ToggleButton,
    FormGroup, FormControlLabel, Checkbox, IconButton, Collapse,
    useMediaQuery, useTheme, Tooltip, LinearProgress
} from '@mui/material';
import { ArrowBack, Compare, ViewColumn, TableRows, Settings, ExpandLess, TrendingUp, Warning, CheckCircle } from '@mui/icons-material';
import type { Vendor } from '../services/ApiService';

const vendorService = new VendorService();

// Define available comparison columns
interface ColumnConfig {
    key: string;
    label: string;
    enabled: boolean;
    category: 'basic' | 'negotiation' | 'risk';
}

const defaultColumns: ColumnConfig[] = [
    // Basic columns
    { key: 'status', label: 'Status', enabled: true, category: 'basic' },
    { key: 'rating', label: 'Rating', enabled: true, category: 'basic' },
    { key: 'specialty', label: 'Specialty', enabled: true, category: 'basic' },
    { key: 'estimatedCost', label: 'Estimated Cost', enabled: true, category: 'basic' },
    { key: 'tasksCompleted', label: 'Tasks Completed', enabled: true, category: 'basic' },
    // Negotiation metadata columns
    { key: 'dealHealth', label: 'Deal Health', enabled: true, category: 'negotiation' },
    { key: 'latestPrice', label: 'Latest Quoted Price', enabled: true, category: 'negotiation' },
    { key: 'discount', label: 'Discount %', enabled: true, category: 'negotiation' },
    { key: 'wiggleRoom', label: 'Wiggle Room', enabled: true, category: 'negotiation' },
    { key: 'dealPhase', label: 'Deal Phase', enabled: false, category: 'negotiation' },
    { key: 'buyerPower', label: 'Buyer Power', enabled: false, category: 'negotiation' },
    // Risk columns  
    { key: 'stalemateRisk', label: 'Stalemate Risk', enabled: true, category: 'risk' },
    { key: 'sellerFloorHit', label: 'Seller Floor Hit %', enabled: false, category: 'risk' },
    { key: 'urgency', label: 'Seller Urgency', enabled: false, category: 'risk' },
];

const VendorComparisonPage: React.FC = () => {
    const { project_id } = useParams<{ project_id: string }>();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');
    const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
    const [showSettings, setShowSettings] = useState(false);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Auto-switch to vertical on mobile
    useEffect(() => {
        if (isMobile) {
            setViewMode('vertical');
        }
    }, [isMobile]);

    useEffect(() => {
        const fetchVendors = async () => {
            if (!project_id) return;
            setIsLoading(true);
            try {
                const fetchedVendors = await vendorService.getVendorsByProjectId(project_id);
                setVendors(fetchedVendors);
            } catch (error) {
                console.error("Error fetching vendors for comparison:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVendors();
    }, [project_id]);

    const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: 'horizontal' | 'vertical' | null) => {
        if (newView !== null) {
            setViewMode(newView);
        }
    };

    const handleColumnToggle = (key: string) => {
        setColumns(prev => prev.map(col => 
            col.key === key ? { ...col, enabled: !col.enabled } : col
        ));
    };
    
    const formatCurrency = (amount: number, currency: string = 'USD') => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

    const getHealthColor = (score: number) => {
        if (score >= 80) return { bg: '#ecfdf5', color: '#059669', label: 'Excellent' };
        if (score >= 60) return { bg: '#fef3c7', color: '#d97706', label: 'Good' };
        if (score >= 40) return { bg: '#fed7aa', color: '#ea580c', label: 'Fair' };
        return { bg: '#fecaca', color: '#dc2626', label: 'At Risk' };
    };

    const getRiskColor = (risk: number) => {
        if (risk <= 20) return { bg: '#ecfdf5', color: '#059669' };
        if (risk <= 40) return { bg: '#fef3c7', color: '#d97706' };
        if (risk <= 60) return { bg: '#fed7aa', color: '#ea580c' };
        return { bg: '#fecaca', color: '#dc2626' };
    };

    const enabledColumns = columns.filter(col => col.enabled);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <CircularProgress size={48} sx={{ color: '#1e293b' }} />
                <Typography variant="body1" sx={{ mt: 3, color: '#64748b', fontWeight: 500 }}>
                    Loading vendors...
                </Typography>
            </Box>
        );
    }

    if (vendors.length === 0) {
        return (
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                <Box sx={{ mb: 4 }}>
                    <Button 
                        component={RouterLink} 
                        to={`/projects/${project_id}`}
                        startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
                        sx={{ 
                            color: '#64748b',
                            fontWeight: 500,
                            mb: 3,
                            '&:hover': { backgroundColor: '#f1f5f9' }
                        }}
                    >
                        Back to Project
                    </Button>
                </Box>
                <Card 
                    elevation={0}
                    sx={{ 
                        p: 6, 
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}
                >
                    <Compare sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                        No vendors to compare
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Add vendors to this project to see comparison data.
                    </Typography>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    mb: 4,
                    pb: 3,
                    borderBottom: '1px solid #e2e8f0'
                }}
            >
                <Button 
                    component={RouterLink} 
                    to={`/projects/${project_id}`}
                    startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
                    sx={{ 
                        color: '#64748b',
                        fontWeight: 500,
                        '&:hover': { backgroundColor: '#f1f5f9' }
                    }}
                >
                    Back to Project
                </Button>

                {/* View Toggle & Settings */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewChange}
                        size="small"
                        sx={{ 
                            '& .MuiToggleButton-root': {
                                border: '1px solid #e2e8f0',
                                color: '#64748b',
                                px: 2,
                                py: 0.75,
                                '&.Mui-selected': {
                                    backgroundColor: '#1e293b',
                                    color: '#ffffff',
                                    '&:hover': { backgroundColor: '#334155' }
                                },
                                '&:hover': { backgroundColor: '#f1f5f9' }
                            }
                        }}
                    >
                        <ToggleButton value="horizontal">
                            <TableRows sx={{ fontSize: 18, mr: { xs: 0, sm: 1 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Horizontal</Box>
                        </ToggleButton>
                        <ToggleButton value="vertical">
                            <ViewColumn sx={{ fontSize: 18, mr: { xs: 0, sm: 1 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Vertical</Box>
                        </ToggleButton>
                    </ToggleButtonGroup>
                    
                    <IconButton 
                        onClick={() => setShowSettings(!showSettings)}
                        sx={{ 
                            color: showSettings ? '#1e293b' : '#64748b',
                            backgroundColor: showSettings ? '#f1f5f9' : 'transparent',
                            '&:hover': { backgroundColor: '#f1f5f9' }
                        }}
                    >
                        <Settings sx={{ fontSize: 20 }} />
                    </IconButton>
                </Box>
            </Box>

            {/* Column Settings Panel */}
            <Collapse in={showSettings}>
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 3, 
                        mb: 3, 
                        borderRadius: 2,
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            Customize Columns
                        </Typography>
                        <IconButton size="small" onClick={() => setShowSettings(false)}>
                            <ExpandLess sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                    
                    {/* Basic Columns */}
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 1, display: 'block' }}>
                        BASIC INFO
                    </Typography>
                    <FormGroup row sx={{ gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {columns.filter(c => c.category === 'basic').map((col) => (
                            <FormControlLabel
                                key={col.key}
                                control={
                                    <Checkbox 
                                        checked={col.enabled} 
                                        onChange={() => handleColumnToggle(col.key)}
                                        size="small"
                                        sx={{ 
                                            color: '#94a3b8',
                                            '&.Mui-checked': { color: '#1e293b' }
                                        }}
                                    />
                                }
                                label={col.label}
                                sx={{ 
                                    '& .MuiFormControlLabel-label': { 
                                        fontSize: 13, 
                                        color: '#64748b' 
                                    } 
                                }}
                            />
                        ))}
                    </FormGroup>
                    
                    {/* Negotiation Columns */}
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, mb: 1, display: 'block' }}>
                        NEGOTIATION DATA
                    </Typography>
                    <FormGroup row sx={{ gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {columns.filter(c => c.category === 'negotiation').map((col) => (
                            <FormControlLabel
                                key={col.key}
                                control={
                                    <Checkbox 
                                        checked={col.enabled} 
                                        onChange={() => handleColumnToggle(col.key)}
                                        size="small"
                                        sx={{ 
                                            color: '#94a3b8',
                                            '&.Mui-checked': { color: '#059669' }
                                        }}
                                    />
                                }
                                label={col.label}
                                sx={{ 
                                    '& .MuiFormControlLabel-label': { 
                                        fontSize: 13, 
                                        color: '#64748b' 
                                    } 
                                }}
                            />
                        ))}
                    </FormGroup>
                    
                    {/* Risk Columns */}
                    <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600, mb: 1, display: 'block' }}>
                        RISK ANALYSIS
                    </Typography>
                    <FormGroup row sx={{ gap: 1, flexWrap: 'wrap' }}>
                        {columns.filter(c => c.category === 'risk').map((col) => (
                            <FormControlLabel
                                key={col.key}
                                control={
                                    <Checkbox 
                                        checked={col.enabled} 
                                        onChange={() => handleColumnToggle(col.key)}
                                        size="small"
                                        sx={{ 
                                            color: '#94a3b8',
                                            '&.Mui-checked': { color: '#dc2626' }
                                        }}
                                    />
                                }
                                label={col.label}
                                sx={{ 
                                    '& .MuiFormControlLabel-label': { 
                                        fontSize: 13, 
                                        color: '#64748b' 
                                    } 
                                }}
                            />
                        ))}
                    </FormGroup>
                </Paper>
            </Collapse>

            {/* Title */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box 
                        sx={{ 
                            width: 44, 
                            height: 44, 
                            borderRadius: 2,
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Compare sx={{ color: '#1e293b', fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 700,
                                color: '#1e293b',
                                letterSpacing: '-0.02em',
                                fontSize: { xs: '1.5rem', sm: '2rem' }
                            }}
                        >
                            Vendor Comparison
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Compare {vendors.length} vendors • {enabledColumns.length} attributes
                        </Typography>
                    </Box>
                </Box>
            </Box>
            
            {/* Horizontal View - Traditional Table */}
            {viewMode === 'horizontal' && (
                <TableContainer 
                    component={Paper} 
                    elevation={0}
                    sx={{ 
                        borderRadius: 3, 
                        border: '1px solid #e2e8f0',
                        overflow: 'auto'
                    }}
                >
                    <Table sx={{ minWidth: 600 }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 2.5, position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Vendor</TableCell>
                                {enabledColumns.map(col => (
                                    <TableCell 
                                        key={col.key} 
                                        align={col.key === 'estimatedCost' || col.key === 'tasksCompleted' ? 'right' : 'center'} 
                                        sx={{ fontWeight: 600, color: '#1e293b' }}
                                    >
                                        {col.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vendors.map((vendor) => (
                                <TableRow 
                                    key={vendor.vendor_id} 
                                    component={RouterLink}
                                    to={`/projects/${project_id}/vendors/${vendor.vendor_id}`}
                                    sx={{ 
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        '&:hover': { backgroundColor: '#f8fafc' },
                                        '&:last-child td': { border: 0 }
                                    }}
                                >
                                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                                        <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                                            {vendor.name}
                                        </Typography>
                                    </TableCell>
                                    {enabledColumns.map(col => (
                                        <TableCell 
                                            key={col.key} 
                                            align={col.key === 'estimatedCost' || col.key === 'tasksCompleted' ? 'right' : 'center'}
                                        >                                            
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Vertical View - Vendors as Columns Table */}
            {viewMode === 'vertical' && (
                <TableContainer 
                    component={Paper} 
                    elevation={0}
                    sx={{ 
                        borderRadius: 3, 
                        border: '1px solid #e2e8f0',
                        overflow: 'auto'
                    }}
                >
                    <Table sx={{ minWidth: 400 }}>
                        {/* Header Row with Vendor Names */}
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                <TableCell 
                                    sx={{ 
                                        fontWeight: 600, 
                                        color: '#94a3b8', 
                                        py: 2,
                                        width: 140,
                                        minWidth: 140,
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderRight: '1px solid #e2e8f0',
                                        position: 'sticky',
                                        left: 0,
                                        backgroundColor: '#f8fafc',
                                        zIndex: 2
                                    }}
                                >
                                    Attribute
                                </TableCell>
                                {vendors.map((vendor) => (
                                    <TableCell 
                                        key={vendor.vendor_id}
                                        align="center"
                                        sx={{ 
                                            py: 2,
                                            minWidth: 160,
                                            borderBottom: '1px solid #e2e8f0'
                                        }}
                                    >
                                        <Box
                                            component={RouterLink}
                                            to={`/projects/${project_id}/vendors/${vendor.vendor_id}`}
                                            sx={{
                                                textDecoration: 'none',
                                                display: 'block',
                                                transition: 'opacity 0.15s ease',
                                                '&:hover': { opacity: 0.7 }
                                            }}
                                        >
                                            <Typography 
                                                sx={{ 
                                                    fontWeight: 700, 
                                                    color: '#1e293b',
                                                    fontSize: 15,
                                                    mb: 0.5
                                                }}
                                            >
                                                {vendor.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        
                        {/* Attribute Rows */}
                        <TableBody>
                            {enabledColumns.filter(col => col.key !== 'status').map((col, index) => (
                                <TableRow 
                                    key={col.key}
                                    sx={{ 
                                        '&:hover': { backgroundColor: '#fafafa' },
                                        '&:last-child td': { borderBottom: 0 }
                                    }}
                                >
                                    <TableCell 
                                        sx={{ 
                                            fontWeight: 500, 
                                            color: '#64748b',
                                            fontSize: 13,
                                            py: 2.5,
                                            borderRight: '1px solid #e2e8f0',
                                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 1
                                        }}
                                    >
                                        {col.label}
                                    </TableCell>
                                    {vendors.map((vendor) => (
                                        <TableCell 
                                            key={vendor.vendor_id}
                                            align="center"
                                            sx={{ 
                                                py: 2.5,
                                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                                            }}
                                        >
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default VendorComparisonPage;