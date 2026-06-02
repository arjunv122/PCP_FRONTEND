import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// TODO: Import pages when created
// import Login from '../pages/Login';
// import Dashboard from '../pages/Dashboard';

export const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* TODO: Add routes during assessment */}
        {/* <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        /> */}
      </Routes>
    </Router>
  );
};

export default AppRouter;
