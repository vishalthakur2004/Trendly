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

// Simplified Clerk configuration
const clerkOptions = {
  appearance: {
    baseTheme: undefined,
  },
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      {...clerkOptions}
      afterSignOutUrl="/"
    >
      <BrowserRouter>
       <Provider store={store}>
          <ClerkWrapper />
       </Provider>
      </BrowserRouter>
    </ClerkProvider>
  </ErrorBoundary>
)
