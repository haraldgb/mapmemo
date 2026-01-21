import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ErrorBoundary } from 'react-error-boundary'
import './index.css'
import { store } from './store/index.ts'
import 'antd/dist/reset.css'
import { ErrorFallbackAntd } from './components/ErrorFallbackAntd.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/AppLayout.tsx'

const rootElement = document.getElementById('root')
createRoot(rootElement!).render(
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary FallbackComponent={ErrorFallbackAntd}>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </ErrorBoundary>
    </Provider>
  </StrictMode>,
  // <Provider store={store}>
  //   <ErrorBoundary FallbackComponent={ErrorFallbackAntd}>
  //     <App />
  //   </ErrorBoundary>
  // </Provider>,
)
