import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Box, CircularProgress, List, ListItem, ListItemText, Paper, Divider, Alert, Chip } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Define the structure for a parsed email
interface Email {
    id: string;
    snippet: string;
    subject: string;
    from: string;
    date: string;
}

const useGoogleToken = () => {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = sessionStorage.getItem('googleAccessToken');
        setToken(storedToken);
    }, []); 

    return token;
}

const GmailPage: React.FC = () => {
    const googleAccessToken = useGoogleToken();
    console.log("Google Access Token:", googleAccessToken);
    const [emails, setEmails] = useState<Email[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmails = useCallback(async () => {
        if (!googleAccessToken) {
            setError("Google access token is missing. Please ensure you logged in with Google and granted the necessary scope (e.g., gmail.readonly).");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const listMessagesUrl = 'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10';
        
        try {
            const listResponse = await fetch(listMessagesUrl, {
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`,
                    'Accept': 'application/json',
                },
            });

            if (!listResponse.ok) {
                throw new Error(`API list failed with status: ${listResponse.status}`);
            }

            const listData = await listResponse.json();
            const messages = listData.messages || [];

            if (messages.length === 0) {
                setEmails([]);
                setIsLoading(false);
                return;
            }

            const detailPromises = messages.map((message: { id: string }) => {
                const detailUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`;
                return fetch(detailUrl, {
                    headers: {
                        'Authorization': `Bearer ${googleAccessToken}`,
                    },
                }).then(res => res.json());
            });

            const emailDetails = await Promise.all(detailPromises);
            
            const parsedEmails: Email[] = emailDetails.map((detail: any) => {
                const getHeader = (name: string) => 
                    detail.payload?.headers?.find((header: any) => header.name === name)?.value || 'N/A';

                return {
                    id: detail.id,
                    snippet: detail.snippet || 'No snippet available.',
                    subject: getHeader('Subject') || 'No Subject',
                    from: getHeader('From') || 'Unknown Sender',
                    date: new Date(getHeader('Date')).toLocaleString() || 'Unknown Date',
                };
            });

            setEmails(parsedEmails);

        } catch (err: any) {
            console.error("Error fetching Gmail data:", err);
            setError(`Failed to fetch emails. Check console for details. (Did you grant the 'gmail.readonly' scope?) Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [googleAccessToken]);

    useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);


    if (!googleAccessToken) {
        return (
            <Paper 
                elevation={0}
                sx={{ 
                    p: 4, 
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}
            >
                <EmailIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
                    Gmail Integration
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    Sign in with Google and grant the gmail.readonly scope to view your emails.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper 
            elevation={0}
            sx={{ 
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 3,
                    borderBottom: '1px solid #e2e8f0'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box 
                        sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 2,
                            backgroundColor: '#fef2f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <EmailIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>
                            Recent Emails
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Synced from Gmail
                        </Typography>
                    </Box>
                </Box>
                <Chip 
                    label={`${emails.length} messages`}
                    size="small"
                    sx={{ 
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                        fontWeight: 500
                    }}
                />
            </Box>

            {error && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        m: 2,
                        borderRadius: 2
                    }}
                >
                    {error}
                </Alert>
            )}

            {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#64748b' }} />
                    <Typography variant="body2" sx={{ ml: 2, color: '#64748b' }}>
                        Loading emails...
                    </Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {emails.length === 0 ? (
                        <ListItem sx={{ py: 4, justifyContent: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                No emails found
                            </Typography>
                        </ListItem>
                    ) : (
                        emails.map((email, index) => (
                            <React.Fragment key={email.id}>
                                <ListItem 
                                    alignItems="flex-start" 
                                    sx={{ 
                                        px: 3,
                                        py: 2,
                                        transition: 'all 0.15s ease',
                                        '&:hover': { 
                                            backgroundColor: '#f8fafc'
                                        },
                                        cursor: 'pointer'
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        fontWeight: 600,
                                                        color: '#1e293b',
                                                        pr: 2,
                                                        flex: 1
                                                    }}
                                                >
                                                    {email.subject}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                                    <AccessTimeIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                                                    <Typography 
                                                        variant="caption" 
                                                        sx={{ 
                                                            color: '#94a3b8',
                                                            fontSize: 11
                                                        }}
                                                    >
                                                        {email.date}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                        secondary={
                                            <React.Fragment>
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    sx={{ 
                                                        display: 'block',
                                                        color: '#64748b',
                                                        fontWeight: 500,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    {email.from}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    sx={{ 
                                                        color: '#94a3b8',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        fontSize: 13
                                                    }}
                                                >
                                                    {email.snippet}
                                                </Typography>
                                            </React.Fragment>
                                        }
                                    />
                                </ListItem>
                                {index < emails.length - 1 && <Divider sx={{ borderColor: '#f1f5f9' }} />}
                            </React.Fragment>
                        ))
                    )}
                </List>
            )}
        </Paper>
    );
};

export default GmailPage;