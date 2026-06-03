import React, { createContext, useReducer, useEffect } from 'react';
import appReducer, { initialState, ACTIONS } from '../reducer/appReducer.js';
import { authAPI } from '../services/api.js';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Expose global application state on window for Playwright compatibility
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.appState = {
        authUser: state.authenticatedUser,
        token: state.jwtToken,
        users: state.users,
        projects: state.projects,
        issues: state.issues,
        comments: state.comments,
        filters: state.filters,
        analytics: state.analytics
      };
    }
  }, [state]);

  // Initialize: Load user profile if token is available
  useEffect(() => {
    const initializeAuth = async () => {
      if (state.jwtToken && !state.authenticatedUser) {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            dispatch({
              type: ACTIONS.LOGIN_SUCCESS,
              payload: { token: state.jwtToken, user: res.data.data }
            });
          } else {
            dispatch({ type: ACTIONS.LOGOUT });
          }
        } catch (error) {
          console.error('Error restoring session:', error);
          dispatch({ type: ACTIONS.LOGOUT });
        } finally {
          dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        }
      }
    };

    initializeAuth();
  }, [state.jwtToken]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
