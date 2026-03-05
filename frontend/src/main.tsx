/// <reference types="@types/google.maps" />
import './styles/index.css'
import 'antd/dist/reset.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ErrorBoundary } from 'react-error-boundary'
import { store } from './store/index.ts'
import { ErrorFallbackAntd } from './components/ErrorFallbackAntd.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/AppLayout.tsx'
import { GoogleMapsProvider } from './components/GoogleMapsProvider.tsx'
import { Analytics } from '@vercel/analytics/react'

const rootElement = document.getElementById('root')
createRoot(rootElement!).render(
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary FallbackComponent={ErrorFallbackAntd}>
        <BrowserRouter>
          <GoogleMapsProvider>
            <AppLayout />
            <Analytics />
          </GoogleMapsProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </Provider>
  </StrictMode>,
)
