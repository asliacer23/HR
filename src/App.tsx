import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardLayout } from "@/features/layout/components/DashboardLayout";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { UsersPage } from "@/features/admin/pages/UsersPage";
import { RolesPage } from "@/features/admin/pages/RolesPage";
import { DepartmentsPage } from "@/features/admin/pages/DepartmentsPage";
import { PositionsPage } from "@/features/admin/pages/PositionsPage";
import { JobPostingsPage } from "@/features/recruitment/pages/JobPostingsPage";
import { ApplicantsPage } from "@/features/recruitment/pages/ApplicantsPage";
import { InterviewsPage } from "@/features/recruitment/pages/InterviewsPage";
import { EmployeesPage } from "@/features/employees/pages/EmployeesPage";
import { ContractsPage } from "@/features/employees/pages/ContractsPage";
import { EmployeeDocumentsPage } from "@/features/employees/pages/EmployeeDocumentsPage";
import { OnboardingPage } from "@/features/hr/pages/OnboardingPage";
import { EmployeeOnboardingPage } from "@/features/hr/pages/EmployeeOnboardingPage";
import { TrainingPage } from "@/features/hr/pages/TrainingPage";
import { EmployeeTrainingPage } from "@/features/hr/pages/EmployeeTrainingPage";
import { PerformancePage } from "@/features/hr/pages/PerformancePage";
import { PayrollPage } from "@/features/payroll/pages/PayrollPage";
import { BenefitsPage } from "@/features/payroll/pages/BenefitsPage";
import { EmployeeBenefitsPage } from "@/features/payroll/pages/EmployeeBenefitsPage";
import { PayrollRecordsPage } from "@/features/payroll/pages/PayrollRecordsPage";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { AuditLogsPage } from "@/features/admin/pages/AuditLogsPage";
import { RegistrarInstructorTestPage } from "@/features/integration/pages/RegistrarInstructorTestPage";
import { MyProfilePage } from "@/features/employee-self/pages/MyProfilePage";
import { MyPayrollPage } from "@/features/employee-self/pages/MyPayrollPage";
import { MyPayrollRecordsPage } from "@/features/employee-self/pages/MyPayrollRecordsPage";
import { MyPerformancePage } from "@/features/employee-self/pages/MyPerformancePage";
import { MyTrainingPage } from "@/features/employee-self/pages/MyTrainingPage";
import { MyDocumentsPage } from "@/features/employee-self/pages/MyDocumentsPage";
import { MyOnboardingPage } from "@/features/employee-self/pages/MyOnboardingPage";
import { MyBenefitsPage } from "@/features/employee-self/pages/MyBenefitsPage";
import { ApplicantDashboardPage } from "@/features/applicant/pages/ApplicantDashboardPage";
import { JobsPage } from "@/features/applicant/pages/JobsPage";
import { MyApplicationsPage } from "@/features/applicant/pages/MyApplicationsPage";
import { ApplicantProfilePage } from "@/features/applicant/pages/ApplicantProfilePage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
            <Route path="/reset-password" element={<Navigate to="/login" replace />} />

            {/* Protected Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/roles" element={<RolesPage />} />
              <Route path="/admin/departments" element={<DepartmentsPage />} />
              <Route path="/admin/positions" element={<PositionsPage />} />
              <Route path="/admin/audit-logs" element={<AuditLogsPage />} />

              {/* Recruitment Routes */}
              <Route path="/recruitment/jobs" element={<JobPostingsPage />} />
              <Route path="/recruitment/applicants" element={<ApplicantsPage />} />
              <Route path="/recruitment/interviews" element={<InterviewsPage />} />

              {/* Employee Management Routes */}
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/contracts" element={<ContractsPage />} />
              <Route path="/employees/documents" element={<EmployeeDocumentsPage />} />

              {/* HR Operations Routes */}
              <Route path="/hr/onboarding" element={<OnboardingPage />} />
              <Route path="/hr/employee-onboarding" element={<EmployeeOnboardingPage />} />
              <Route path="/hr/training" element={<TrainingPage />} />
              <Route path="/hr/employee-training" element={<EmployeeTrainingPage />} />
              <Route path="/hr/performance" element={<PerformancePage />} />
              <Route path="/hr/registrar-instructor-test" element={<RegistrarInstructorTestPage />} />

              {/* Payroll Routes */}
              <Route path="/payroll" element={<PayrollPage />} />
              <Route path="/payroll/records" element={<PayrollRecordsPage />} />
              <Route path="/payroll/benefits" element={<BenefitsPage />} />
              <Route path="/payroll/employee-benefits" element={<EmployeeBenefitsPage />} />

              {/* Reports */}
              <Route path="/reports" element={<ReportsPage />} />

              {/* Employee Self-Service Routes */}
              <Route path="/my-profile" element={<MyProfilePage />} />
              <Route path="/my-payroll" element={<MyPayrollPage />} />
              <Route path="/my-payroll-records" element={<MyPayrollRecordsPage />} />
              <Route path="/my-performance" element={<MyPerformancePage />} />
              <Route path="/my-training" element={<MyTrainingPage />} />
              <Route path="/my-onboarding" element={<MyOnboardingPage />} />
              <Route path="/my-contract" element={<ContractsPage />} />
              <Route path="/my-documents" element={<MyDocumentsPage />} />
              <Route path="/my-benefits" element={<MyBenefitsPage />} />

              {/* Applicant Routes */}
              <Route path="/applicant/dashboard" element={<ApplicantDashboardPage />} />
              <Route path="/applicant/jobs" element={<JobsPage />} />
              <Route path="/applicant/applications" element={<MyApplicationsPage />} />
              <Route path="/applicant/profile" element={<ApplicantProfilePage />} />
              
              {/* Legacy routes for backward compatibility */}
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/my-applications" element={<MyApplicationsPage />} />
              <Route path="/applicant-profile" element={<ApplicantProfilePage />} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
