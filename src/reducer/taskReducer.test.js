import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage globally for Node testing environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();

global.localStorage = localStorageMock;

// Import appReducer after setting up the global mock
import appReducer, { initialState, ACTIONS } from './appReducer.js';

describe('Global State Reducer (appReducer) Unit Tests', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial state by default', () => {
    const result = appReducer(undefined, {});
    expect(result).toEqual(initialState);
  });

  it('should handle ACTIONS.SET_LOADING', () => {
    const state = { ...initialState, loading: false };
    const action = { type: ACTIONS.SET_LOADING, payload: true };
    const result = appReducer(state, action);
    expect(result.loading).toBe(true);
  });

  it('should handle ACTIONS.LOGIN_SUCCESS and update localstorage', () => {
    const dummyUser = { userId: 'USR1001', name: 'Rahul', role: 'admin' };
    const dummyToken = 'mock-jwt-token';
    const action = {
      type: ACTIONS.LOGIN_SUCCESS,
      payload: { token: dummyToken, user: dummyUser }
    };

    const result = appReducer(initialState, action);
    expect(result.jwtToken).toBe(dummyToken);
    expect(result.authenticatedUser).toEqual(dummyUser);
    expect(localStorage.getItem('token')).toBe(dummyToken);
  });

  it('should handle ACTIONS.LOGOUT and clear localstorage', () => {
    localStorage.setItem('token', 'old-token');
    const loggedInState = {
      ...initialState,
      jwtToken: 'old-token',
      authenticatedUser: { userId: 'USR1001' }
    };

    const action = { type: ACTIONS.LOGOUT };
    const result = appReducer(loggedInState, action);
    expect(result.jwtToken).toBeNull();
    expect(result.authenticatedUser).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should handle ACTIONS.ADD_ISSUE', () => {
    const dummyIssue = { issueId: 'ISS1001', title: 'Login Crash' };
    const state = { ...initialState, issues: [] };
    const action = { type: ACTIONS.ADD_ISSUE, payload: dummyIssue };
    const result = appReducer(state, action);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toEqual(dummyIssue);
  });

  it('should handle ACTIONS.UPDATE_ISSUE', () => {
    const originalIssue = { issueId: 'ISS1001', title: 'Login Crash', status: 'open' };
    const updatedIssue = { issueId: 'ISS1001', title: 'Login Crash', status: 'in-progress' };
    const state = { ...initialState, issues: [originalIssue] };
    const action = { type: ACTIONS.UPDATE_ISSUE, payload: updatedIssue };
    const result = appReducer(state, action);
    expect(result.issues[0].status).toBe('in-progress');
  });

  it('should handle ACTIONS.DELETE_ISSUE', () => {
    const dummyIssue = { issueId: 'ISS1001', title: 'Login Crash' };
    const state = { ...initialState, issues: [dummyIssue] };
    const action = { type: ACTIONS.DELETE_ISSUE, payload: 'ISS1001' };
    const result = appReducer(state, action);
    expect(result.issues).toHaveLength(0);
  });

});
