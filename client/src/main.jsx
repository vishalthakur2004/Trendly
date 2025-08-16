import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Provider } from 'react-redux'
import { store } from './app/store.js'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

// Clerk configuration to prevent development issues
const clerkOptions = {
  appearance: {
    baseTheme: undefined,
  },
  // Add polling interval to prevent concurrent requests
  polling: {
    enabled: false
  }
}

createRoot(document.getElementById('root')).render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    {...clerkOptions}
    afterSignOutUrl="/"
  >
    <BrowserRouter>
     <Provider store={store}>
        <App />
     </Provider>
    </BrowserRouter>
  </ClerkProvider>
)
