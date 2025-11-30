import React, { useState } from 'react';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../services/UserService';
import { useProjects } from '../context/ProjectContext';
import { 
    Container, Card, CardContent, Typography, TextField, 
    Button, Alert, CircularProgress, Box, InputAdornment,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import BusinessIcon from '@mui/icons-material/Business';

const userService = new UserService();

const UserRegistration: React.FC = () => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const { fetchUserProfile } = useProjects();
    const [company, setCompany] = useState(''); 
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const derivedFirstName = user?.displayName

    if (!user) {
        return 
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Alert severity="warning">You need to be logged in to register a profile.</Alert>
        </Container>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        const profileData = {
            username: derivedFirstName!,
            email: user.email || 'N/A', 
            company: company.trim(),
        };

        try {
            const NewProfile = await userService.saveUserProfile(profileData);
            await fetchUserProfile(NewProfile.email); 
            navigate('/dashboard', { replace: true });
        } catch (err) {
            console.error("Registration failed:", err);
            setError("Failed to save profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login', { replace: true });
    };

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '100vh',
                backgroundColor: '#f8fafc',
                py: 4,
                px: 2
            }}
        >
            <Card 
                elevation={0}
                sx={{ 
                    width: '100%', 
                    maxWidth: 440,
                    borderRadius: 4, 
                    border: '1px solid #e2e8f0',
                    p: { xs: 3, sm: 4 } 
                }}
            >
                <CardContent sx={{ p: 0 }}>
                    {/* Header with logo and logout */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box 
                            sx={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: 2.5, 
                                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>OS</Typography>
                        </Box>
                        
                        <Button
                            onClick={handleLogout}
                            size="small"
                            startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
                            sx={{ 
                                color: '#64748b',
                                fontSize: 13,
                                fontWeight: 500,
                                textTransform: 'none',
                                '&:hover': {
                                    color: '#ef4444',
                                    backgroundColor: '#fef2f2'
                                }
                            }}
                        >
                            Sign out
                        </Button>
                    </Box>

                    <Typography 
                        variant="h4" 
                        component="h1" 
                        sx={{ 
                            fontWeight: 700,
                            color: '#1e293b',
                            letterSpacing: '-0.02em',
                            mb: 1
                        }}
                    >
                        Complete your profile
                    </Typography>
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            color: '#64748b',
                            mb: 4
                        }}
                    >
                        Welcome, {derivedFirstName}! Just a few more details to get started.
                    </Typography>
                    
                    {/* Info Box */}
                    <Box 
                        sx={{ 
                            mb: 4, 
                            p: 2, 
                            backgroundColor: '#f8fafc', 
                            borderRadius: 2,
                            border: '1px solid #e2e8f0'
                        }}
                    >
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: '#64748b',
                                fontSize: 13
                            }}
                        >
                            Your name <strong style={{ color: '#1e293b' }}>{derivedFirstName}</strong> was imported from your Google account.
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        
                        <TextField
                            fullWidth
                            label="Company"
                            placeholder="Your organization (optional)"
                            variant="outlined"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            sx={{ mb: 3 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <BusinessIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {error && (
                            <Alert 
                                severity="error" 
                                sx={{ 
                                    mb: 3,
                                    borderRadius: 2
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isSaving || !!error}
                            sx={{ 
                                py: 1.75, 
                                borderRadius: 2,
                                backgroundColor: '#1e293b',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                '&:hover': {
                                    backgroundColor: '#334155'
                                }
                            }}
                        >
                            {isSaving ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <CircularProgress size={20} sx={{ color: '#fff' }} />
                                    <span>Creating account...</span>
                                </Box>
                            ) : (
                                'Complete Setup'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default UserRegistration;