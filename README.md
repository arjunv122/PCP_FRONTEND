# MERN Full Stack Task Management Frontend

## Frontend Setup

### Prerequisites
- Node.js v14+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables
Create a `.env.local` file:

```
VITE_API_BASE_URL=http://localhost:5000
```

For production:
```
VITE_API_BASE_URL=https://your-backend-url.com
```

### Project Structure

```
src/
├── components/      # React components
├── context/         # Context API setup
├── hooks/           # Custom hooks
├── pages/           # Page components
├── reducer/         # Redux-like reducer
├── router/          # React Router setup
├── services/        # API calls
├── utils/           # Utilities & constants
├── App.jsx          # Main app component
└── main.jsx         # Entry point
```

### Running the Application

**Development:**
```bash
npm run dev
```

**Build:**
```bash
npm run build
```

**Preview:**
```bash
npm run preview
```

### Features Required
- ✅ Authentication & Token Management
- ✅ Login/Protected Routes
- ✅ Task Dashboard with CRUD
- ✅ Task Filtering & Search
- ✅ Task Statistics Display
- ✅ Context API + Reducer State Management
- ✅ Form Validation
- ✅ Loading & Error States
- ✅ Unit Tests with Vitest

### Key Components

#### Context & State Management
- `AppContext.jsx` - Provides global state
- `appReducer.js` - State management logic
- `useAuth.js` - Custom hook for app context

#### Pages (To Create)
- `Login.jsx` - Authentication page
- `Dashboard.jsx` - Main task dashboard
- `TaskForm.jsx` - Add/Edit tasks
- `TaskDetail.jsx` - View single task

#### Components (To Create)
- `ProtectedRoute.jsx` - Route protection (created)
- `TaskCard.jsx` - Task display card
- `TaskList.jsx` - List of tasks
- `LoadingSpinner.jsx` - Loading indicator
- `ErrorAlert.jsx` - Error display

### Testing

Run tests:
```bash
npm run test
```

Test files should include:
- Reducer logic tests
- Utility function tests
- API service tests

### Deployment

Deploy to **Vercel**:
1. Connect GitHub repository
2. Set environment variables
3. Auto-deploy on push

Or **Netlify**:
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Data-testid Requirement
All interactive elements must have `data-testid` attribute for automated testing:

```jsx
<button data-testid="add-task-btn">Add Task</button>
<button data-testid="delete-task-btn">Delete</button>
<input data-testid="search-input" />
```

### Required Dependencies
- react & react-dom
- react-router-dom
- axios
- vitest (dev)

## Notes
- Must use Context API + Reducer for state
- All APIs consumed from backend
- Protected routes required
- Form validation mandatory
- No hardcoded responses allowed

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
