// API Constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Status Options
export const STATUS_OPTIONS = ['pending', 'in-progress', 'completed'];

// Priority Options
export const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

// Task Status Colors
export const STATUS_COLORS = {
  pending: '#FFA500',
  'in-progress': '#3498DB',
  completed: '#27AE60',
};

// Priority Colors
export const PRIORITY_COLORS = {
  low: '#95A5A6',
  medium: '#F39C12',
  high: '#E74C3C',
};

export default {
  API_BASE_URL,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_COLORS,
  PRIORITY_COLORS,
};
