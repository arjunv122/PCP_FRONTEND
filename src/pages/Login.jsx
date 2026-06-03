import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAuth.js';
import { authAPI } from '../services/api.js';
import { ACTIONS } from '../reducer/appReducer.js';

const Login = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (state.jwtToken && state.authenticatedUser) {
      navigate('/dashboard');
    }
  }, [state.jwtToken, state.authenticatedUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      // API call to backend public token endpoint
      // We pass the email (which can be either email or studentId E0223017) and password
      const res = await authAPI.login({ email, password });
      
      if (res.data.success) {
        const { token, user } = res.data.data;
        dispatch({
          type: ACTIONS.LOGIN_SUCCESS,
          payload: { token, user }
        });
        navigate('/dashboard');
      } else {
        setLocalError(res.data.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLocalError(error.response?.data?.message || 'Invalid credentials or server connection failed.');
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '30px',
        borderRadius: '8px',
        backgroundColor: '#1e1e1e',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        border: '1px solid #333'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#4da6ff' }}>Issue Tracker Login</h2>
        
        {localError && (
          <div style={{
            padding: '10px',
            marginBottom: '15px',
            borderRadius: '4px',
            backgroundColor: '#851414',
            color: '#ffcccc',
            fontSize: '14px',
            border: '1px solid #f5c2c2'
          }}>
            {localError}
          </div>
        )}

        <form data-testid="login-form" onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Email or Student ID</label>
            <input
              type="text"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul.kumar@test.com or E0223017"
              required
              style={{
                width: '93%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: '#2d2d2d',
                color: '#fff',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Password</label>
            <input
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={{
                width: '93%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: '#2d2d2d',
                color: '#fff',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            data-testid="login-btn"
            disabled={state.loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#4da6ff',
              color: '#121212',
              fontWeight: 'bold',
              cursor: state.loading ? 'not-allowed' : 'pointer',
              opacity: state.loading ? 0.7 : 1,
              transition: 'background-color 0.2s'
            }}
          >
            {state.loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
          Tip: You can use your assessment credentials or sync first to log in.
        </div>
      </div>
    </div>
  );
};

export default Login;
