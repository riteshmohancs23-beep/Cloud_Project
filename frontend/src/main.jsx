import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import VortexScene from './components/VortexScene'
import HeroOverlay, { AboutPage } from './components/HeroOverlay'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const [page, setPage] = useState(localStorage.getItem('token') ? 'dashboard' : 'hero')

  if (page === 'hero') return (
    <div id="hero">
      <VortexScene />
      <HeroOverlay onGetStarted={() => setPage('auth')} onAbout={() => setPage('about')} />
    </div>
  )

  if (page === 'about') return <AboutPage onBack={() => setPage('hero')} />

  if (page === 'auth') return <Auth onAuth={() => setPage('dashboard')} />

  return <Dashboard onLogout={() => setPage('hero')} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
