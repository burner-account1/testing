import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import Papa from 'papaparse';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRKJHzKw0BJ8t8NQCF5wQMN8RHfgeas6GYqqX_1RzQ9phevK4W1GG2mcTuomOiZhxIGo6tutebnwAG6/pub?output=tsv';

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
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage data={data} />} />
        <Route path="/mos/:mosId" element={<MOSPage data={data} />} />
        <Route path="/mos/:mosId/course/:courseId" element={<CoursePage data={data} />} />
      </Routes>
    </Router>
  );
};

const LandingPage = ({ data }) => {
  const mosList = data.filter(row => row.level === '1');

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

const MOSPage = ({ data }) => {
  const { mosId } = useParams();
  const courses = data.filter(row => row.level === '2' && row.parent === mosId);

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

const CoursePage = ({ data }) => {
  const { courseId } = useParams();
  const packingList = data.filter(row => row.level === '3' && row.parent === courseId);
  const pdfLink = packingList[0]?.pdf;

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
