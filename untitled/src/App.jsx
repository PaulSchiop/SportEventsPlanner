import './App.css'
import CalendarPage from './pages/CalendarPage.jsx'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


function App() {

  return (
      <Router>
        <Routes>
          <Route path="/" element={< CalendarPage />} />
        </Routes>
      </Router>
  )
}

export default App
