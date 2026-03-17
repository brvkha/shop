import { useEffect } from 'react'
import { AppRouter } from './router/AppRouter'
import { useAuthStore } from './store/authStore'

function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  return <AppRouter />
}

export default App
