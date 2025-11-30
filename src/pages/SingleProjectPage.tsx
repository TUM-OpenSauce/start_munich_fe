import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { 
    Box, Typography, Card, CardContent, Chip, IconButton, Button,
    CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
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
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '60vh' 
            }}>
                <CircularProgress sx={{ color: '#059669' }} />
            </Box>
        );
    }

    // Project not found
    if (!project) {
        return (
            <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                px: 3
            }}>
                <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 600, mb: 2 }}>
                    Project Not Found
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
                    The project you're looking for doesn't exist or has been removed.
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/projects')}
                    sx={{
                        backgroundColor: '#059669',
                        '&:hover': { backgroundColor: '#047857' }
                    }}
                >
                    Back to Projects
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton 
                        onClick={() => navigate('/projects')}
                        sx={{ 
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            '&:hover': { backgroundColor: '#f1f5f9' }
                        }}
                    >
                        <ArrowBackIcon sx={{ color: '#64748b' }} />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            {project.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Manage vendors and track progress
                        </Typography>
                    </Box>
                </Box>
                
                {/* Compare Vendors Button */}
                {currentProjectVendors.length >= 2 && (
                    <Button
                        variant="contained"
                        startIcon={<CompareArrowsIcon />}
                        onClick={() => navigate(`/projects/${project_id}/compare`)}
                        sx={{
                            backgroundColor: '#1e293b',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                            '&:hover': { backgroundColor: '#334155' }
                        }}
                    >
                        Compare Vendors
                    </Button>
                )}
            </Box>

            {/* Project Info Card */}
            <Card 
                elevation={0}
                sx={{ 
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    mb: 4,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    overflow: 'hidden'
                }}
            >
                <Box 
                    sx={{ 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <Box 
                        sx={{ 
                            width: 56, 
                            height: 56, 
                            borderRadius: 3,
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <FolderIcon sx={{ fontSize: 28, color: '#f59e0b' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff' }}>
                            {project.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {project.description || 'No description provided'}
                        </Typography>
                    </Box>
                    <Chip 
                        label="Active" 
                        sx={{ 
                            backgroundColor: '#059669',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 12
                        }} 
                    />
                </Box>

                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarTodayIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                Created: {new Date().toLocaleDateString()}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GroupIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {currentProjectVendors.length} Vendors
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Vendors Section */}
            <Box>
                {isVendorLoading ? (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        py: 8
                    }}>
                        <CircularProgress sx={{ color: '#059669' }} />
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
