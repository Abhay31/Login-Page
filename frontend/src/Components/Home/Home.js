import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = ({ setUserState, user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setUserState(null);
    navigate('/login');
  };
  console.log(user)

  return (
    <div className="container mt-5">
      <img
        src={user.picture}
        alt="Profile"
        style={{ borderRadius: '50%', width: '100px', height: '100px' }}
      />
      <h1>Welcome {user.first_name}!</h1>
      <p>Email: {user.email}</p>
      <p>Mobile Number: {user.mobile_number ? user.mobile_number : "Not Available"}</p>
      <p>You are successfully logged in!</p>
      <button
        className="btn btn-primary btn-block"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
};

export default Home;
