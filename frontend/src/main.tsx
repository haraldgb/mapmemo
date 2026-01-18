import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ErrorBoundary } from 'react-error-boundary'
import { App } from './App.tsx'
import './index.css'
import { store } from './store'
import 'antd/dist/reset.css'
import { ErrorFallbackAntd } from './components/ErrorFallbackAntd.tsx'

const rootElement = document.getElementById('root')
createRoot(rootElement!).render(
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary FallbackComponent={ErrorFallbackAntd}>
      <App />
      </ErrorBoundary>
    </Provider>
  </StrictMode>,
  // <Provider store={store}>
  //   <ErrorBoundary FallbackComponent={ErrorFallbackAntd}>
  //     <App />
  //   </ErrorBoundary>
  // </Provider>,
)
