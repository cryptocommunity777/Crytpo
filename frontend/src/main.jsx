import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Aapki main App file
import './index.css' // Tailwind aur global CSS ke liye

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)