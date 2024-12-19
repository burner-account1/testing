import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';

const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQDbJOcputZJPO5bniFKM_kmAvhmaQHHvNCGkZXTvUucOWxkiMKt6bz3UkjYZ3aanHy2gvIUyj6rlIQ/pub?output=tsv');
        const text = await response.text();

        // Parse the TSV data
        const parsedData = Papa.parse(text, {
          header: true,
          delimiter: '\t',
        });

        setData(parsedData.data);
      } catch (error) {
        console.error('Error fetching TSV data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Spreadsheet Data</h1>
      <table>
        <thead>
          <tr>
            {data.length > 0 &&
              Object.keys(data[0]).map((key, index) => <th key={index}>{key}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {Object.values(row).map((value, idx) => (
                <td key={idx}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
