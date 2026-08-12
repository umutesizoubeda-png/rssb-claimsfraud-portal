import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { handleGoogleRedirect } from './lib/googleAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitClaim from './pages/SubmitClaim';
import Claims from './pages/Claims';
import ClaimDetail from './pages/ClaimDetail';
import FraudCenter from './pages/FraudCenter';
import Providers from './pages/Providers';
import Beneficiaries from './pages/Beneficiaries';
import AuditLog from './pages/AuditLog';
import Reports from './pages/Reports';
//import ExportCode from './pages/ExportCode';

handleGoogleRedirect();

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Shell><Dashboard /></Shell>} />
          <Route path="/submit" element={<Shell><SubmitClaim /></Shell>} />
          <Route path="/claims" element={<Shell><Claims /></Shell>} />
          <Route path="/claims/:id" element={<Shell><ClaimDetail /></Shell>} />
          <Route path="/fraud" element={<Shell><FraudCenter /></Shell>} />
          <Route path="/providers" element={<Shell><Providers /></Shell>} />
          <Route path="/beneficiaries" element={<Shell><Beneficiaries /></Shell>} />
          <Route path="/reports" element={<Shell><Reports /></Shell>} />
          <Route path="/audit" element={<Shell><AuditLog /></Shell>} />
          {/* <Route path="/export" element={<Shell><ExportCode /></Shell>} /> */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
