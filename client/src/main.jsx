import { createRoot } from 'react-dom/client'
import './index.css'
import ClerkWrapper from './components/ClerkWrapper.jsx'
import {BrowserRouter} from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Provider } from 'react-redux'
import { store } from './app/store.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

// Prevent multiple Clerk initializations
let isClerkInitialized = false

// Clerk configuration to prevent development issues
const clerkOptions = {
  appearance: {
    baseTheme: undefined,
  },
  standardBrowser: true,
  __internal_resource_cache: new Map(),
}

// Custom ClerkProvider wrapper to handle initialization errors
const SafeClerkProvider = ({ children, ...props }) => {
  if (isClerkInitialized) {
    return <div>{children}</div>
  }

  isClerkInitialized = true

  return (
    <ClerkProvider {...props}>
      {children}
    </ClerkProvider>
  )
}

// Initialize app with error handling
const initializeApp = () => {
  try {
    createRoot(document.getElementById('root')).render(
      <ErrorBoundary>
        <SafeClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          {...clerkOptions}
          afterSignOutUrl="/"
        >
          <BrowserRouter>
           <Provider store={store}>
              <App />
           </Provider>
          </BrowserRouter>
        </SafeClerkProvider>
      </ErrorBoundary>
    )
  } catch (error) {
    console.error('Failed to initialize app:', error)
    // Fallback initialization without Clerk
    createRoot(document.getElementById('root')).render(
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Please refresh the page if this takes too long.</p>
        </div>
      </div>
    )
  }
}

// Add small delay to ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  setTimeout(initializeApp, 100)
}
