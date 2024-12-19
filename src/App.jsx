import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';

const App = () => {
  const [data, setData] = useState([]);
  const [packingList, setPackingList] = useState([]);
  const [pdfLink, setPdfLink] = useState('');
  const [neededItems, setNeededItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQDbJOcputZJPO5bniFKM_kmAvhmaQHHvNCGkZXTvUucOWxkiMKt6bz3UkjYZ3aanHy2gvIUyj6rlIQ/pub?output=tsv'); // Adjust this URL if necessary
        const text = await response.text();

        const parsedData = Papa.parse(text, {
          header: true,
          delimiter: '\t',
        }).data;

        // Extract PDF link and packing list items
        const pdf = parsedData.find(row => row.pdf)?.pdf;
        const items = parsedData.filter(row => row.Item && row.Quantity);

        setPdfLink(pdf);
        setPackingList(items);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleAddToNeeded = (item, quantity) => {
    setNeededItems(prevItems => [...prevItems, { ...item, quantity }]);
  };

  return (
    <div>
      <h1>Packing List</h1>
      {pdfLink && (
        <a href={pdfLink} target="_blank" rel="noopener noreferrer">
          Download Packing List PDF
        </a>
      )}
      <div>
        <h2>Items</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Actions</th>
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
                <td>
                  <input
                    type="number"
                    defaultValue={item.Quantity}
                    min="1"
                    onChange={e => handleAddToNeeded(item, e.target.value)}
                  />
                  <button onClick={() => handleAddToNeeded(item, item.Quantity)}>
                    Add to Needed
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2>Needed Items</h2>
        <ul>
          {neededItems.map((item, index) => (
            <li key={index}>{`${item.Item} - Quantity: ${item.quantity}`}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;