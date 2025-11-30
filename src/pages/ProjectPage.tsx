import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import {
Box, Typography, Card, CardContent,
CircularProgress, Button, Grid, IconButton,
Dialog, DialogContent, DialogActions, TextField,
Fab, Zoom, InputAdornment
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LaunchIcon from '@mui/icons-material/Launch';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DescriptionIcon from '@mui/icons-material/Description';

// ============================================================================
// CREATE PROJECT MODAL
// ============================================================================
interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onClose }) => {
    const { createProject } = useProjects();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Project name is required');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const newProject = await createProject(name.trim(), description.trim());
            if (newProject) {
                setName('');
                setDescription('');
                onClose();
                // Navigate to the new project
                navigate(`/projects/${newProject.project_id}`);
            } else {
                setError('Failed to create project. Please try again.');
            }
        } catch (err) {
            console.error('Error creating project:', err);
            setError('Failed to create project. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (!isCreating) {
            setName('');
            setDescription('');
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
            {/* Gradient Header */}
            <Box 
                sx={{ 
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
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
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <CreateNewFolderIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Create New Project
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Start a new vendor management project
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <DialogContent sx={{ p: 3, pt: 4 }}>
                <TextField
                    autoFocus
                    fullWidth
                    label="Project Name"
                    placeholder="e.g., Website Redesign, Mobile App Development"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={!!error && !name.trim()}
                    sx={{ mb: 3 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <FolderIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                />
                
                <TextField
                    fullWidth
                    label="Description"
                    placeholder="Describe the project goals, scope, and key requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={4}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                <DescriptionIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
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
                    sx={{ 
                        color: '#64748b',
                        fontWeight: 500,
                        px: 3
                    }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleCreate}
                    variant="contained"
                    disabled={isCreating || !name.trim()}
                    startIcon={isCreating ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <AddIcon />}
                    sx={{ 
                        backgroundColor: '#1e293b',
                        fontWeight: 600,
                        px: 3,
                        borderRadius: 2,
                        '&:hover': { backgroundColor: '#334155' },
                        '&:disabled': { backgroundColor: '#94a3b8' }
                    }}
                >
                    {isCreating ? 'Creating...' : 'Create Project'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const ProjectsPage: React.FC = () => {
const { projects, isLoading, fetchProjects } = useProjects();
const navigate = useNavigate();
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

useEffect(() => {
    // Ensuring fetchProjects is only called if projects are missing
    if (projects.length === 0) {
        fetchProjects();
    }
}, [fetchProjects, projects.length]);

const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
};

if (isLoading) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <CircularProgress size={48} sx={{ color: '#1e293b' }} />
            <Typography variant="body1" sx={{ mt: 3, color: '#64748b', fontWeight: 500 }}>
                Loading projects...
            </Typography>
        </Box>
    );
}

return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
                <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ 
                        fontWeight: 700,
                        color: '#1e293b',
                        letterSpacing: '-0.02em',
                        mb: 0.5
                    }}
                >
                    Projects
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                    Manage and track all your vendor projects
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button 
                    variant="outlined" 
                    onClick={fetchProjects} 
                    startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
                    sx={{ 
                        borderRadius: 2,
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        fontWeight: 500,
                        '&:hover': {
                            borderColor: '#cbd5e1',
                            backgroundColor: '#f8fafc'
                        }
                    }}
                >
                    Refresh
                </Button>
                <Button 
                    variant="contained" 
                    onClick={() => setIsCreateModalOpen(true)} 
                    startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                    sx={{ 
                        borderRadius: 2,
                        backgroundColor: '#1e293b',
                        fontWeight: 600,
                        px: 2.5,
                        '&:hover': { backgroundColor: '#334155' }
                    }}
                >
                    New Project
                </Button>
            </Box>
        </Box>

        {/* Project Stats */}
        <Box 
            sx={{ 
                display: 'flex', 
                gap: 3, 
                mb: 4,
                pb: 4,
                borderBottom: '1px solid #e2e8f0'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 2, 
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <FolderIcon sx={{ color: '#64748b', fontSize: 20 }} />
                </Box>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                        {projects.length}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                        Total Projects
                    </Typography>
                </Box>
            </Box>
        </Box>

        {projects.length === 0 ? (
            <Box 
                sx={{ 
                    textAlign: 'center', 
                    py: 10,
                    px: 4,
                    backgroundColor: '#f8fafc',
                    borderRadius: 3,
                    border: '1px dashed #e2e8f0'
                }}
            >
                <Box 
                    sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%',
                        backgroundColor: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3
                    }}
                >
                    <FolderIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                    No projects yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                    Create your first project to start managing vendors
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => setIsCreateModalOpen(true)}
                    startIcon={<AddIcon />}
                    sx={{ 
                        backgroundColor: '#1e293b',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                        py: 1.25,
                        '&:hover': { backgroundColor: '#334155' }
                    }}
                >
                    Create Your First Project
                </Button>
            </Box>
        ) : (
            <Grid container spacing={3}>
                {projects.map((project, index) => {
                    // Subtle accent colors for each project
                    const accentColors = ['#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ef4444'];
                    const accent = accentColors[index % accentColors.length];
                    
                    return (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.project_id}> 
                            <Card 
                                elevation={0}
                                sx={{ 
                                    height: '100%', 
                                    borderRadius: 3, 
                                    border: '1px solid #e2e8f0',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backgroundColor: '#ffffff',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        borderColor: accent,
                                        transform: 'translateY(-4px)',
                                        boxShadow: `0 12px 24px ${accent}15`
                                    }
                                }}
                                onClick={() => handleProjectClick(project.project_id)}
                            >
                                {/* Accent bar at top */}
                                <Box sx={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    left: 0, 
                                    right: 0, 
                                    height: 4, 
                                    background: accent 
                                }} />
                                
                                <CardContent sx={{ p: 3, pt: 4 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ 
                                            width: 44, 
                                            height: 44, 
                                            borderRadius: 2.5, 
                                            backgroundColor: `${accent}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FolderIcon sx={{ color: accent, fontSize: 22 }} />
                                        </Box>
                                        <IconButton 
                                            size="small" 
                                            sx={{ 
                                                color: '#94a3b8',
                                                '&:hover': { color: accent, backgroundColor: `${accent}10` }
                                            }}
                                            onClick={(e) => { e.stopPropagation(); handleProjectClick(project.project_id); }}
                                        >
                                            <LaunchIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Box>
                                    
                                    <Typography 
                                        variant="h6" 
                                        component="h3" 
                                        sx={{ 
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            fontSize: '1.1rem',
                                            mb: 1
                                        }}
                                    >
                                        {project.name}
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            color: '#64748b',
                                            mb: 3,
                                            minHeight: 40,
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            lineHeight: 1.6
                                        }}
                                    >
                                        {project.description}
                                    </Typography>
                                    
                                    <Box 
                                        sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 1.5, 
                                            pt: 2,
                                            borderTop: '1px solid #f1f5f9'
                                        }}
                                    >
                                        <CalendarTodayIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
                
                {/* Add New Project Card */}
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card 
                        elevation={0}
                        sx={{ 
                            height: '100%', 
                            minHeight: 200,
                            borderRadius: 3, 
                            border: '2px dashed #e2e8f0',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fafbfc',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                                borderColor: '#1e293b',
                                backgroundColor: '#f8fafc',
                                transform: 'translateY(-4px)',
                                boxShadow: '0 12px 24px rgba(30, 41, 59, 0.08)'
                            }
                        }}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        {/* Decorative circle */}
                        <Box sx={{ 
                            position: 'absolute', 
                            top: -30, 
                            right: -30, 
                            width: 100, 
                            height: 100, 
                            borderRadius: '50%', 
                            background: 'rgba(30, 41, 59, 0.03)' 
                        }} />
                        
                        <CardContent sx={{ textAlign: 'center', p: 3, position: 'relative', zIndex: 1 }}>
                            <Box 
                                sx={{ 
                                    width: 64, 
                                    height: 64, 
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                    boxShadow: '0 8px 24px rgba(30, 41, 59, 0.25)'
                                }}
                            >
                                <AddIcon sx={{ fontSize: 28, color: '#fff' }} />
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                                New Project
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Click to create a new project
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        )}

        {/* Floating Action Button for quick access */}
        <Zoom in={true}>
            <Fab
                color="primary"
                aria-label="create project"
                onClick={() => setIsCreateModalOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    backgroundColor: '#1e293b',
                    '&:hover': { backgroundColor: '#334155' },
                    boxShadow: '0 8px 24px rgba(30, 41, 59, 0.3)'
                }}
            >
                <AddIcon />
            </Fab>
        </Zoom>

        {/* Create Project Modal */}
        <CreateProjectModal 
            open={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
        />
    </Box>
);


};

export default ProjectsPage;