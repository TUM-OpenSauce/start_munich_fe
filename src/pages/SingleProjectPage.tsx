import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { 
    Box, Typography, IconButton, Button,
    CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import VendorCards from '../components/VendorCards';

const SingleProjectPage: React.FC = () => {
    const { project_id } = useParams<{ project_id: string }>();
    const navigate = useNavigate();
    const { 
        projects, 
        isLoading, 
        currentProjectVendors, 
        isVendorLoading, 
        fetchVendorsForProject 
    } = useProjects();

    const project = projects.find(p => p.project_id === project_id);

    // Fetch vendors when component mounts or project_id changes
    useEffect(() => {
        if (project_id) {
            fetchVendorsForProject(project_id);
        }
    }, [project_id, fetchVendorsForProject]);

    // Loading state
    if (isLoading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '60vh' 
            }}>
                <CircularProgress size={32} sx={{ color: '#1e293b' }} />
            </Box>
        );
    }

    // Project not found
    if (!project) {
        return (
            <Box sx={{ 
                textAlign: 'center', 
                py: 12,
                px: 3
            }}>
                <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 600, mb: 1 }}>
                    Project not found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
                    This project doesn't exist or has been removed.
                </Typography>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/projects')}
                    sx={{
                        borderColor: '#e2e8f0',
                        color: '#1e293b',
                        fontWeight: 500,
                        '&:hover': { 
                            borderColor: '#1e293b',
                            backgroundColor: 'transparent'
                        }
                    }}
                >
                    Back to Projects
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <IconButton 
                        onClick={() => navigate('/projects')}
                        size="small"
                        sx={{ 
                            color: '#64748b',
                            '&:hover': { backgroundColor: '#f1f5f9' }
                        }}
                    >
                        <ArrowBackIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Projects
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 700, 
                                color: '#1e293b',
                                letterSpacing: '-0.02em',
                                mb: 0.5
                            }}
                        >
                            {project.name}
                        </Typography>
                        {project.description && (
                            <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 500 }}>
                                {project.description}
                            </Typography>
                        )}
                    </Box>
                    
                    {currentProjectVendors.length >= 2 && (
                        <Button
                            variant="outlined"
                            startIcon={<CompareArrowsIcon sx={{ fontSize: 18 }} />}
                            onClick={() => navigate(`/projects/${project_id}/compare`)}
                            sx={{
                                borderColor: '#e2e8f0',
                                color: '#1e293b',
                                fontWeight: 500,
                                borderRadius: 2,
                                px: 2.5,
                                '&:hover': { 
                                    borderColor: '#1e293b',
                                    backgroundColor: 'transparent'
                                }
                            }}
                        >
                            Compare
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Stats Bar */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    gap: 4, 
                    mb: 4,
                    pb: 4,
                    borderBottom: '1px solid #e2e8f0'
                }}
            >
                <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Vendors
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {currentProjectVendors.length}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Status
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        Active
                    </Typography>
                </Box>
            </Box>

            {/* Vendors Section */}
            <Box>
                {isVendorLoading ? (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        py: 8
                    }}>
                        <CircularProgress size={28} sx={{ color: '#64748b' }} />
                    </Box>
                ) : (
                    <VendorCards 
                        vendors={currentProjectVendors} 
                        project_id={project_id || ''} 
                        showTitle={true}
                        showAddButton={true}
                        showFab={true}
                    />
                )}
            </Box>
        </Box>
    );
};

export default SingleProjectPage;
