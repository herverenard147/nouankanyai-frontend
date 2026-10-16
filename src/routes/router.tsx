import { lazy } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuditRequestPage } from '@/pages/audit/AuditRequestPage'
import { BoitierPage } from '@/pages/boitier/BoitierPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'
import { HowItWorksPage } from '@/pages/landing/HowItWorksPage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { InterventionLayout, InterventionsPage } from '@/pages/app/InterventionsPage'
import { AppIndexRedirect } from '@/routes/AppIndexRedirect'
import { ProfileGuard } from '@/routes/ProfileGuard'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

// Pages du tableau de bord chargées à la demande (audit du 2026-10-16) : la page d'accueil et les pages publiques ne
// téléchargent plus tout le tableau de bord. Le chargement s'affiche dans AppLayout (Suspense autour de l'Outlet).
const BoitierDetailPage = lazy(() => import('@/pages/app/BoitierDetailPage').then((m) => ({ default: m.BoitierDetailPage })))
const BoitiersPage = lazy(() => import('@/pages/app/BoitiersPage').then((m) => ({ default: m.BoitiersPage })))
const AdvicePage = lazy(() => import('@/pages/app/AdvicePage').then((m) => ({ default: m.AdvicePage })))
const AssistantPage = lazy(() => import('@/pages/app/AssistantPage').then((m) => ({ default: m.AssistantPage })))
const AuditPage = lazy(() => import('@/pages/app/AuditPage').then((m) => ({ default: m.AuditPage })))
const PlanActionPage = lazy(() => import('@/pages/app/PlanActionPage').then((m) => ({ default: m.PlanActionPage })))
const AlertsPage = lazy(() => import('@/pages/app/AlertsPage').then((m) => ({ default: m.AlertsPage })))
const ConsumptionPage = lazy(() => import('@/pages/app/ConsumptionPage').then((m) => ({ default: m.ConsumptionPage })))
const EquipmentPage = lazy(() => import('@/pages/app/EquipmentPage').then((m) => ({ default: m.EquipmentPage })))
const FacturationPage = lazy(() => import('@/pages/app/FacturationPage').then((m) => ({ default: m.FacturationPage })))
const GettingStartedPage = lazy(() => import('@/pages/app/GettingStartedPage').then((m) => ({ default: m.GettingStartedPage })))
const InvoicesPage = lazy(() => import('@/pages/app/InvoicesPage').then((m) => ({ default: m.InvoicesPage })))
const JournalPage = lazy(() => import('@/pages/app/JournalPage').then((m) => ({ default: m.JournalPage })))
const MachinesPage = lazy(() => import('@/pages/app/MachinesPage').then((m) => ({ default: m.MachinesPage })))
const OverviewPage = lazy(() => import('@/pages/app/OverviewPage').then((m) => ({ default: m.OverviewPage })))
const PredictionPage = lazy(() => import('@/pages/app/PredictionPage').then((m) => ({ default: m.PredictionPage })))
const RecommendationsPage = lazy(() => import('@/pages/app/RecommendationsPage').then((m) => ({ default: m.RecommendationsPage })))
const ReportsPage = lazy(() => import('@/pages/app/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const HelpPage = lazy(() => import('@/pages/app/HelpPage').then((m) => ({ default: m.HelpPage })))
const SourceDetailPage = lazy(() => import('@/pages/app/SourcesPage').then((m) => ({ default: m.SourceDetailPage })))
const SourcesPage = lazy(() => import('@/pages/app/SourcesPage').then((m) => ({ default: m.SourcesPage })))
const AdminBoitierDetailPage = lazy(() => import('@/pages/app/admin/AdminBoitierDetailPage').then((m) => ({ default: m.AdminBoitierDetailPage })))
const AdminBoitiersPage = lazy(() => import('@/pages/app/admin/AdminBoitiersPage').then((m) => ({ default: m.AdminBoitiersPage })))
const AdminHealthPage = lazy(() => import('@/pages/app/admin/AdminHealthPage').then((m) => ({ default: m.AdminHealthPage })))
const AdminBillingPage = lazy(() => import('@/pages/app/admin/AdminBillingPage').then((m) => ({ default: m.AdminBillingPage })))
const AdminLeadsPage = lazy(() => import('@/pages/app/admin/AdminLeadsPage').then((m) => ({ default: m.AdminLeadsPage })))
const AdminMessagesPage = lazy(() => import('@/pages/app/admin/AdminMessagesPage').then((m) => ({ default: m.AdminMessagesPage })))
const AdminModelsPage = lazy(() => import('@/pages/app/admin/AdminModelsPage').then((m) => ({ default: m.AdminModelsPage })))
const AdminUserDetailPage = lazy(() => import('@/pages/app/admin/AdminUserDetailPage').then((m) => ({ default: m.AdminUserDetailPage })))
const AdminUsersPage = lazy(() => import('@/pages/app/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'mot-de-passe-oublie', element: <ForgotPasswordPage /> },
      { path: 'reinitialiser-mot-de-passe', element: <ResetPasswordPage /> },
      { path: 'confirmer-email', element: <VerifyEmailPage /> },
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
              { path: 'premiers-pas', element: <GettingStartedPage /> },
              { path: 'alertes', element: <AlertsPage /> },
              { path: 'consommation', element: <ConsumptionPage /> },
              { path: 'prediction', element: <PredictionPage /> },
              { path: 'factures', element: <InvoicesPage /> },
              { path: 'conseils', element: <AdvicePage /> },
              { path: 'recommandations', element: <RecommendationsPage /> },
              { path: 'equipements', element: <EquipmentPage /> },
              { path: 'machines', element: <MachinesPage /> },
              { path: 'rapports', element: <ReportsPage /> },
              { path: 'facturation', element: <FacturationPage /> },
              { path: 'journal', element: <JournalPage /> },
              { path: 'audit', element: <AuditPage /> },
              { path: 'plan-action', element: <PlanActionPage /> },
              { path: 'boitier', element: <BoitiersPage /> },
              { path: 'boitier/:deviceId', element: <BoitierDetailPage /> },
              { path: 'parametres', element: <SettingsPage /> },
              { path: 'sources', element: <SourcesPage /> },
              { path: 'sources/:deviceId', element: <SourceDetailPage /> },
              { path: 'aide', element: <HelpPage /> },
              { path: 'interventions', element: <InterventionsPage /> },
              {
                path: 'interventions/:accountId',
                element: <InterventionLayout />,
                children: [
                  { index: true, element: <SourcesPage /> },
                  { path: 'sources/:deviceId', element: <SourceDetailPage /> },
                ],
              },
              { path: 'assistant', element: <AssistantPage /> },
              { path: 'admin/boitiers', element: <AdminBoitiersPage /> },
              { path: 'admin/boitiers/:deviceId', element: <AdminBoitierDetailPage /> },
              { path: 'admin/sante', element: <AdminHealthPage /> },
              { path: 'admin/modeles', element: <AdminModelsPage /> },
              { path: 'admin/utilisateurs', element: <AdminUsersPage /> },
              { path: 'admin/utilisateurs/:userId', element: <AdminUserDetailPage /> },
              { path: 'admin/leads', element: <AdminLeadsPage /> },
              { path: 'admin/messages', element: <AdminMessagesPage /> },
              { path: 'admin/facturation', element: <AdminBillingPage /> },
              { path: '*', element: <Navigate to="/app" replace /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
