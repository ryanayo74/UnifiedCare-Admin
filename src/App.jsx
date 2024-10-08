import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Public Pages
import LandingPage from './public/LandingPage.jsx';
import AdminLoginPage from './public/AdminLoginPage.jsx';
import ContactUsPage from './public/ContactUsPage.jsx';
import ChangePasswordPage from './public/ChangePasswordPage.jsx';
import ForgotPasswordPage from './public/ForgotPasswordPage.jsx';

// Admin Developers Pages
import DevelopersFacilityListPage from './public/Developer/DevelopersFacilityListPage.jsx';
import DevelopersDashboardPage from './public/Developer/DevelopersDashboardPage.jsx';
import DevelopersApprovalPage from './public/Developer/DevelopersApprovalPage.jsx';
import DevelopersAnnouncementPage from './public/Developer/DevelopersAnnouncementPage.jsx';



// Admin Facility Pages

import AdminDashboardPage from './public/Facility/AdminDashboardPage.jsx';
import TherapistListPage from './public/Facility/TherapistListPage.jsx';
import AdminParentsListPage from './public/Facility/AdminParentsListPage.jsx';
import AdminFacilityAnnouncementPage from './public/Facility/AdminFacilityAnnouncementPage.jsx';
import FacilityApprovalPage from './public/Facility/FacilityApprovalPage.jsx';
import FacilityMessagePage from './public/Facility/FacilityMessagePage.jsx';


// Components
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/AdminLoginPage" element={<AdminLoginPage />} />
        <Route path="/ChangePasswordPage" element={<ChangePasswordPage />} />
        <Route path="/ForgotPasswordPage" element={<ForgotPasswordPage />} />
        <Route path="/ContactUsPage" element={<ContactUsPage />} />

        
        
        {/* Protected Routes */}


        {/* Admin Dev Routes */}
        <Route 
          path="/DevelopersDashboardPage" 
          element={
            <ProtectedRoute>
              <DevelopersDashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/DevelopersFacilityListPage" 
          element={
            <ProtectedRoute>
              <DevelopersFacilityListPage />
            </ProtectedRoute>
          } 
        />

         <Route 
          path="/DevelopersApprovalPage" 
          element={
            <ProtectedRoute>
              <DevelopersApprovalPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/DevelopersAnnouncementPage" 
          element={
            <ProtectedRoute>
              <DevelopersAnnouncementPage />
            </ProtectedRoute>
          } 
        />




        {/* Admin Facility Routes */}
        <Route 
          path="/FacilityMessagePage" 
          element={
            <ProtectedRoute>
              <FacilityMessagePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/AdminDashboardPage" 
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/TherapistListPage" 
          element={
            <ProtectedRoute>
              <TherapistListPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/AdminParentsListPage" 
          element={
            <ProtectedRoute>
              <AdminParentsListPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/AdminFacilityAnnouncementPage" 
          element={
            <ProtectedRoute>
              <AdminFacilityAnnouncementPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/FacilityApprovalPage" 
          element={
            <ProtectedRoute>
              <FacilityApprovalPage />
            </ProtectedRoute>
          } 
        />



      </Routes>
    </Router>
  );
}
