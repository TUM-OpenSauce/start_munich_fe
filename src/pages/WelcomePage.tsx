import React from 'react';
import { useProjects } from '../context/ProjectContext';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { Typography, Box, Paper, Grid, Chip } from '@mui/material';
import GmailPage from './GmailPage';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FolderIcon from '@mui/icons-material/Folder';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const WelcomePage: React.FC = () => {
  const { userProfile, projects } = useProjects();
  const [user] = useAuthState(auth);

  const userName = userProfile?.username || user?.displayName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  // Stats data
  const stats = [
    { 
      label: 'Active Projects', 
      value: projects.length || 0, 
      icon: <FolderIcon sx={{ fontSize: 24 }} />,
      color: '#1e293b',
      bgColor: '#f1f5f9'
    },
    { 
      label: 'Total Vendors', 
      value: 12, 
      icon: <GroupIcon sx={{ fontSize: 24 }} />,
      color: '#059669',
      bgColor: '#ecfdf5'
    },
    { 
      label: 'This Month', 
      value: '+24%', 
      icon: <TrendingUpIcon sx={{ fontSize: 24 }} />,
      color: '#f97316',
      bgColor: '#fff7ed'
    },
    { 
      label: 'Avg Response', 
      value: '2.4h', 
      icon: <AccessTimeIcon sx={{ fontSize: 24 }} />,
      color: '#8b5cf6',
      bgColor: '#f5f3ff'
    },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
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
          {greeting}, {userName}
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#64748b',
            fontSize: '1.05rem'
          }}
        >
          Here's what's happening with your vendor management today.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: '#64748b', 
                      fontSize: 11, 
                      fontWeight: 600,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: '#1e293b',
                      mt: 0.5
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    width: 48,
                    height: 48,
                    minWidth: 48,
                    minHeight: 48,
                    borderRadius: '50%', 
                    backgroundColor: stat.bgColor,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Company Info Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              height: '100%'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: '#1e293b',
                mb: 3
              }}
            >
              Account Overview
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, fontSize: 11 }}>
                  ORGANIZATION
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', mt: 0.5 }}>
                  {userProfile?.company || 'Not specified'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, fontSize: 11 }}>
                  MEMBER SINCE
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', mt: 0.5 }}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, fontSize: 11 }}>
                  ACCOUNT STATUS
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label="Active" 
                    size="small"
                    sx={{ 
                      backgroundColor: '#ecfdf5', 
                      color: '#059669',
                      fontWeight: 600,
                      fontSize: 12
                    }} 
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions / Info */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              height: '100%'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: '#1e293b',
                mb: 2
              }}
            >
              Getting Started
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#64748b',
                lineHeight: 1.7,
                mb: 3
              }}
            >
              Welcome to OpenSauce, your centralized vendor management platform. Navigate through projects using the sidebar, 
              compare vendors, and track your team's progress all in one place.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {['View Projects', 'Manage Vendors', 'Analytics'].map((action, i) => (
                <Box 
                  key={i}
                  sx={{ 
                    px: 3, 
                    py: 1.5, 
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#f8fafc',
                      borderColor: '#1e293b'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                    {action}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Gmail Integration */}
      <Box sx={{ mt: 4 }}>
        <GmailPage />
      </Box>
    </Box>
  );
};

export default WelcomePage;