
import React from 'react';
import { Link } from 'react-router-dom';
const LandingPage = ({ data }) => {
    const pageInfo = data.find(row => row.level === '0');
    const mosList = data.filter(row => row.level && row.level.trim() === '1');
  
    return (
      <div>
        <h1>{pageInfo?.title || ''}</h1>
        <p>{pageInfo?.message || ''}</p>
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

  export default LandingPage;