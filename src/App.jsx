import React, { useEffect, useState } from "react";
import "./App.css"; // Import modular CSS

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Correct Google Sheets JSON endpoint
    const googleSheetsURL = "https://api.sheety.co/f22188d9d0803bd1311bd316cf3b6b2e/viteReactTest/sheet1";

    fetch(googleSheetsURL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((jsonData) => {
        console.log("Fetched data:", jsonData); // Log to confirm data structure
        setData(jsonData.sheet1); // Adjust key based on JSON structure
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="app">
      <h1>Google Sheets Content</h1>
      {data.length > 0 ? (
        data.map((item, index) => (
          <div key={index} className="content-card">
            <h2>{item.title}</h2>
            <p>{item.content}</p>
          </div>
        ))
      ) : (
        <p>Loading content...</p>
      )}
    </div>
  );
}

export default App;
