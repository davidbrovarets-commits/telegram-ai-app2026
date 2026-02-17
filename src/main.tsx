import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ProductionStateView } from './components/views/ProductionStateView'
import './i18n' // Init i18n

const isProductionPage = window.location.pathname === '/production';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isProductionPage ? <ProductionStateView /> : <App />}
  </StrictMode>,
)

