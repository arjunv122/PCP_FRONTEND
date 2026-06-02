// Initial state
export const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  tasks: [],
  loading: false,
  error: null,
  stats: null,
};

// Action types
export const ACTIONS = {
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  SET_STATS: 'SET_STATS',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload, isAuthenticated: true };
    case ACTIONS.SET_TOKEN:
      localStorage.setItem('token', action.payload);
      return { ...state, token: action.payload, isAuthenticated: true };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.SET_TASKS:
      return { ...state, tasks: action.payload };
    case ACTIONS.ADD_TASK:
      return { ...state, tasks: [...state.tasks, action.payload] };
    case ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task._id === action.payload._id ? action.payload : task
        ),
      };
    case ACTIONS.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter((task) => task._id !== action.payload),
      };
    case ACTIONS.SET_STATS:
      return { ...state, stats: action.payload };
    case ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return { ...state, user: null, token: null, isAuthenticated: false, tasks: [] };
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

export default appReducer;
