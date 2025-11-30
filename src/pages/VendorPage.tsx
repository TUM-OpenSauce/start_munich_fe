import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { VendorService } from '../services/VendorService';

import { ApiClient, type ForecasterRequest, type Vendor } from '../services/ApiService';
import { 
    Box, Grid, Card, CardContent, Typography, CircularProgress, 
    TextField, Button, IconButton, Chip, LinearProgress, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
    ArrowBack, Send, Schedule, Security, CheckCircle, Speed, 
    Lightbulb, Business, Person, LocationOn, AccessTime,
    Timeline, Psychology, Handshake, ShowChart, TrendingUp,
    Warning, Group, Email
} from '@mui/icons-material';
import SettingsIcon from '@mui/icons-material/Settings';

const vendorService = new VendorService();
const apiClient = new ApiClient();

// Settings Modal Component
interface VendorSettingsModalProps {
    open: boolean;
    onClose: () => void;
    vendor_id: string;
}

const VendorSettingsModal: React.FC<VendorSettingsModalProps> = ({ open, onClose, vendor_id }) => {
    const [aiGoals, setAiGoals] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            const savedGoals = localStorage.getItem(`vendor_${vendor_id}_ai_goals`) || 'Optimize for cost reduction.';
            setAiGoals(savedGoals);
        }
    }, [open, vendor_id]);

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 800)); 
        localStorage.setItem(`vendor_${vendor_id}_ai_goals`, aiGoals);
        setIsSaving(false);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, border: '1px solid #e2e8f0' } }}
        >
            <DialogTitle sx={{ fontWeight: 600, color: '#1e293b', pb: 1 }}>
                Vendor Settings
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: '#e2e8f0' }}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                    Configure AI goals for this vendor relationship.
                </Typography>
                <TextField
                    autoFocus
                    label="AI Goals"
                    placeholder="Describe your optimization goals..."
                    fullWidth
                    multiline
                    rows={4}
                    value={aiGoals}
                    onChange={(e) => setAiGoals(e.target.value)}
                    helperText="E.g., 'Optimize for speed and latency' or 'Prioritize accuracy over speed'."
                />
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={onClose} disabled={isSaving} sx={{ color: '#64748b' }}>Cancel</Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    disabled={isSaving}
                    sx={{ backgroundColor: '#1e293b', '&:hover': { backgroundColor: '#334155' } }}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
// Main Component
const VendorPage: React.FC = () => {
    const { project_id, vendor_id } = useParams<{ project_id: string, vendor_id: string }>();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [chat, setChat] = useState<[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const chatEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            console.log("VendorPage mounted with vendor_id:", vendor_id, );
            if (!vendor_id) return;
                setIsLoading(true);
            try {
                console.log("Fetching vendor details for ID:", vendor_id);
                const [vendorData] = await Promise.all([
                    vendorService.getVendorById(vendor_id)
                ]);
                setVendor(vendorData);
            } catch (error) {
                console.error("Error fetching vendor details:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [vendor_id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <CircularProgress size={48} sx={{ color: '#1e293b' }} />
                <Typography variant="body1" sx={{ mt: 3, color: '#64748b', fontWeight: 500 }}>
                    Loading vendor details...
                </Typography>
            </Box>
        );
    }

    if (!vendor) {
        return (
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="h5" sx={{ color: '#ef4444', fontWeight: 600, mb: 2 }}>
                    Vendor Not Found
                </Typography>
                <Button component={RouterLink} to={`/projects/${project_id}`} variant="outlined" sx={{ borderRadius: 2 }}>
                    Back to Project
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 3, borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                <Button 
                    component={RouterLink} 
                    to={`/projects/${project_id}`}
                    startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
                    sx={{ color: '#64748b', fontWeight: 500, '&:hover': { backgroundColor: '#f1f5f9' } }}
                >
                    Back to Project
                </Button>
                
                <IconButton 
                    onClick={() => setIsSettingsOpen(true)}
                    sx={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: 2, '&:hover': { backgroundColor: '#334155' } }}
                >
                    <SettingsIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>
            
            {/* Main Content */}
            <Box sx={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
                {/* Statistics Column - 70% */}
                <Box sx={{ 
                    flex: '0 0 68%', 
                    overflowY: 'auto', 
                    pr: 1,
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#f1f5f9', borderRadius: 3 },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 3, '&:hover': { backgroundColor: '#94a3b8' } },
                }}>
                    
                    {/* Hero Section */}
                    <Card elevation={0} sx={{ 
                        borderRadius: 4, 
                        border: '1px solid #e2e8f0',
                        mb: 3,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
                        position: 'relative'
                    }}>
                        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)' }} />
                        <Box sx={{ position: 'absolute', bottom: -30, left: '30%', width: 150, height: 150, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)' }} />
                        
                        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                            
                        </CardContent>
                    </Card>
                </Box>

                {/* Chat Column - 30% */}
                <Box sx={{ flex: '0 0 30%', position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100%' }}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
                        <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                                Forecaster
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Negotiation insights</Typography>
                        </Box>
                        
                        <Box sx={{ 
                            flexGrow: 1, 
                            overflowY: 'auto', 
                            p: 2, 
                            backgroundColor: '#f8fafc',
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 2 },
                        }}>
                            {chat.length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                                        Ask about this negotiation
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {['What\'s the pricing strategy?', 'Analyze deal risks', 'Show deal health overview'].map((suggestion, i) => (
                                            <Chip
                                                key={i}
                                                label={suggestion}
                                                variant="outlined"
                                                size="small"
                                                onClick={() => setNewMessage(suggestion)}
                                                sx={{ 
                                                    cursor: 'pointer', 
                                                    borderColor: '#e2e8f0', 
                                                    color: '#64748b',
                                                    backgroundColor: '#fff',
                                                    '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                            {isSendingMessage && (
                                <Box sx={{ p: 2, maxWidth: '90%', bgcolor: '#ffffff', borderRadius: '12px 12px 12px 4px', border: '1px solid #e2e8f0' }}>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94a3b8', animation: 'pulse 1s infinite' }} />
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94a3b8', animation: 'pulse 1s infinite 0.2s' }} />
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94a3b8', animation: 'pulse 1s infinite 0.4s' }} />
                                    </Box>
                                </Box>
                            )}
                            <div ref={chatEndRef} />
                        </Box>
                        
                        <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="Ask a question..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage}
                                    disabled={isSendingMessage}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { 
                                            borderRadius: 2, 
                                            backgroundColor: '#f8fafc', 
                                            fontSize: 13,
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#64748b'
                                            }
                                        } 
                                    }}
                                />
                                <IconButton
                                    disabled={isSendingMessage || !newMessage.trim()}
                                    sx={{ 
                                        backgroundColor: '#1e293b', 
                                        color: '#fff', 
                                        borderRadius: 2, 
                                        '&:hover': { backgroundColor: '#334155' },
                                        '&.Mui-disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8' }
                                    }}
                                >
                                    <Send sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Box>
                        </Box>
                    </Card>
                </Box>
            </Box>
            <VendorSettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} vendor_id={vendor_id || ''} />
        </Box>
    );
};

export default VendorPage;
