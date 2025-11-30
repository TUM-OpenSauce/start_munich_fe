import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ProjectService } from '../services/ProjectService';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { UserService } from '../services/UserService';
import type { UserProfile } from '../services/UserService';
// NEW IMPORTS
import { VendorService } from '../services/VendorService';
import type { Project, Vendor } from '../services/ApiService';
import { Place } from '@mui/icons-material';


interface ProjectContextType {
  projects: Project[];
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description: string) => Promise<Project | null>;
  googleAccessToken: string | null;
  setGoogleAccessToken: (accessToken: string) => void;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  fetchUserProfile: (EMail: string) => Promise<void>;
  
  // NEW: Vendor related state and functions
  currentProjectVendors: Vendor[];
  isVendorLoading: boolean;
  fetchVendorsForProject: (projectId: string) => Promise<void>;
  updateProjectVendor: (vendor: Vendor) => Promise<void>;
  createVendor: (
    projectId: string,
    name: string,
    emailAddress: string,
    company: string,
  ) => Promise<Vendor | null>;
}

// Dummy initial context value
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Project Context Provider Component
export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // NEW: Vendor state
  const [currentProjectVendors, setCurrentProjectVendors] = useState<Vendor[]>([]);
  const [isVendorLoading, setIsVendorLoading] = useState(false);

  const [user, loadingUser] = useAuthState(auth);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Initialize services
  const projectService = new ProjectService();
  const userService = new UserService();
  const vendorService = new VendorService(); // NEW

  const fetchProjects = useCallback(async () => {
    if (!user) return; 

    setIsLoading(true);
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]); 
      setGoogleAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Function to create a new project
  const createProject = useCallback(async (name: string, description: string): Promise<Project | null> => {
    if (!user) return null;
    
    try {
      const newProject = await projectService.createProject({
        name,
        description,
        ownerId: '0280eff5-8952-4287-8022-6fd1c99d4538', // Placeholder ownerId
      });
      
      // Add the new project to the local state
      setProjects(prev => [...prev, newProject]);
      console.log('[ProjectContext] Created new project:', newProject);
      
      return newProject;
    } catch (error) {
      console.error("Error creating project:", error);
      return null;
    }
  }, [user]);

  // Function to fetch user profile
  const fetchUserProfile = useCallback(async (EMail: string) => {
    if (!user) return;
    
    setIsProfileLoading(true);
    try {
      const profile = await userService.getUserProfileByEmail(EMail);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, [user]);

  
  // --- NEW VENDOR FUNCTIONS ---

  const fetchVendorsForProject = useCallback(async (projectId: string) => {
    setIsVendorLoading(true);
    try {
      const data = await vendorService.getVendorsByProjectId(projectId);
      setCurrentProjectVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setCurrentProjectVendors([]);
    } finally {
      setIsVendorLoading(false);
    }
  }, []); // vendorService is stable

  const addProjectVendor = useCallback(async (vendorData: Omit<Vendor, 'id'>) => {
    try {
      const newVendor = await vendorService.addVendor(vendorData);
      setCurrentProjectVendors(prev => [...prev, newVendor]);
    } catch (error) {
      console.error("Error adding vendor:", error);
    }
  }, []);

  const updateProjectVendor = useCallback(async (vendor: Vendor) => {
    try {
      const updatedVendor = await vendorService.updateVendor(vendor);
      setCurrentProjectVendors(prev => 
        prev.map(v => v.vendor_id === updatedVendor.vendor_id ? updatedVendor : v)
      );
    } catch (error) {
      console.error("Error updating vendor:", error);
    }
  }, []);

  // Function to create a new vendor for a project
  const createVendor = useCallback(async (
    projectId: string,
    name: string,
    emailAddress: string,
    company: string,
  ): Promise<Vendor | null> => {
    try {
      const newVendor = await vendorService.addVendor({
        project_id: projectId,
        name: name,
        emailAddress: emailAddress,
        company: company,
      });
      
      // Add to current vendors if we're viewing the same project
      setCurrentProjectVendors(prev => [...prev, newVendor]);
      console.log('[ProjectContext] Created new vendor:', newVendor);
      
      return newVendor;
    } catch (error) {
      console.error("Error creating vendor:", error);
      return null;
    }
  }, []);

  // --- END VENDOR FUNCTIONS ---


  // 1. Fetch user profile when the user object is ready and authenticated
  useEffect(() => {
    if (user && !loadingUser) {
      fetchUserProfile(user.email || '');
    } else if (!loadingUser) {
        setIsProfileLoading(false);
        setUserProfile(null);
    }
  }, [user, loadingUser, fetchUserProfile]);

  // 2. Fetch projects when the user object is ready and authenticated
  useEffect(() => {
    if (user && !loadingUser && !isProfileLoading) {
      fetchProjects();
    } else if (!loadingUser) {
      setIsLoading(false);
      setProjects([]);
    }
  }, [user, loadingUser, fetchProjects, isProfileLoading]);


  return (
    <ProjectContext.Provider 
      value={{ 
        projects, 
        isLoading, 
        fetchProjects,
        createProject,
        googleAccessToken,
        setGoogleAccessToken, 
        userProfile,
        isProfileLoading,
        fetchUserProfile,

        // NEW VENDOR VALUES
        currentProjectVendors,
        isVendorLoading,
        fetchVendorsForProject,
        updateProjectVendor,
        createVendor,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook to use the Project Context
export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};