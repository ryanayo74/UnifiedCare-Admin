import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/ContactUsPage.css'; // Import the corresponding CSS file

function ContactUsPage() {

    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate('/AdminLoginPage'); // Redirect to FacilityMessagePage
      };

    const handleHomeClick = () => {
        navigate('/'); // Redirect to FacilityMessagePage
      };

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission (e.g., send data to a backend)
        console.log(formData);
    };



    return (
        <div className="contact-us-container">
          <header>
        <div className="logo-container">
          <div className="logo-text">UnifiedCare</div>
        </div>
        <nav>
          <a href="#" className="home" onClick={handleHomeClick}> Home</a>
          <a href="#">About Us</a>
          <a href="#" className="login" onClick={handleLoginClick}> Log in</a>
        </nav>
         </header>

            <div className="contact-form-container">
                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <input type="text" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="message">Message</label>
                        <textarea id="message" name="message" value={formData.message} onChange={handleChange} required></textarea>
                    </div>
                    <button type="submit" className="submit-button">Submit</button>
                </form>

                <div className="contact-info">
                    <h2>Contact Us</h2>
                    <p>For questions, technical assistance, or collaboration opportunities via the contact information provided.</p>
                    <p><span role="img" aria-label="phone">📞</span> +123-456-7890</p>
                    <p><span role="img" aria-label="email">📧</span> UnifiedCare@gmail.com</p>
                    <p><span role="img" aria-label="location">📍</span> 123 Anywhere St., Any City, ST 12345</p>
                </div>
            </div>
        </div>
    );
}

export default ContactUsPage;
