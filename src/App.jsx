import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Papa from 'papaparse';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQDbJOcputZJPO5bniFKM_kmAvhmaQHHvNCGkZXTvUucOWxkiMKt6bz3UkjYZ3aanHy2gvIUyj6rlIQ/pub?output=tsv';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mos/:mosId" element={<MOSPage />} />
        <Route path="/mos/:mosId/course/:courseId" element={<CoursePage />} />
      </Routes>
    </Router>
  );
};

const LandingPage = () => {
  const [mosList, setMosList] = useState([]);

  useEffect(() => {
    const fetchMOSData = async () => {
      try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const parsedData = Papa.parse(text, { header: true, delimiter: '\t' }).data;
        const mosData = parsedData.filter(row => row.level === '1');
        setMosList(mosData);
      } catch (error) {
        console.error('Error fetching MOS data:', error);
      }
    };

    fetchMOSData();
  }, []);

  return (
    <div>
      <h1>Landing Page</h1>
      <ul>
        {mosList.map((mos, index) => (
          <li key={index}>
            <Link to={`/mos/${mos.id}`}>{mos.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const MOSPage = () => {
  const [courses, setCourses] = useState([]);
  const { mosId } = useParams();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const parsedData = Papa.parse(text, { header: true, delimiter: '\t' }).data;
        const courseData = parsedData.filter(row => row.level === '2' && row.parent === mosId);
        setCourses(courseData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, [mosId]);

  return (
    <div>
      <h1>MOS Page</h1>
      <ul>
        {courses.map((course, index) => (
          <li key={index}>
            <Link to={`/mos/${mosId}/course/${course.id}`}>{course.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const CoursePage = () => {
  const [packingList, setPackingList] = useState([]);
  const [pdfLink, setPdfLink] = useState('');
  const { courseId } = useParams();

  useEffect(() => {
    const fetchPackingList = async () => {
      try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const parsedData = Papa.parse(text, { header: true, delimiter: '\t' }).data;
        const courseData = parsedData.filter(row => row.level === '3' && row.parent === courseId);
        const pdf = courseData[0]?.pdf;
        setPdfLink(pdf);
        setPackingList(courseData);
      } catch (error) {
        console.error('Error fetching packing list:', error);
      }
    };

    fetchPackingList();
  }, [courseId]);

  return (
    <div>
      <h1>Course Page</h1>
      {pdfLink && (
        <a href={pdfLink} target="_blank" rel="noopener noreferrer">
          Download Packing List PDF
        </a>
      )}
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {packingList.map((item, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: item.MandOpt === 'M' ? 'red' : item.MandOpt === 'O' ? 'green' : 'white',
              }}
            >
              <td>{item.Item}</td>
              <td>{item.Quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
