// src/pages/MOSPage.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';

const MOSPage = ({ data }) => {
  const { mosId } = useParams();
  const courses = data.filter(row => row.level === '2' && row.parent === mosId);
  const mosInfo = data.find(row => row.id === mosId);

  return (
    <div>
      <h1>{mosInfo?.title || 'MOS Page'}</h1>
      <p>{mosInfo?.message || ''}</p>
      {courses.length === 0 ? (
        <p>No courses found for this MOS.</p>
      ) : (
        <ul>
          {courses.map((course, index) => (
            <li key={index}>
              <Link to={`/mos/${mosId}/course/${course.id}`}>{course.title}</Link>
            </li>
          ))}
        </ul>
      )}
      <Link to="/">Return to Main Page</Link>
    </div>
  );
};

export default MOSPage;
