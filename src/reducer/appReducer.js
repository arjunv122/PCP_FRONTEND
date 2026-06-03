export const initialState = {
  authenticatedUser: null,
  jwtToken: typeof localStorage !== 'undefined' ? (localStorage.getItem('token') || null) : null,
  users: [],
  projects: [],
  issues: [],
  comments: [],
  loading: false,
  error: null,
  filters: {
    priority: '',
    status: '',
    severity: '',
    search: '',
    page: 1,
    limit: 10
  },
  analytics: {
    issues: null,
    projects: null,
    developers: null
  }
};

export const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_USERS: 'SET_USERS',
  SET_PROJECTS: 'SET_PROJECTS',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  SET_ISSUES: 'SET_ISSUES',
  ADD_ISSUE: 'ADD_ISSUE',
  UPDATE_ISSUE: 'UPDATE_ISSUE',
  DELETE_ISSUE: 'DELETE_ISSUE',
  SET_COMMENTS: 'SET_COMMENTS',
  ADD_COMMENT: 'ADD_COMMENT',
  DELETE_COMMENT: 'DELETE_COMMENT',
  SET_FILTERS: 'SET_FILTERS',
  SET_ANALYTICS_ISSUES: 'SET_ANALYTICS_ISSUES',
  SET_ANALYTICS_PROJECTS: 'SET_ANALYTICS_PROJECTS',
  SET_ANALYTICS_DEVELOPERS: 'SET_ANALYTICS_DEVELOPERS'
};

const appReducer = (state = initialState, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    case ACTIONS.LOGIN_SUCCESS:
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
      }
      return {
        ...state,
        jwtToken: action.payload.token,
        authenticatedUser: action.payload.user,
        error: null
      };
    case ACTIONS.LOGOUT:
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
      }
      return {
        ...state,
        jwtToken: null,
        authenticatedUser: null,
        users: [],
        projects: [],
        issues: [],
        comments: [],
        filters: { priority: '', status: '', severity: '', search: '', page: 1, limit: 10 },
        analytics: { issues: null, projects: null, developers: null }
      };
    case ACTIONS.SET_USERS:
      return { ...state, users: action.payload };
    case ACTIONS.SET_PROJECTS:
      return { ...state, projects: action.payload };
    case ACTIONS.ADD_PROJECT:
      return { ...state, projects: [...state.projects, action.payload] };
    case ACTIONS.UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(p =>
          p.projectId === action.payload.projectId ? action.payload : p
        )
      };
    case ACTIONS.DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(p => p.projectId !== action.payload)
      };
    case ACTIONS.SET_ISSUES:
      return { ...state, issues: action.payload };
    case ACTIONS.ADD_ISSUE:
      return { ...state, issues: [...state.issues, action.payload] };
    case ACTIONS.UPDATE_ISSUE:
      return {
        ...state,
        issues: state.issues.map(i =>
          i.issueId === action.payload.issueId ? action.payload : i
        )
      };
    case ACTIONS.DELETE_ISSUE:
      return {
        ...state,
        issues: state.issues.filter(i => i.issueId !== action.payload)
      };
    case ACTIONS.SET_COMMENTS:
      return { ...state, comments: action.payload };
    case ACTIONS.ADD_COMMENT:
      return { ...state, comments: [...state.comments, action.payload] };
    case ACTIONS.DELETE_COMMENT:
      return {
        ...state,
        comments: state.comments.filter(c => c.commentId !== action.payload)
      };
    case ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case ACTIONS.SET_ANALYTICS_ISSUES:
      return {
        ...state,
        analytics: { ...state.analytics, issues: action.payload }
      };
    case ACTIONS.SET_ANALYTICS_PROJECTS:
      return {
        ...state,
        analytics: { ...state.analytics, projects: action.payload }
      };
    case ACTIONS.SET_ANALYTICS_DEVELOPERS:
      return {
        ...state,
        analytics: { ...state.analytics, developers: action.payload }
      };
    default:
      return state;
  }
};

export default appReducer;
