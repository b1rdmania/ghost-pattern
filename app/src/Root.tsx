import { useState } from 'react'
import App from './App'
import AboutPage from './pages/AboutPage'

export default function Root() {
  const [page, setPage] = useState<'app' | 'about'>('app')

  if (page === 'about') return <AboutPage onBack={() => setPage('app')} />
  return <App onAbout={() => setPage('about')} />
}
