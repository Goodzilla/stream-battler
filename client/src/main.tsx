import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { UIProvider } from './contexts/UIContext'

// Force redeploy - 2026-05-27
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
)

