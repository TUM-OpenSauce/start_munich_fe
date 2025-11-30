import React, { useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VendorCards from '../components/VendorCards';

const VendorsPage: React.FC = () => {
    const { project_id } = useParams<{ project_id: string }>();
    const { projects, isLoading, fetchVendorsForProject, currentProjectVendors, isVendorLoading } = useProjects();

    const project = projects.find(p => p.project_id === project_id);

    useEffect(() => {
        if (project_id && fetchVendorsForProject) {
            fetchVendorsForProject(project_id);
        }
    }, [project_id, fetchVendorsForProject]);

    if (isLoading || isVendorLoading) {
        return <LinearProgress sx={{ mt: 3, borderRadius: 1 }} />;
    }

    if (!project) {
        return (
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="h5" sx={{ color: '#ef4444', fontWeight: 600, mb: 2 }}>
                    Project Not Found
                </Typography>
                <Button 
                    component={RouterLink} 
                    to="/projects" 
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                >
                    Back to Projects
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* Header Navigation */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 4,
                    pb: 3,
                    borderBottom: '1px solid #e2e8f0'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button 
                        component={RouterLink} 
                        to={`/projects/${project_id}`}
                        startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                        sx={{ 
                            color: '#64748b',
                            fontWeight: 500,
                            '&:hover': { backgroundColor: '#f1f5f9' }
                        }}
                    >
                        Back to Project
                    </Button>
                    <Typography sx={{ color: '#cbd5e1' }}>/</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {project.name} - Vendors
                    </Typography>
                </Box>
            </Box>

            {/* Page Title */}
            <Box sx={{ mb: 4 }}>
                <Typography 
                    variant="h4" 
                    sx={{ 
                        fontWeight: 700, 
                        color: '#1e293b',
                        letterSpacing: '-0.02em',
                        mb: 1
                    }}
                >
                    Vendors
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                    Manage and track all vendors for {project.name}
                </Typography>
            </Box>

            {/* Vendor Cards */}
            <VendorCards 
                vendors={currentProjectVendors || []} 
                project_id={project_id || ''} 
                showTitle={false}
                showAddButton={false}
            />
        </Box>
    );
};

export default VendorsPage;
