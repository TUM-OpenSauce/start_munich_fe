import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { VendorService, type NegotiationMetadata, getCachedStatistics } from '../services/VendorService';
import { chatService, type Chat } from '../services/ChatService';
import { type Vendor } from '../services/ApiService';
import { 
    Box, Card, CardContent, Typography, CircularProgress, 
    TextField, Button, IconButton, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemIcon, ListItemText,
    LinearProgress, Chip, ToggleButtonGroup, ToggleButton, Modal, Backdrop, Tooltip, Badge, Collapse
} from '@mui/material';
import { 
    ArrowBack, Send, Business, Person, Email,
    CloudUpload, InsertDriveFile, Delete, Description,
    Psychology, TrendingUp, Security, Handshake, Timeline,
    AttachMoney, Gavel, Lightbulb, Analytics,
    OpenInFull, Close, Sync, ExpandMore, ExpandLess, AttachFile
} from '@mui/icons-material';
import SettingsIcon from '@mui/icons-material/Settings';

const vendorService = new VendorService();

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

// Uploaded File Type
interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedAt: Date;
}

// AI Agent Type
interface AIAgent {
    id: number;
    name: string;
    icon: React.ReactNode;
    progress: number;
    status: 'idle' | 'running' | 'complete';
}

// Agent configuration
const AGENT_CONFIG = [
    { name: 'Sentiment Analyzer', icon: <Psychology sx={{ fontSize: 16 }} /> },
    { name: 'Pricing Intelligence', icon: <AttachMoney sx={{ fontSize: 16 }} /> },
    { name: 'Timeline Tracker', icon: <Timeline sx={{ fontSize: 16 }} /> },
    { name: 'Risk Assessor', icon: <Security sx={{ fontSize: 16 }} /> },
    { name: 'Leverage Analyzer', icon: <TrendingUp sx={{ fontSize: 16 }} /> },
    { name: 'Compliance Scanner', icon: <Gavel sx={{ fontSize: 16 }} /> },
    { name: 'Relationship Mapper', icon: <Handshake sx={{ fontSize: 16 }} /> },
    { name: 'Strategy Engine', icon: <Lightbulb sx={{ fontSize: 16 }} /> },
    { name: 'Deal Health Monitor', icon: <Analytics sx={{ fontSize: 16 }} /> },
];

// Chat message type with mode indicator
interface ChatMessageType {
    role: 'user' | 'assistant';
    content: string;
    isAgentProgress?: boolean;
    mode: 'interact' | 'simulate';
}

// Main Component
const VendorPage: React.FC = () => {
    const { project_id, vendor_id } = useParams<{ project_id: string, vendor_id: string }>();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [unifiedChat, setUnifiedChat] = useState<ChatMessageType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [statistics, setStatistics] = useState<NegotiationMetadata | null>(null);
    const [agents, setAgents] = useState<AIAgent[]>([]);
    const [isAgentsRunning, setIsAgentsRunning] = useState(false);
    const [showStatistics, setShowStatistics] = useState(false);
    const [chatMode, setChatMode] = useState<'interact' | 'simulate'>('interact');
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [vendorChatData, setVendorChatData] = useState<Chat | null>(null);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isAgentsCollapsed, setIsAgentsCollapsed] = useState(false);
    const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
    const chatEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // System prompt delimiter for simulate mode
    const SYSTEM_PROMPT_DELIMITER = '--------SYSTEM_CONTEXT--------';

    // Helper to get AI goals from localStorage
    const getAiGoals = useCallback(() => {
        if (!vendor_id) return 'Optimize for cost reduction.';
        return localStorage.getItem(`vendor_${vendor_id}_ai_goals`) || 'Optimize for cost reduction.';
    }, [vendor_id]);

    // Helper to build the simulation system prompt
    const buildSimulationPrompt = useCallback((userMessage: string) => {
        const aiGoals = getAiGoals();
        const vendorName = vendor?.name || 'the vendor';
        const vendorCompany = vendor?.company || 'the company';
        
        return `${SYSTEM_PROMPT_DELIMITER}
SIMULATION CONTEXT - DO NOT INCLUDE THIS SECTION IN YOUR RESPONSE:
This is a negotiation simulation exercise. The user is practicing how to respond to a vendor.
You are simulating the role of ${vendorName} from ${vendorCompany}.

USER'S NEGOTIATION GOALS:
${aiGoals}

YOUR TASK:
1. First, analyze the user's message as if you were the vendor receiving it
2. Provide constructive feedback on:
   - How the message would be perceived by the vendor
   - Whether it effectively works toward the stated goals
   - Specific suggestions for improvement
   - Tone and professionalism assessment
   - Strategic effectiveness rating (1-10)
3. Then simulate how ${vendorName} would likely respond to this message

Format your response as:
📊 FEEDBACK:
[Your analysis and feedback here]

💬 SIMULATED VENDOR RESPONSE:
[How ${vendorName} would likely respond]

Remember: Help the user improve their negotiation skills while working toward their goals.
${SYSTEM_PROMPT_DELIMITER}

USER'S MESSAGE TO VENDOR:
${userMessage}`;
    }, [vendor, getAiGoals]);

    // Helper to strip system prompt from displayed content
    const stripSystemPrompt = (content: string): string => {
        if (content.includes(SYSTEM_PROMPT_DELIMITER)) {
            const parts = content.split(SYSTEM_PROMPT_DELIMITER);
            // Get the last part after the final delimiter
            return parts[parts.length - 1].replace(/^USER'S MESSAGE TO VENDOR:\s*/i, '').trim();
        }
        return content;
    };

    // Helper to render simple markdown (bold, italic)
    const renderMarkdown = (text: string): React.ReactNode => {
        // Split by bold (**text**) and italic (*text*) patterns
        const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                return <em key={index}>{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            console.log("VendorPage mounted with vendor_id:", vendor_id);
            if (!vendor_id) return;
            setIsLoading(true);
            try {
                console.log("Fetching vendor details for ID:", vendor_id);
                const vendorData = await vendorService.getVendorById(vendor_id);
                setVendor(vendorData);
                const savedFiles = localStorage.getItem(`vendor_${vendor_id}_files`);
                if (savedFiles) {
                    setUploadedFiles(JSON.parse(savedFiles));
                }
                // Load cached statistics from the service (which loads from localStorage on init)
                const cachedStats = getCachedStatistics(vendor_id);
                if (cachedStats) {
                    setStatistics(cachedStats);
                    setShowStatistics(true);
                    console.log(`Loaded cached statistics for vendor ${vendor_id}`);
                }
                
                // Initialize chat for simulate mode
                if (vendorData) {
                    setIsChatLoading(true);
                    try {
                        const chatData = await chatService.ensureVendorChat(vendor_id, vendorData.name);
                        if (chatData) {
                            setVendorChatData(chatData);
                            // Load existing messages into unified chat
                            if (chatData.messages && chatData.messages.length > 0) {
                                const existingMessages: ChatMessageType[] = chatData.messages.map(msg => ({
                                    role: msg.role,
                                    content: msg.content,
                                    mode: 'simulate' as const // Assume existing messages are simulate mode
                                }));
                                setUnifiedChat(existingMessages);
                            }
                            console.log('Chat initialized for vendor:', vendor_id);
                        }
                    } catch (chatError) {
                        console.error('Error initializing chat:', chatError);
                    } finally {
                        setIsChatLoading(false);
                    }
                }
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
    }, [unifiedChat]);

    // File upload handlers
    const handleFileUpload = useCallback((files: FileList | null) => {
        if (!files || !vendor_id) return;
        
        const newFiles: UploadedFile[] = Array.from(files).map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date()
        }));
        
        setUploadedFiles(prev => {
            const updated = [...prev, ...newFiles];
            localStorage.setItem(`vendor_${vendor_id}_files`, JSON.stringify(updated));
            return updated;
        });
    }, [vendor_id]);

    const handleDeleteFile = (fileId: string) => {
        if (!vendor_id) return;
        setUploadedFiles(prev => {
            const updated = prev.filter(f => f.id !== fileId);
            localStorage.setItem(`vendor_${vendor_id}_files`, JSON.stringify(updated));
            return updated;
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Start AI Agents
    const startAgents = useCallback(async () => {
        if (!vendor_id) return;
        
        setIsAgentsRunning(true);
        setShowStatistics(false);
        
        // Initialize agents
        const initialAgents: AIAgent[] = AGENT_CONFIG.map((config, index) => ({
            id: index,
            name: config.name,
            icon: config.icon,
            progress: 0,
            status: 'idle' as const
        }));
        setAgents(initialAgents);

        // Add agent progress message to chat (always interact mode since agents only run in interact mode)
        setUnifiedChat(prev => [...prev, { 
            role: 'assistant', 
            content: 'Starting 9 AI Agents to analyze vendor data...',
            isAgentProgress: true,
            mode: 'interact'
        }]);

        // Simulate agent progress with different speeds - 1 minute total load time
        // Each agent progresses at different rates to reach ~95% over 60 seconds
        const agentSpeeds = [0.12, 0.09, 0.15, 0.11, 0.08, 0.13, 0.10, 0.07, 0.14];
        const agentIntervals: ReturnType<typeof setInterval>[] = [];
        const startTime = Date.now();
        const totalDuration = 60000; // 1 minute in milliseconds

        for (let i = 0; i < 9; i++) {
            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const baseProgress = (elapsed / totalDuration) * 100;
                
                setAgents(prev => {
                    const updated = [...prev];
                    if (updated[i].progress < 100) {
                        // Each agent has slight variation in progress
                        const variation = (Math.random() - 0.5) * 2 * agentSpeeds[i];
                        const targetProgress = Math.min(baseProgress * (0.9 + i * 0.02) + variation, 95);
                        const currentProgress = updated[i].progress;
                        const increment = Math.max(0.1, (targetProgress - currentProgress) * 0.1);
                        
                        updated[i] = {
                            ...updated[i],
                            progress: Math.min(currentProgress + increment, 95),
                            status: 'running'
                        };
                    }
                    return updated;
                });
            }, 200 + i * 30);
            agentIntervals.push(interval);
        }

        // Fetch actual statistics
        try {
            // getStatistics now parses the data and caches it automatically
            const statsData = await vendorService.getStatistics(vendor_id);
            
            // Complete all agents to 100%
            agentIntervals.forEach(interval => clearInterval(interval));
            
            setAgents(prev => prev.map(agent => ({
                ...agent,
                progress: 100,
                status: 'complete' as const
            })));

            // Statistics are already cached by the service
            setStatistics(statsData);

            // Short delay then show statistics
            setTimeout(() => {
                setIsAgentsRunning(false);
                setShowStatistics(true);
                setUnifiedChat(prev => {
                    // Remove the agent progress message
                    const filtered = prev.filter(msg => !msg.isAgentProgress);
                    return [...filtered, {
                        role: 'assistant',
                        content: '✅ All 9 agents completed! Analysis loaded successfully.',
                        mode: 'interact' as const
                    }];
                });
            }, 800);

        } catch (error) {
            console.error("Error fetching statistics:", error);
            agentIntervals.forEach(interval => clearInterval(interval));
            setIsAgentsRunning(false);
            setUnifiedChat(prev => [...prev, {
                role: 'assistant',
                content: '❌ Error loading analysis. Please try again.',
                mode: 'interact' as const
            }]);
        }
    }, [vendor_id]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSendingMessage || isAgentsRunning) return;
        
        const userMessage = newMessage.trim();
        const userMessageLower = userMessage.toLowerCase();
        setNewMessage('');
        
        // Add user message to unified chat with current mode
        setUnifiedChat(prev => [...prev, { 
            role: 'user', 
            content: userMessage,
            mode: chatMode
        }]);
        
        // Check for trigger phrase - only in interact mode
        if (chatMode === 'interact' && (userMessageLower.includes('show me new infos') || userMessageLower.includes('show me new info') || userMessageLower.includes('analyze') || userMessageLower.includes('get insights'))) {
            startAgents();
            return;
        }
        
        setIsSendingMessage(true);
        
        if (chatMode === 'simulate') {
            // Use backend chat API for simulate mode with system prompt
            if (vendorChatData?.chatId) {
                try {
                    // Build the full message with simulation context
                    const fullMessage = buildSimulationPrompt(userMessage);
                    const response = await chatService.sendMessage(vendorChatData.chatId, fullMessage);
                    if (response) {
                        setUnifiedChat(prev => [...prev, { 
                            role: 'assistant', 
                            content: response.content,
                            mode: 'simulate'
                        }]);
                    } else {
                        // Fallback if API fails
                        setUnifiedChat(prev => [...prev, { 
                            role: 'assistant', 
                            content: 'Sorry, I couldn\'t process your message. Please try again.',
                            mode: 'simulate'
                        }]);
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                    setUnifiedChat(prev => [...prev, { 
                        role: 'assistant', 
                        content: 'An error occurred while processing your message. Please try again.',
                        mode: 'simulate'
                    }]);
                }
            } else {
                // If no chat exists, show error
                setUnifiedChat(prev => [...prev, { 
                    role: 'assistant', 
                    content: 'Chat is still initializing. Please wait a moment and try again.',
                    mode: 'simulate'
                }]);
            }
        } else {
            // Interact mode - use backend chat API for regular questions
            if (vendorChatData?.chatId) {
                try {
                    const response = await chatService.sendMessage(vendorChatData.chatId, userMessage);
                    if (response) {
                        setUnifiedChat(prev => [...prev, { 
                            role: 'assistant', 
                            content: response.content,
                            mode: 'interact'
                        }]);
                    } else {
                        setUnifiedChat(prev => [...prev, { 
                            role: 'assistant', 
                            content: `I can help you with negotiation insights. Click the refresh button to start a comprehensive analysis with 9 AI agents.`,
                            mode: 'interact'
                        }]);
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                    setUnifiedChat(prev => [...prev, { 
                        role: 'assistant', 
                        content: `I can help you with negotiation insights. Click the refresh button to start a comprehensive analysis with 9 AI agents.`,
                        mode: 'interact'
                    }]);
                }
            } else {
                // Fallback response
                setTimeout(() => {
                    setUnifiedChat(prev => [...prev, { 
                        role: 'assistant', 
                        content: `I can help you with negotiation insights. Click the refresh button to start a comprehensive analysis with 9 AI agents.`,
                        mode: 'interact'
                    }]);
                }, 500);
            }
        }
        
        setIsSendingMessage(false);
    };

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
                {/* Left Column - Vendor Info & Upload - 68% */}
                <Box sx={{ 
                    flex: '0 0 68%', 
                    overflowY: 'auto', 
                    pr: 1,
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#f1f5f9', borderRadius: 3 },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 3, '&:hover': { backgroundColor: '#94a3b8' } },
                }}>
                    
                    {/* Vendor Info Card */}
                    <Card elevation={0} sx={{ 
                        borderRadius: 3, 
                        border: '1px solid #e2e8f0',
                        mb: 3,
                        overflow: 'hidden'
                    }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                                <Box sx={{ 
                                    width: 72, 
                                    height: 72, 
                                    borderRadius: 2, 
                                    backgroundColor: '#f1f5f9', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <Business sx={{ fontSize: 32, color: '#64748b' }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                                        {vendor.name}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                                        {vendor.company}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3, borderColor: '#e2e8f0' }} />

                            <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}>
                                Contact Information
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ 
                                        width: 40, 
                                        height: 40, 
                                        borderRadius: 1.5, 
                                        backgroundColor: '#f8fafc', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <Person sx={{ fontSize: 20, color: '#64748b' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Contact Name</Typography>
                                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>{vendor.name}</Typography>
                                    </Box>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ 
                                        width: 40, 
                                        height: 40, 
                                        borderRadius: 1.5, 
                                        backgroundColor: '#f8fafc', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <Email sx={{ fontSize: 20, color: '#64748b' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Email Address</Typography>
                                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>{vendor.emailAddress}</Typography>
                                    </Box>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ 
                                        width: 40, 
                                        height: 40, 
                                        borderRadius: 1.5, 
                                        backgroundColor: '#f8fafc', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <Business sx={{ fontSize: 20, color: '#64748b' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Company</Typography>
                                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>{vendor.company}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Intelligence Report - Full Data Display */}
                    {showStatistics && statistics && (
                        <>
                            {/* Deal Health Overview Card */}
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Analytics sx={{ fontSize: 22, color: '#1e293b' }} />
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Deal Health Overview</Typography>
                                        </Box>
                                    </Box>
                                    
                                    {/* Key Metrics Grid */}
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2 }}>
                                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>{statistics.overallDealHealthScore ?? 0}%</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Health Score</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: (statistics.stalemateRiskProbability ?? 0) > 50 ? '#fef2f2' : '#f8fafc', borderRadius: 2 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: (statistics.stalemateRiskProbability ?? 0) > 50 ? '#ef4444' : '#1e293b' }}>{statistics.stalemateRiskProbability ?? 0}%</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Stalemate Risk</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981' }}>{statistics.remainingWiggleRoom ?? 0}%</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Wiggle Room</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#eff6ff', borderRadius: 2 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#3b82f6' }}>{statistics.buyerPowerIndex ?? 0}/10</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Buyer Power</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Deal Phase</Typography>
                                            <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 600 }}>{statistics.dealPhase ?? 'Discovery'}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>{statistics.offerSaturationLevel ?? 'Unknown saturation'}</Typography>
                                        </Box>
                                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Leverage</Typography>
                                            <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 600 }}>{statistics.leverageDistribution ?? 'Neutral'}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>{statistics.walkAwayReadiness ?? 'Walk-away status unknown'}</Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Executive Summary Card */}
                            {statistics.summary && statistics.summary !== 'No summary available' && (
                                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Description sx={{ fontSize: 20 }} /> Executive Summary
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                            {statistics.summary}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Recommended Strategy Card */}
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #10b981', mb: 2, overflow: 'hidden', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Lightbulb sx={{ fontSize: 22, color: '#059669' }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#059669' }}>Recommended Strategy</Typography>
                                        <Chip label={`${statistics.strategySuccessProbability ?? 0}% success`} size="small" sx={{ ml: 'auto', bgcolor: '#10b981', color: '#fff', fontWeight: 600 }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, mb: 1 }}>
                                        {statistics.recommendedStrategy ?? 'Analyzing...'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                                        Next Move: <strong>{statistics.suggestedNextMove ?? 'Continue negotiation'}</strong>
                                    </Typography>
                                    
                                    {/* Market Context */}
                                    {statistics.marketContextSummary && (
                                        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 2, mt: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 1 }}>Market Context</Typography>
                                            <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.6 }}>{statistics.marketContextSummary}</Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                            {/* All Strategies Card */}
                            {statistics.strategies && statistics.strategies.length > 0 && (
                                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Gavel sx={{ fontSize: 20 }} /> Strategy Options ({statistics.strategies.length})
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {statistics.strategies.map((strategy, idx) => (
                                                <Box key={idx} sx={{ p: 2.5, bgcolor: statistics.recommendedStrategy === strategy.strategyName ? '#f0fdf4' : '#f8fafc', borderRadius: 2, border: statistics.recommendedStrategy === strategy.strategyName ? '2px solid #10b981' : '1px solid #e2e8f0' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>{strategy.strategyName}</Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip label={strategy.toneToAdopt} size="small" sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 600, fontSize: 10 }} />
                                                            <Chip label={`${strategy.successProbability}%`} size="small" sx={{ bgcolor: strategy.successProbability >= 70 ? '#dcfce7' : strategy.successProbability >= 50 ? '#fef3c7' : '#fee2e2', color: strategy.successProbability >= 70 ? '#166534' : strategy.successProbability >= 50 ? '#92400e' : '#dc2626', fontWeight: 700 }} />
                                                        </Box>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 1.5, fontStyle: 'italic' }}>
                                                        {strategy.psychologicalMechanism}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>{strategy.whyThisWorks}</Typography>
                                                    {strategy.counterOfferAmount > 0 && (
                                                        <Chip label={`Counter Offer: ${strategy.counterOfferAmount}% discount`} size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600, mb: 1.5 }} />
                                                    )}
                                                    {strategy.recommendedBullets && strategy.recommendedBullets.length > 0 && (
                                                        <Box sx={{ mt: 1.5 }}>
                                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 1 }}>Key Points</Typography>
                                                            <Box component="ul" sx={{ m: 0, pl: 2.5, color: '#475569' }}>
                                                                {strategy.recommendedBullets.map((bullet, bidx) => (
                                                                    <Typography component="li" key={bidx} variant="caption" sx={{ mb: 0.5, lineHeight: 1.5 }}>{bullet}</Typography>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Requirements & Constraints Card */}
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Security sx={{ fontSize: 20 }} /> Requirements & Constraints
                                        <Chip label={`Legal: ${statistics.legalComplexityScore ?? 5}/10`} size="small" sx={{ ml: 'auto', bgcolor: (statistics.legalComplexityScore ?? 5) > 6 ? '#fef3c7' : '#f8fafc', color: (statistics.legalComplexityScore ?? 5) > 6 ? '#92400e' : '#64748b', fontWeight: 600 }} />
                                    </Typography>
                                    
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        {/* Must Have */}
                                        {statistics.mustHaveRequirements && statistics.mustHaveRequirements.length > 0 && (
                                            <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca' }}>
                                                <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                    Must Have ({statistics.mustHaveRequirements.length})
                                                </Typography>
                                                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                                    {statistics.mustHaveRequirements.map((req, idx) => (
                                                        <Typography key={idx} variant="caption" sx={{ color: '#7f1d1d', display: 'block', mb: 0.75, lineHeight: 1.4, pl: 1, borderLeft: '2px solid #ef4444' }}>
                                                            {req.replace('Real Constraint: ', '')}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                        
                                        {/* Nice to Have */}
                                        {statistics.niceToHaveRequirements && statistics.niceToHaveRequirements.length > 0 && (
                                            <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                                                <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                    Nice to Have ({statistics.niceToHaveRequirements.length})
                                                </Typography>
                                                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                                    {statistics.niceToHaveRequirements.map((req, idx) => (
                                                        <Typography key={idx} variant="caption" sx={{ color: '#166534', display: 'block', mb: 0.75, lineHeight: 1.4, pl: 1, borderLeft: '2px solid #22c55e' }}>
                                                            {req.replace('Artificial Constraint: ', '')}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Compliance & Legal */}
                                    {((statistics.complianceObligations && statistics.complianceObligations.length > 0) || (statistics.legalContractualBlockers && statistics.legalContractualBlockers.length > 0)) && (
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                                            {statistics.complianceObligations && statistics.complianceObligations.length > 0 && (
                                                <Box sx={{ p: 2, bgcolor: '#faf5ff', borderRadius: 2, border: '1px solid #e9d5ff' }}>
                                                    <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                        Compliance ({statistics.complianceObligations.length})
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {statistics.complianceObligations.map((comp, idx) => (
                                                            <Chip key={idx} label={comp} size="small" sx={{ bgcolor: '#ede9fe', color: '#6d28d9', fontSize: 9, height: 22 }} />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                            {statistics.legalContractualBlockers && statistics.legalContractualBlockers.length > 0 && (
                                                <Box sx={{ p: 2, bgcolor: '#fff7ed', borderRadius: 2, border: '1px solid #fed7aa' }}>
                                                    <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                        Legal Blockers ({statistics.legalContractualBlockers.length})
                                                    </Typography>
                                                    <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                                                        {statistics.legalContractualBlockers.slice(0, 5).map((blocker, idx) => (
                                                            <Typography key={idx} variant="caption" sx={{ color: '#9a3412', display: 'block', mb: 0.5, lineHeight: 1.4 }}>• {blocker}</Typography>
                                                        ))}
                                                        {statistics.legalContractualBlockers.length > 5 && (
                                                            <Typography variant="caption" sx={{ color: '#c2410c', fontStyle: 'italic' }}>+{statistics.legalContractualBlockers.length - 5} more...</Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Sentiment & Relationship Card */}
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Psychology sx={{ fontSize: 20 }} /> Sentiment & Relationship
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'center' }}>
                                            <Chip label={statistics.currentSentiment ?? 'Neutral'} sx={{ bgcolor: '#f3e8ff', color: '#7c3aed', fontWeight: 600, mb: 1 }} />
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Current Sentiment</Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>→ {statistics.sentimentTrajectory ?? 'Stable'}</Typography>
                                        </Box>
                                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'center' }}>
                                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#ec4899' }}>{statistics.relationshipWarmthScore ?? 0}/10</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Relationship Warmth</Typography>
                                        </Box>
                                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'center' }}>
                                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#f59e0b' }}>{statistics.sellerUrgencyScore ?? 0}/10</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Seller Urgency</Typography>
                                        </Box>
                                    </Box>
                                    {statistics.sellerPersonalityProfile && statistics.sellerPersonalityProfile !== 'Unknown' && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Seller Profile: </Typography>
                                            <Typography variant="caption" sx={{ color: '#1e293b' }}>{statistics.sellerPersonalityProfile}</Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Leverage Reasoning Card */}
                            {statistics.leverageReasoning && statistics.leverageReasoning !== 'No reasoning available' && (
                                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Handshake sx={{ fontSize: 20 }} /> Leverage Analysis
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                                            {statistics.leverageReasoning}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    {/* Hidden File Input for Attachments Modal */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileUpload(e.target.files)}
                        multiple
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    />
                </Box>

                {/* Chat Column - 30% */}
                <Box sx={{ flex: '0 0 30%', position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100%' }}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
                        <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isAgentsRunning ? '#f59e0b' : '#10b981' }} />
                                    Forecaster
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {/* Refresh/Sync Button */}
                                    <Tooltip title="Run AI Analysis">
                                        <IconButton 
                                            onClick={startAgents}
                                            size="small"
                                            disabled={isAgentsRunning}
                                            sx={{ 
                                                color: '#64748b', 
                                                '&:hover': { backgroundColor: '#f1f5f9', color: '#1e293b' },
                                                '&.Mui-disabled': { color: '#cbd5e1' }
                                            }}
                                        >
                                            <Sync sx={{ fontSize: 18, animation: isAgentsRunning ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
                                        </IconButton>
                                    </Tooltip>
                                    {/* Attachments Button */}
                                    <Tooltip title={`Attachments${uploadedFiles.length > 0 ? ` (${uploadedFiles.length})` : ''}`}>
                                        <IconButton 
                                            onClick={() => setIsAttachmentsModalOpen(true)}
                                            size="small"
                                            sx={{ 
                                                color: uploadedFiles.length > 0 ? '#1e293b' : '#64748b', 
                                                '&:hover': { backgroundColor: '#f1f5f9', color: '#1e293b' } 
                                            }}
                                        >
                                            <Badge badgeContent={uploadedFiles.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}>
                                                <AttachFile sx={{ fontSize: 18 }} />
                                            </Badge>
                                        </IconButton>
                                    </Tooltip>
                                    <IconButton 
                                        onClick={() => setIsChatExpanded(true)}
                                        size="small"
                                        sx={{ 
                                            color: '#64748b', 
                                            '&:hover': { backgroundColor: '#f1f5f9', color: '#1e293b' } 
                                        }}
                                    >
                                        <OpenInFull sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            </Box>
                            
                            {/* Mode Toggle */}
                            <ToggleButtonGroup
                                value={chatMode}
                                exclusive
                                onChange={(_, newMode) => newMode && setChatMode(newMode)}
                                size="small"
                                sx={{ 
                                    width: '100%',
                                    '& .MuiToggleButton-root': {
                                        flex: 1,
                                        py: 0.5,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        borderColor: '#e2e8f0',
                                        color: '#64748b',
                                        '&.Mui-selected': {
                                            backgroundColor: '#1e293b',
                                            color: '#fff',
                                            '&:hover': { backgroundColor: '#334155' }
                                        },
                                        '&:hover': { backgroundColor: '#f8fafc' }
                                    }
                                }}
                            >
                                <ToggleButton value="interact">Interact</ToggleButton>
                                <ToggleButton value="simulate">Simulate</ToggleButton>
                            </ToggleButtonGroup>
                            
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 1 }}>
                                {chatMode === 'interact' 
                                    ? (isAgentsRunning ? 'Analyzing...' : 'Chat with AI for insights')
                                    : (isChatLoading ? 'Initializing...' : 'Practice negotiation with AI vendor')
                                }
                            </Typography>
                        </Box>
                        
                        <Box sx={{ 
                            flexGrow: 1, 
                            overflowY: 'auto', 
                            p: 2, 
                            backgroundColor: '#f8fafc',
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 2 },
                        }}>
                            {/* Agent Progress Display - Compact, Pinned at Top */}
                            {(isAgentsRunning || agents.some(a => a.progress > 0)) && agents.length > 0 && (
                                <Box sx={{ mb: 2, backgroundColor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    <Box 
                                        onClick={() => setIsAgentsCollapsed(!isAgentsCollapsed)}
                                        sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between', 
                                            px: 1.5,
                                            py: 1,
                                            cursor: 'pointer',
                                            '&:hover': { backgroundColor: '#f8fafc' }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {isAgentsRunning && <CircularProgress size={12} sx={{ color: '#f59e0b' }} />}
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                {isAgentsRunning ? 'Analyzing' : '✓ Complete'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                                                {Math.round(agents.reduce((sum, a) => sum + a.progress, 0) / agents.length)}%
                                            </Typography>
                                        </Box>
                                        {isAgentsCollapsed ? <ExpandMore sx={{ fontSize: 16, color: '#94a3b8' }} /> : <ExpandLess sx={{ fontSize: 16, color: '#94a3b8' }} />}
                                    </Box>
                                    <Collapse in={!isAgentsCollapsed}>
                                        <Box sx={{ px: 1.5, pb: 1.5, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
                                            {agents.map((agent) => (
                                                <Tooltip key={agent.id} title={`${agent.name}: ${Math.round(agent.progress)}%`} arrow placement="top">
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: 0.5, 
                                                        p: 0.5,
                                                        borderRadius: 1,
                                                        backgroundColor: agent.status === 'complete' ? '#f0fdf4' : '#f8fafc',
                                                        border: '1px solid',
                                                        borderColor: agent.status === 'complete' ? '#bbf7d0' : '#e2e8f0'
                                                    }}>
                                                        <Box sx={{ color: agent.status === 'complete' ? '#10b981' : '#94a3b8', display: 'flex', '& svg': { fontSize: 12 } }}>
                                                            {agent.icon}
                                                        </Box>
                                                        <Box sx={{ flex: 1, height: 3, backgroundColor: '#e2e8f0', borderRadius: 1, overflow: 'hidden' }}>
                                                            <Box sx={{ 
                                                                height: '100%', 
                                                                width: `${agent.progress}%`, 
                                                                backgroundColor: agent.status === 'complete' ? '#10b981' : '#1e293b',
                                                                transition: 'width 0.3s ease'
                                                            }} />
                                                        </Box>
                                                    </Box>
                                                </Tooltip>
                                            ))}
                                        </Box>
                                    </Collapse>
                                </Box>
                            )}

                            {/* Chat Messages */}
                            {unifiedChat.length === 0 && !isAgentsRunning && !isChatLoading && (
                                <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                        {chatMode === 'interact' 
                                            ? <>Click <Sync sx={{ fontSize: 13, verticalAlign: 'middle', mx: 0.5 }} /> to analyze</>
                                            : <>Practice negotiation</>
                                        }
                                    </Typography>
                                </Box>
                            )}
                            {isChatLoading && (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <CircularProgress size={24} sx={{ color: '#64748b', mb: 1 }} />
                                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                        Initializing chat...
                                    </Typography>
                                </Box>
                            )}
                            {unifiedChat.filter(msg => !msg.isAgentProgress).map((msg, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        p: 2,
                                        mb: 1.5,
                                        maxWidth: '95%',
                                        ml: msg.role === 'user' ? 'auto' : 0,
                                        mr: msg.role === 'assistant' ? 'auto' : 0,
                                        bgcolor: msg.role === 'user' 
                                            ? (msg.mode === 'simulate' ? '#7c3aed' : '#1e293b')
                                            : (msg.mode === 'simulate' ? '#faf5ff' : '#ffffff'),
                                        color: msg.role === 'user' 
                                            ? '#fff' 
                                            : (msg.mode === 'simulate' ? '#5b21b6' : '#1e293b'),
                                        borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                        border: msg.role === 'assistant' 
                                            ? (msg.mode === 'simulate' ? '1px solid #e9d5ff' : '1px solid #e2e8f0')
                                            : 'none',
                                    }}
                                >
                                    {/* Mode indicator */}
                                    <Typography variant="caption" sx={{ 
                                        display: 'block', 
                                        mb: 0.5, 
                                        opacity: 0.7,
                                        fontWeight: 600,
                                        fontSize: 9,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        color: msg.role === 'user' ? 'inherit' : (msg.mode === 'simulate' ? '#7c3aed' : '#64748b')
                                    }}>
                                        {msg.mode === 'simulate' ? '🎯 Simulation' : '💬 Interact'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        {renderMarkdown(stripSystemPrompt(msg.content))}
                                    </Typography>
                                </Box>
                            ))}
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
                                    placeholder={chatMode === 'interact' ? "Ask a question..." : "Write a message to practice your negotiation..."}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && !isAgentsRunning && handleSendMessage()}
                                    disabled={isSendingMessage || isAgentsRunning}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { 
                                            borderRadius: 2, 
                                            backgroundColor: chatMode === 'simulate' ? '#faf5ff' : '#f8fafc', 
                                            fontSize: 13,
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: chatMode === 'simulate' ? '#7c3aed' : '#64748b'
                                            }
                                        } 
                                    }}
                                />
                                <IconButton
                                    onClick={handleSendMessage}
                                    disabled={isSendingMessage || isAgentsRunning || !newMessage.trim()}
                                    sx={{ 
                                        backgroundColor: chatMode === 'simulate' ? '#7c3aed' : '#1e293b', 
                                        color: '#fff', 
                                        borderRadius: 2, 
                                        '&:hover': { backgroundColor: chatMode === 'simulate' ? '#6d28d9' : '#334155' },
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
            
            {/* Attachments Modal */}
            <Modal
                open={isAttachmentsModalOpen}
                onClose={() => setIsAttachmentsModalOpen(false)}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        sx: { backgroundColor: 'rgba(15, 23, 42, 0.7)' }
                    }
                }}
            >
                <Box sx={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    maxWidth: 500,
                    maxHeight: '70vh',
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Modal Header */}
                    <Box sx={{ 
                        p: 2.5, 
                        borderBottom: '1px solid #e2e8f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between' 
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Description sx={{ fontSize: 22, color: '#64748b' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                Documents & Files
                            </Typography>
                        </Box>
                        <IconButton 
                            onClick={() => setIsAttachmentsModalOpen(false)}
                            sx={{ color: '#64748b', '&:hover': { backgroundColor: '#f1f5f9' } }}
                        >
                            <Close sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>
                    
                    {/* Modal Content */}
                    <Box sx={{ p: 3, overflowY: 'auto' }}>
                        {/* Upload Zone */}
                        <Box
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                border: isDragOver ? '2px dashed #1e293b' : '2px dashed #e2e8f0',
                                borderRadius: 2,
                                p: 3,
                                textAlign: 'center',
                                cursor: 'pointer',
                                backgroundColor: isDragOver ? '#f1f5f9' : '#fafafa',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: '#94a3b8',
                                    backgroundColor: '#f8fafc'
                                }
                            }}
                        >
                            <CloudUpload sx={{ fontSize: 40, color: '#94a3b8', mb: 1.5 }} />
                            <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500, mb: 0.5 }}>
                                Drop files here or click to upload
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                PDF, DOC, XLS, and other documents
                            </Typography>
                        </Box>

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}>
                                    Uploaded Files ({uploadedFiles.length})
                                </Typography>
                                <List sx={{ p: 0 }}>
                                    {uploadedFiles.map((file) => (
                                        <ListItem
                                            key={file.id}
                                            sx={{
                                                px: 2,
                                                py: 1.5,
                                                borderRadius: 2,
                                                border: '1px solid #e2e8f0',
                                                mb: 1,
                                                '&:hover': { backgroundColor: '#f8fafc' }
                                            }}
                                            secondaryAction={
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleDeleteFile(file.id)}
                                                    sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}
                                                >
                                                    <Delete sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                <InsertDriveFile sx={{ color: '#64748b' }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={file.name}
                                                secondary={formatFileSize(file.size)}
                                                primaryTypographyProps={{ 
                                                    sx: { fontWeight: 500, color: '#1e293b', fontSize: 14 } 
                                                }}
                                                secondaryTypographyProps={{ 
                                                    sx: { color: '#94a3b8', fontSize: 12 } 
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {uploadedFiles.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                                <Typography variant="body2">No files uploaded yet</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Modal>
            
            {/* Expanded Chat Modal */}
            <Modal
                open={isChatExpanded}
                onClose={() => setIsChatExpanded(false)}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        sx: { backgroundColor: 'rgba(15, 23, 42, 0.8)' }
                    }
                }}
            >
                <Box sx={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    maxWidth: 800,
                    height: '85vh',
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Modal Header */}
                    <Box sx={{ 
                        p: 3, 
                        borderBottom: '1px solid #e2e8f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between' 
                    }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: isAgentsRunning ? '#f59e0b' : '#10b981' }} />
                                Forecaster
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                                {vendor?.name} • {chatMode === 'interact' ? 'Interactive Mode' : 'Practice Mode'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ToggleButtonGroup
                                value={chatMode}
                                exclusive
                                onChange={(_, newMode) => newMode && setChatMode(newMode)}
                                size="small"
                                sx={{ 
                                    '& .MuiToggleButton-root': {
                                        px: 2,
                                        py: 0.5,
                                        fontSize: 13,
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        borderColor: '#e2e8f0',
                                        color: '#64748b',
                                        '&.Mui-selected': {
                                            backgroundColor: '#1e293b',
                                            color: '#fff',
                                            '&:hover': { backgroundColor: '#334155' }
                                        },
                                        '&:hover': { backgroundColor: '#f8fafc' }
                                    }
                                }}
                            >
                                <ToggleButton value="interact">Interact</ToggleButton>
                                <ToggleButton value="simulate">Simulate</ToggleButton>
                            </ToggleButtonGroup>
                            <IconButton 
                                onClick={() => setIsChatExpanded(false)}
                                sx={{ color: '#64748b', '&:hover': { backgroundColor: '#f1f5f9' } }}
                            >
                                <Close />
                            </IconButton>
                        </Box>
                    </Box>
                    
                    {/* Modal Chat Content */}
                    <Box sx={{ 
                        flexGrow: 1, 
                        overflowY: 'auto', 
                        p: 3, 
                        backgroundColor: '#f8fafc',
                        '&::-webkit-scrollbar': { width: 6 },
                        '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 3 },
                    }}>
                        {/* Agent Progress Display */}
                        {isAgentsRunning && agents.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 2, display: 'block' }}>
                                    AI AGENTS RUNNING
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                    {agents.map((agent) => (
                                        <Box key={agent.id} sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Box sx={{ color: agent.status === 'complete' ? '#10b981' : '#64748b' }}>
                                                    {agent.icon}
                                                </Box>
                                                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500, flex: 1 }}>
                                                    {agent.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: agent.status === 'complete' ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                                                    {Math.round(agent.progress)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={agent.progress} 
                                                sx={{ 
                                                    height: 4, 
                                                    borderRadius: 2,
                                                    backgroundColor: '#e2e8f0',
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: agent.status === 'complete' ? '#10b981' : '#1e293b',
                                                        borderRadius: 2
                                                    }
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Chat Messages */}
                        {unifiedChat.length === 0 && !isAgentsRunning && !isChatLoading && (
                            <Box sx={{ textAlign: 'center', py: 6, px: 4 }}>
                                <Typography variant="body1" sx={{ color: '#94a3b8', mb: 1 }}>
                                    {chatMode === 'interact' 
                                        ? <>Click the refresh button to start AI analysis, or ask any question.</>
                                        : <>Practice your negotiation responses. The AI will simulate the vendor and give feedback.</>
                                    }
                                </Typography>
                            </Box>
                        )}
                        {isChatLoading && (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <CircularProgress size={32} sx={{ color: '#64748b', mb: 2 }} />
                                <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                                    Initializing chat session...
                                </Typography>
                            </Box>
                        )}
                        {unifiedChat.filter(msg => !msg.isAgentProgress).map((msg, index) => (
                            <Box
                                key={index}
                                sx={{
                                    p: 2.5,
                                    mb: 2,
                                    maxWidth: '80%',
                                    ml: msg.role === 'user' ? 'auto' : 0,
                                    mr: msg.role === 'assistant' ? 'auto' : 0,
                                    bgcolor: msg.role === 'user' 
                                        ? (msg.mode === 'simulate' ? '#7c3aed' : '#1e293b')
                                        : (msg.mode === 'simulate' ? '#faf5ff' : '#ffffff'),
                                    color: msg.role === 'user' 
                                        ? '#fff' 
                                        : (msg.mode === 'simulate' ? '#5b21b6' : '#1e293b'),
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    border: msg.role === 'assistant' 
                                        ? (msg.mode === 'simulate' ? '1px solid #e9d5ff' : '1px solid #e2e8f0')
                                        : 'none',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                {/* Mode indicator */}
                                <Typography variant="caption" sx={{ 
                                    display: 'block', 
                                    mb: 0.5, 
                                    opacity: 0.7,
                                    fontWeight: 600,
                                    fontSize: 10,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    color: msg.role === 'user' ? 'inherit' : (msg.mode === 'simulate' ? '#7c3aed' : '#64748b')
                                }}>
                                    {msg.mode === 'simulate' ? '🎯 Simulation' : '💬 Interact'}
                                </Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                                    {renderMarkdown(stripSystemPrompt(msg.content))}
                                </Typography>
                            </Box>
                        ))}
                        {isSendingMessage && (
                            <Box sx={{ p: 2.5, maxWidth: '80%', bgcolor: '#ffffff', borderRadius: '16px 16px 16px 4px', border: '1px solid #e2e8f0' }}>
                                <Box sx={{ display: 'flex', gap: 0.75 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#94a3b8', animation: 'pulse 1s infinite' }} />
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#94a3b8', animation: 'pulse 1s infinite 0.2s' }} />
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#94a3b8', animation: 'pulse 1s infinite 0.4s' }} />
                                </Box>
                            </Box>
                        )}
                    </Box>
                    
                    {/* Modal Input */}
                    <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="medium"
                                placeholder={chatMode === 'interact' ? "Ask a question..." : "Write a message to practice your negotiation..."}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && !isAgentsRunning && handleSendMessage()}
                                disabled={isSendingMessage || isAgentsRunning}
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        borderRadius: 2, 
                                        backgroundColor: chatMode === 'simulate' ? '#faf5ff' : '#f8fafc', 
                                        fontSize: 14,
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: chatMode === 'simulate' ? '#7c3aed' : '#64748b'
                                        }
                                    } 
                                }}
                            />
                            <IconButton
                                onClick={handleSendMessage}
                                disabled={isSendingMessage || isAgentsRunning || !newMessage.trim()}
                                sx={{ 
                                    backgroundColor: chatMode === 'simulate' ? '#7c3aed' : '#1e293b', 
                                    color: '#fff', 
                                    borderRadius: 2,
                                    px: 2.5,
                                    '&:hover': { backgroundColor: chatMode === 'simulate' ? '#6d28d9' : '#334155' },
                                    '&.Mui-disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8' }
                                }}
                            >
                                <Send />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default VendorPage;
