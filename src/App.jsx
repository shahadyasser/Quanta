import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from './pages/Home';
import RecruiterAuth from './pages/RecruiterAuth';
import RecruiterDashboard from './pages/RecruiterDashboard';
import PostJob from './pages/PostJob';
import ViewCandidates from './pages/ViewCandidates';
import CandidateProfile from './pages/CandidateProfile';
import CandidateAuth from './pages/CandidateAuth';
import CandidateDashboard from './pages/CandidateDashboard';
import CVUpload from './pages/CVUpload';
import Assessment from './pages/Assessment';
import FeedbackReport from './pages/FeedbackReport';
import AdminAuth from './pages/AdminAuth';
import AdminDashboard from './pages/AdminDashboard';
import RecruiterManagement from './pages/RecruiterManagement';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/recruiter-auth" element={<RecruiterAuth />} />
      <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
      <Route path="/post-job" element={<PostJob />} />
      <Route path="/view-candidates" element={<ViewCandidates />} />
      <Route path="/candidate-profile" element={<CandidateProfile />} />
      <Route path="/candidate-auth" element={<CandidateAuth />} />
      <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
      <Route path="/cv-upload" element={<CVUpload />} />
      <Route path="/assessment" element={<Assessment />} />
      <Route path="/feedback-report" element={<FeedbackReport />} />
      <Route path="/admin-auth" element={<AdminAuth />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/recruiter-management" element={<RecruiterManagement />} />
      {/* Add your page Route elements here */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App