import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuditRequestPage } from '@/pages/audit/AuditRequestPage'
import { BoitierPage } from '@/pages/boitier/BoitierPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { HowItWorksPage } from '@/pages/landing/HowItWorksPage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { BoitierDetailPage } from '@/pages/app/BoitierDetailPage'
import { BoitiersPage } from '@/pages/app/BoitiersPage'
import { AdvicePage } from '@/pages/app/AdvicePage'
import { AuditPage } from '@/pages/app/AuditPage'
import { PlanActionPage } from '@/pages/app/PlanActionPage'
import { AlertsPage } from '@/pages/app/AlertsPage'
import { ConsumptionPage } from '@/pages/app/ConsumptionPage'
import { EquipmentPage } from '@/pages/app/EquipmentPage'
import { InvoicesPage } from '@/pages/app/InvoicesPage'
import { JournalPage } from '@/pages/app/JournalPage'
import { MachinesPage } from '@/pages/app/MachinesPage'
import { OverviewPage } from '@/pages/app/OverviewPage'
import { PredictionPage } from '@/pages/app/PredictionPage'
import { RecommendationsPage } from '@/pages/app/RecommendationsPage'
import { ReportsPage } from '@/pages/app/ReportsPage'
import { SettingsPage } from '@/pages/app/SettingsPage'
import { AdminBoitierDetailPage } from '@/pages/app/admin/AdminBoitierDetailPage'
import { AdminBoitiersPage } from '@/pages/app/admin/AdminBoitiersPage'
import { AdminHealthPage } from '@/pages/app/admin/AdminHealthPage'
import { AdminLeadsPage } from '@/pages/app/admin/AdminLeadsPage'
import { AdminModelsPage } from '@/pages/app/admin/AdminModelsPage'
import { AdminUserDetailPage } from '@/pages/app/admin/AdminUserDetailPage'
import { AdminUsersPage } from '@/pages/app/admin/AdminUsersPage'
import { AppIndexRedirect } from '@/routes/AppIndexRedirect'
import { ProfileGuard } from '@/routes/ProfileGuard'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'comment-ca-marche', element: <HowItWorksPage /> },
      { path: 'le-boitier', element: <BoitierPage /> },
      { path: 'demander-un-audit', element: <AuditRequestPage /> },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            element: <ProfileGuard />,
            children: [
              { index: true, element: <AppIndexRedirect /> },
              { path: 'apercu', element: <OverviewPage /> },
              { path: 'alertes', element: <AlertsPage /> },
              { path: 'consommation', element: <ConsumptionPage /> },
              { path: 'prediction', element: <PredictionPage /> },
              { path: 'factures', element: <InvoicesPage /> },
              { path: 'conseils', element: <AdvicePage /> },
              { path: 'recommandations', element: <RecommendationsPage /> },
              { path: 'equipements', element: <EquipmentPage /> },
              { path: 'machines', element: <MachinesPage /> },
              { path: 'rapports', element: <ReportsPage /> },
              { path: 'journal', element: <JournalPage /> },
              { path: 'audit', element: <AuditPage /> },
              { path: 'plan-action', element: <PlanActionPage /> },
              { path: 'boitier', element: <BoitiersPage /> },
              { path: 'boitier/:deviceId', element: <BoitierDetailPage /> },
              { path: 'parametres', element: <SettingsPage /> },
              { path: 'admin/boitiers', element: <AdminBoitiersPage /> },
              { path: 'admin/boitiers/:deviceId', element: <AdminBoitierDetailPage /> },
              { path: 'admin/sante', element: <AdminHealthPage /> },
              { path: 'admin/modeles', element: <AdminModelsPage /> },
              { path: 'admin/utilisateurs', element: <AdminUsersPage /> },
              { path: 'admin/utilisateurs/:userId', element: <AdminUserDetailPage /> },
              { path: 'admin/leads', element: <AdminLeadsPage /> },
              { path: '*', element: <Navigate to="/app" replace /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
