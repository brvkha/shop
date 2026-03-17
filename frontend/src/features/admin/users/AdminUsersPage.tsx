import { useState } from 'react'
import { useAuthStore } from '../../../store/authStore'
import { ConfirmActionDialog } from '../components/ConfirmActionDialog'

export function AdminUsersPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const banUser = useAuthStore((state) => state.banUser)
  const [auditMessage, setAuditMessage] = useState('')

  return (
    <section>
      <h1 className="text-2xl font-semibold">Admin User Moderation</h1>
      <div className="mt-4 max-w-md">
        <ConfirmActionDialog
          title="Ban current account"
          description="Simulates ban workflow and immediate access block behavior."
          onConfirm={() => {
            if (!currentUser) {
              throw new Error('No signed-in user to ban')
            }
            banUser(currentUser.email)
            const message = `${currentUser.email} has been banned by admin moderation.`
            setAuditMessage(message)
            return message
          }}
        />
        {auditMessage ? <p className="mt-3 text-sm text-slate-600">Audit: {auditMessage}</p> : null}
      </div>
    </section>
  )
}
