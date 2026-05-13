import React, { useState } from 'react';
import api from '../../api/axios';

const AddUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    country: '',
    password: '',
    txnPassword: '',
    sponsorId: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // ✅ Correct backend URL for admin route
      const backendURL = process.env.REACT_APP_BACKEND_URL || '/admin';

      const res = await api.post(
        `${backendURL}/auth/register`, // Full URL: /admin/auth/register
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );

      setRegisteredData({
        userId: res.data.userId,
        password: formData.password,
        txnPassword: formData.txnPassword,
      });

      setShowPopup(true);
      setSuccess(`User created successfully! User ID: ${res.data.userId}`);

      setFormData({
        name: '',
        email: '',
        mobile: '',
        country: '',
        password: '',
        txnPassword: '',
        sponsorId: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handlePopupClose = () => setShowPopup(false);

  return (
    <div className='text-black' style={{ maxWidth: 500, margin: '50px auto', padding: 20, background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 25 }}>Add New User (Admin)</h2>

      {error && <div style={{ color: 'red', marginBottom: 15 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 15 }}>{success}</div>}

      <form onSubmit={handleSubmit}>
        {['name', 'email', 'mobile', 'country', 'password', 'txnPassword', 'sponsorId'].map((field) => (
          <div key={field} style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>
              {field === 'txnPassword' ? 'Transaction Password' : field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type={field.includes('password') ? 'password' : 'text'}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
              required={field !== 'sponsorId'}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', backgroundColor: '#28a745', color: '#fff', fontSize: 16, cursor: 'pointer' }}
        >
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </form>

      {showPopup && registeredData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ backgroundColor: '#fff', padding: 30, borderRadius: 12, maxWidth: 400, width: '90%', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: 15 }}>🎉 User Created Successfully!</h3>
            <p><strong>User ID:</strong> {registeredData.userId}</p>
            <p><strong>Password:</strong> {registeredData.password}</p>
            <p><strong>Transaction Password:</strong> {registeredData.txnPassword}</p>
            <p style={{ color: 'red', fontSize: 14, marginTop: 12 }}>📸 Please take a screenshot of this information.</p>
            <button onClick={handlePopupClose} style={{ marginTop: 15, padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#28a745', color: '#fff', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUser;
