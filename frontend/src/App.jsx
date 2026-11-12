import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout, AuthLayout } from './components/layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ReportForm from './pages/ReportForm';
import BrowseItems from './pages/BrowseItems';
import ItemDetails from './pages/ItemDetails';
import MyReports from './pages/MyReports';
import MyClaims from './pages/MyClaims';
import ClaimDetails from './pages/ClaimDetails';
import ClaimReview from './pages/ClaimReview';
import Notifications from './pages/Notifications';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/report-lost" element={<ReportForm type="lost" />} />
              <Route path="/report-found" element={<ReportForm type="found" />} />
              <Route path="/reports/:reportId/edit" element={<ReportForm />} />
              <Route path="/my-reports" element={<MyReports />} />
              <Route path="/my-claims" element={<MyClaims />} />
              <Route path="/claims/:claimId" element={<ClaimDetails />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route element={<ProtectedRoute roles={['moderator', 'admin']} />}>
                <Route path="/claim-review" element={<ClaimReview />} />
                <Route path="/admin/reports" element={<AdminReports />} />
              </Route>
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
              </Route>
            </Route>
          </Route>
          <Route path="/browse" element={<BrowseItems />} />
          <Route path="/items/:itemId" element={<ItemDetails />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

