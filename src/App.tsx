import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import WelcomePage from './pages/WelcomePage';
import ProjectsPage from './pages/ProjectPage';
import SingleProjectPage from './pages/SingleProjectPage'; 
import VendorPage from './pages/VendorPage';
import VendorsPage from './pages/VendorsPage';
import UserRegistration from './pages/UserRegistration'; 
import { ProjectProvider, useProjects } from './context/ProjectContext'; 
import React from 'react';
import GmailPage from './pages/GmailPage';
import VendorComparisonPage from './pages/VendorComparisonPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const { userProfile, isProfileLoading } = useProjects();
  
  if (loading) return <div>Loading Authentication...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (isProfileLoading) return <div>Loading User Profile...</div>; 

  if (!userProfile && user) {
      return <Navigate to="/register" replace />;
  }

  return children;
};

const UnprotectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const [user, loading] = useAuthState(auth);

    if (loading) return <div>Loading Authentication...</div>;
    
    if (user) return <Navigate to="/" replace />;
    
    return children;
};


// Define the router with nested routes for the dashboard
const router = createBrowserRouter(
  createRoutesFromElements(
    // We wrap all protected routes in ProjectProvider so they can access profile data
    // Note: ProjectProvider is moved here to wrap the Routes that need it
    <Route element={<ProjectProvider><Outlet /></ProjectProvider>}>
      
      {/* UNPROTECTED ROUTES: Login and Register are only allowed when NOT logged in */}
      <Route 
        path="/login" 
        element={<UnprotectedRoute><Login /></UnprotectedRoute>} 
      />
      <Route 
        path="/register" 
        element={<UserRegistration />} 
      /> 
      
      {/* PROTECTED ROUTES: Only accessible when logged in and profile exists */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />        
        <Route path="dashboard" element={<WelcomePage />} />        
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:project_id" element={<SingleProjectPage />} /> 
        <Route path="projects/:project_id/vendors" element={<VendorsPage />} />
        <Route path="projects/:project_id/compare" element={<VendorComparisonPage />} /> 
        <Route path="projects/:project_id/vendors/:vendor_id" element={<VendorPage />} /> 
        <Route path="/gmail" element={<GmailPage />} />
      </Route>
  
      {/* Fallback route - redirect to the protected dashboard path */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;