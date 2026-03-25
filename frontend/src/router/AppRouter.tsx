import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { DecksPage } from '../features/decks/DecksPage'
import { StudyWorkspacePage } from '../features/study-workspace/StudyWorkspacePage'
import { StudySessionPage } from '../features/study-session/StudySessionPage'
import { CardsWorkspacePage } from '../features/cards-workspace/CardsWorkspacePage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { RequireAdmin, RequireAuth } from './guards'
import { AdminDashboardPage } from '../features/admin/dashboard/AdminDashboardPage'
import { AdminUsersPage } from '../features/admin/users/AdminUsersPage'
import { AdminDecksPage } from '../features/admin/decks/AdminDecksPage'
import { AdminCardsPage } from '../features/admin/cards/AdminCardsPage'
import { AdminModerationAuditPage } from '../features/admin/audit/AdminModerationAuditPage'
import { FSRSTestPage } from '../features/admin/fsrs-test/FSRSTestPage'
import { ListeningPage } from '../features/listening/ListeningPage'

function BlockedPage() {
  return (
    <div className="rounded border border-rose-300 bg-rose-50 p-4 text-rose-700">
      Your account is blocked by an admin.
    </div>
  )
}

function HomePage() {
  return <Navigate replace to="/flashcard/decks" />
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/blocked" element={<BlockedPage />} />
        <Route path="/flashcard/decks" element={<DecksPage />} />

        <Route element={<RequireAuth />}>
          <Route index element={<HomePage />} />
          <Route path="/flashcard/cards" element={<CardsWorkspacePage />} />
          <Route path="/flashcard/study" element={<StudyWorkspacePage />} />
          <Route path="/flashcard/study/session/:deckId" element={<StudySessionPage />} />
          <Route path="/study/session/:deckId" element={<StudySessionPage />} />
          <Route path="/flashcard/settings" element={<ProfilePage />} />
          <Route path="/listening" element={<ListeningPage />} />
        </Route>

        <Route path="/admin" element={<RequireAdmin />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="decks" element={<AdminDecksPage />} />
          <Route path="cards" element={<AdminCardsPage />} />
          <Route path="audit" element={<AdminModerationAuditPage />} />
          <Route path="fsrs-test" element={<FSRSTestPage />} />
        </Route>

        <Route path="/decks" element={<Navigate replace to="/flashcard/decks" />} />
        <Route path="/cards" element={<Navigate replace to="/flashcard/cards" />} />
        <Route path="/study" element={<Navigate replace to="/flashcard/study" />} />
        <Route path="/profile" element={<Navigate replace to="/flashcard/settings" />} />

        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  )
}
