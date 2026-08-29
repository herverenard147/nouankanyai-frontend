import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuditRequestPage } from '@/pages/audit/AuditRequestPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { TermsPage } from '@/pages/legal/TermsPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { ContactPage } from '@/pages/legal/ContactPage'
import { FaqPage } from '@/pages/legal/FaqPage'
import { HowItWorksPage } from '@/pages/landing/HowItWorksPage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { AdvicePage } from '@/pages/app/AdvicePage'
import { AlertsPage } from '@/pages/app/AlertsPage'
import { AnomaliesPage } from '@/pages/app/AnomaliesPage'
import { ConsumptionPage } from '@/pages/app/ConsumptionPage'
import { EquipmentPage } from '@/pages/app/EquipmentPage'
import { InvoicesPage } from '@/pages/app/InvoicesPage'
import { JournalPage } from '@/pages/app/JournalPage'
import { MachinesPage } from '@/pages/app/MachinesPage'
import { OverviewPage } from '@/pages/app/OverviewPage'
import { PredictionPage } from '@/pages/app/PredictionPage'
import { ReportsPage } from '@/pages/app/ReportsPage'
import { SettingsPage } from '@/pages/app/SettingsPage'
import { AdminHealthPage } from '@/pages/app/admin/AdminHealthPage'
import { AdminLeadsPage } from '@/pages/app/admin/AdminLeadsPage'
import { AdminModelsPage } from '@/pages/app/admin/AdminModelsPage'
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
      { path: 'demander-un-audit', element: <AuditRequestPage /> },
      { path: 'legal/cgu', element: <TermsPage /> },
      { path: 'legal/confidentialite', element: <PrivacyPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'faq', element: <FaqPage /> },
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
              { path: 'equipements', element: <EquipmentPage /> },
              { path: 'machines', element: <MachinesPage /> },
              { path: 'anomalies', element: <AnomaliesPage /> },
              { path: 'rapports', element: <ReportsPage /> },
              { path: 'journal', element: <JournalPage /> },
              { path: 'parametres', element: <SettingsPage /> },
              { path: 'admin/sante', element: <AdminHealthPage /> },
              { path: 'admin/modeles', element: <AdminModelsPage /> },
              { path: 'admin/utilisateurs', element: <AdminUsersPage /> },
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
