import './App.css'
import Calendar from './pages/Calendar'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


function App() {

  return (
      <Router>
        <Routes>
          <Route path="/" element={< Calendar />} />
        </Routes>
      </Router>
  )
}

export default App
