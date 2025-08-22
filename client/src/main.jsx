import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Provider } from 'react-redux'
import { store } from './app/store.js'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Check if we have a valid Clerk key (not placeholder)
const hasValidClerkKey = PUBLISHABLE_KEY &&
  PUBLISHABLE_KEY !== 'your_clerk_publishable_key_here' &&
  PUBLISHABLE_KEY !== 'pk_test_YOUR_ACTUAL_KEY_HERE' &&
  PUBLISHABLE_KEY.startsWith('pk_')

const AppContent = () => (
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
)

createRoot(document.getElementById('root')).render(
  hasValidClerkKey ? (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AppContent />
    </ClerkProvider>
  ) : (
    <AppContent />
  )
)
