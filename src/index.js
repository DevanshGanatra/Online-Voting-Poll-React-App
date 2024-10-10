import React from 'react'; // Import React
import ReactDOM from 'react-dom/client'; // Import ReactDOM
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import Router components
import StartPage from './StartPage'; // Import StartPage component
import LinkGeneratingPage from './LinkGeneratingPage'; // Import LinkGeneratingPage component
import VotingPg from './VotingPg'; // Import VotingPg component
import './index.css'; // Import your CSS file
import reportWebVitals from './reportWebVitals'; // If you're using this for performance measuring

// Create the root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/poll/:pollId" element={<LinkGeneratingPage />} />
        <Route path="/vote/:pollId" element={<VotingPg />} /> {/* Updated route to include pollId */}
      </Routes>
    </Router>
  </React.StrictMode>
);

// If you want to measure performance in your app, pass a function to log results
reportWebVitals();
