import React from 'react';
import '../css/TherapistListPage.css'; // Assuming you will have corresponding CSS for styling

export default function TherapistListPage() {
  const therapists = [
    { name: 'Sample1', username: 'Therapist1', email: 'email@1', qualification: 'OT1' },
    { name: 'Sample2', username: 'Therapist2', email: 'email@2', qualification: 'OT2' },
    { name: 'Sample3', username: 'Therapist3', email: 'email@3', qualification: 'OT3' },
    { name: 'Sample4', username: 'Therapist4', email: 'email@4', qualification: 'OT4' },
    { name: 'Sample5', username: 'Therapist5', email: 'email@5', qualification: 'OT5' }
  ];

  return (
    <div className="therapist-list-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/path/to/logo.png" alt="UnifiedCare Logo" />
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/therapist">Therapist</a></li>
            <li><a href="/parents">Parents</a></li>
            <li><a href="/announcements">Announcements</a></li>
            <li><a href="/approval">Approval</a></li>
            <li><a href="/messages">Messages</a></li>
          </ul>
        </nav>
        <a href="/logout" className="logout">Logout</a>
      </aside>

      <main className="main-content">
        <div className="header">
          <h2>Therapist List</h2>
          <div className="actions">
            <button className="btn-add">ADD</button>
            <button className="btn-edit">EDIT</button>
          </div>
        </div>
        <table className="therapist-table">
          <thead>
            <tr>
              <th>Therapist Name</th>
              <th>UserName</th>
              <th>Email</th>
              <th>Qualification</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {therapists.map((therapist, index) => (
              <tr key={index}>
                <td>{therapist.name}</td>
                <td>{therapist.username}</td>
                <td>{therapist.email}</td>
                <td>{therapist.qualification}</td>
                <td><a href={`/therapist/${index}`}>View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      <div className="profile-section">
        <img src="/path/to/profile-image.jpg" alt="Profile" className="profile-image"/>
        <div className="profile-info">
          <p>Sample facility</p>
          <p>Facility</p>
        </div>
      </div>
    </div>
  );
}
