import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div style={{ padding: '20px', textAlign: 'center' }}>Welcome to MERN Task Management</div>} />
      </Routes>
    </Router>
  )
}

export default App
