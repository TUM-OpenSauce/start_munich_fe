import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../services/UserService';
import { Box, Paper, Button, Typography, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const userService = new UserService();

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log(user.displayName);

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleAccessToken = credential?.accessToken;

      if (googleAccessToken) {
          // Save the token to sessionStorage so GmailPage can access it
          sessionStorage.setItem('googleAccessToken', googleAccessToken);
      }

      const userProfile = await userService.getUserProfileByEmail(user.email || '');

      console.log('User profile after sign-in:', userProfile);

      if (userProfile) {
        console.log('User registered, redirecting to dashboard.');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('New user detected, redirecting to registration.');
        // New user, redirect to registration form
        navigate('/register', { replace: true });
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setIsSigningIn(false);
      // Optional: show a user-friendly error message
    }
  };

  return (
    <Box 
        sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh', 
            backgroundColor: '#f8fafc',
            px: 2
        }}
    >
        <Paper 
            elevation={0} 
            sx={{ 
                p: { xs: 4, sm: 6 }, 
                maxWidth: 420, 
                width: '100%', 
                borderRadius: 4,
                border: '1px solid #e2e8f0',
                textAlign: 'center'
            }}
        >
            {/* Logo/Brand */}
            <Box 
                sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: 3, 
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                }}
            >
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>OS</Typography>
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
                Welcome back
            </Typography>
            <Typography 
                variant="body1" 
                sx={{ 
                    color: '#64748b',
                    mb: 4
                }}
            >
                Sign in to access your OpenSauce dashboard
            </Typography>
            
            <Button
                onClick={handleGoogleSignIn}
                variant="outlined"
                startIcon={isSigningIn ? <CircularProgress size={20} sx={{ color: '#64748b' }} /> : <GoogleIcon />}
                fullWidth
                sx={{ 
                    py: 1.75, 
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#1e293b',
                    borderColor: '#e2e8f0',
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    '&:hover': {
                        backgroundColor: '#f8fafc',
                        borderColor: '#cbd5e1'
                    }
                }}
                disabled={isSigningIn}
            >
                {isSigningIn ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <Typography 
                variant="caption" 
                sx={{ 
                    display: 'block',
                    mt: 4,
                    color: '#94a3b8'
                }}
            >
                By signing in, you agree to our Terms of Service
            </Typography>
        </Paper>
    </Box>
  );
};

export default Login;