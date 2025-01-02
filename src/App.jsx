import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Papa from 'papaparse';
import Cookies from 'js-cookie';

import LandingPage from './pages/LandingPage';
import MOSPage from './pages/MOSPage'; 
import CoursePage from './pages/CoursePage';

import './App.css'; // Make sure to import your CSS file

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQnARSkARuiT-loYhnqLfEQ5tl0CecRL39x1fsg2T1y56xLMjpoz8JauaUHa7rIUlQD09UVF3MAMECt/pub?output=tsv';

const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const parsedData = Papa.parse(text, { header: true, delimiter: '\t' }).data;
        setData(parsedData);
      } catch (error) {
        console.error('Error fetching spreadsheet:', error);
      }
    };

    fetchData();
  }, []);

  if (!data.length) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage data={data} />} />
          <Route path="/mos/:mosId" element={<MOSPage data={data} />} />
          <Route path="/mos/:mosId/course/:courseId" element={<CoursePage data={data} />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
