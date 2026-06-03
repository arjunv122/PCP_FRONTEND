import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAuth.js';
import { ACTIONS } from '../reducer/appReducer.js';
import {
  authAPI,
  syncAPI,
  usersAPI,
  projectsAPI,
  issuesAPI,
  commentsAPI,
  analyticsAPI
} from '../services/api.js';

const Dashboard = ({ tab = 'dashboard' }) => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();

  // Component states
  const [syncStatus, setSyncStatus] = useState(null);
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [syncCreds, setSyncCreds] = useState({
    studentId: 'E0223017',
    password: '351727',
    set: 'setB'
  });

  // Projects states
  const [newProj, setNewProj] = useState({ projectId: '', title: '', description: '', owner: '', status: 'active' });
  const [projSearchVal, setProjSearchVal] = useState('');

  // Local state for filters, synced to state.filters
  const [searchVal, setSearchVal] = useState(state.filters.search);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

  // Status & Assignment updates
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [editStatusVal, setEditStatusVal] = useState('');
  const [editAssigneeVal, setEditAssigneeVal] = useState('');

  // Comments states
  const [activeIssueComments, setActiveIssueComments] = useState('');
  const [newCommentMsg, setNewCommentMsg] = useState('');
  
  // Local notification messages
  const [message, setMessage] = useState({ type: '', text: '' });

  // Redirect to login if token is missing
  useEffect(() => {
    if (!state.jwtToken) {
      navigate('/login');
    }
  }, [state.jwtToken, navigate]);

  // Fetch initial data based on active tab and filters
  useEffect(() => {
    if (state.jwtToken && state.authenticatedUser) {
      fetchTabSpecificData();
    }
  }, [
    tab, 
    state.jwtToken, 
    state.authenticatedUser, 
    state.filters.priority, 
    state.filters.status, 
    state.filters.severity, 
    state.filters.page,
    projSearchVal
  ]);

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchTabSpecificData = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      if (tab === 'dashboard') {
        const issuesRes = await analyticsAPI.getIssues();
        const projsRes = await analyticsAPI.getProjects();
        if (issuesRes.data.success) {
          dispatch({ type: ACTIONS.SET_ANALYTICS_ISSUES, payload: issuesRes.data.data });
        }
        if (projsRes.data.success) {
          dispatch({ type: ACTIONS.SET_ANALYTICS_PROJECTS, payload: projsRes.data.data });
        }
        
        if (['admin', 'manager'].includes(state.authenticatedUser.role)) {
          const devsRes = await analyticsAPI.getDevelopers();
          if (devsRes.data.success) {
            dispatch({ type: ACTIONS.SET_ANALYTICS_DEVELOPERS, payload: devsRes.data.data });
          }
        }
      } else if (tab === 'users') {
        const res = await usersAPI.getAll();
        if (res.data.success) {
          dispatch({ type: ACTIONS.SET_USERS, payload: res.data.data });
        }
      } else if (tab === 'projects') {
        // Query projects
        const params = {};
        if (projSearchVal) {
          params.owner = projSearchVal; // Will filter projects by owner matching query
        }
        const res = await projectsAPI.getAll(params);
        if (res.data.success) {
          dispatch({ type: ACTIONS.SET_PROJECTS, payload: res.data.data });
        }
        const usersRes = await usersAPI.getAll();
        if (usersRes.data.success) {
          dispatch({ type: ACTIONS.SET_USERS, payload: usersRes.data.data });
        }
      } else if (tab === 'issues') {
        // Fetch using state.filters
        const res = await issuesAPI.getAll(state.filters);
        if (res.data.success) {
          dispatch({ type: ACTIONS.SET_ISSUES, payload: res.data.data });
          if (res.data.total !== undefined) {
            setPagination({
              total: res.data.total,
              page: res.data.page,
              limit: res.data.limit,
              pages: res.data.totalPages || 1
            });
          }
        }
        const projsRes = await projectsAPI.getAll();
        const usersRes = await usersAPI.getAll();
        if (projsRes.data.success) {
          dispatch({ type: ACTIONS.SET_PROJECTS, payload: projsRes.data.data });
        }
        if (usersRes.data.success) {
          dispatch({ type: ACTIONS.SET_USERS, payload: usersRes.data.data });
        }
      } else if (tab === 'comments') {
        const issuesRes = await issuesAPI.getAll({ limit: 100 });
        if (issuesRes.data.success) {
          dispatch({ type: ACTIONS.SET_ISSUES, payload: issuesRes.data.data });
        }
        if (activeIssueComments) {
          const commRes = await commentsAPI.getAll(activeIssueComments);
          if (commRes.data.success) {
            dispatch({ type: ACTIONS.SET_COMMENTS, payload: commRes.data.data });
          }
        }
      } else if (tab === 'profile') {
        // Just displays authenticatedUser details
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.response?.data?.message || 'Failed to fetch data' });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  const handleLogout = () => {
    dispatch({ type: ACTIONS.LOGOUT });
    navigate('/login');
  };

  const handleSync = async (e) => {
    if (e) e.preventDefault();
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    setSyncStatus(null);
    try {
      const res = await syncAPI.sync(syncCreds);
      if (res.data.success) {
        setSyncStatus(res.data.data || res.data);
        showNotification('success', 'Dataset synchronized successfully');
        setShowSyncForm(false);
        fetchTabSpecificData();
      } else {
        showNotification('error', res.data.message || 'Sync failed.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      showNotification('error', error.response?.data?.message || 'Dataset synchronization failed.');
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await projectsAPI.create(newProj);
      if (res.data.success) {
        dispatch({ type: ACTIONS.ADD_PROJECT, payload: res.data.data });
        showNotification('success', 'Project created successfully');
        setNewProj({ projectId: '', title: '', description: '', owner: '', status: 'active' });
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to create project.');
    }
  };

  const handleDeleteProject = async (projId) => {
    if (!window.confirm(`Are you sure you want to delete project ${projId}?`)) return;
    try {
      const res = await projectsAPI.delete(projId);
      if (res.data.success) {
        dispatch({ type: ACTIONS.DELETE_PROJECT, payload: projId });
        showNotification('success', 'Project deleted successfully');
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to delete project.');
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newIssue, reportedBy: state.authenticatedUser.userId };
      const res = await issuesAPI.create(payload);
      if (res.data.success) {
        dispatch({ type: ACTIONS.ADD_ISSUE, payload: res.data.data });
        showNotification('success', 'Issue created successfully');
        setNewIssue({
          issueId: '', projectId: '', assignedTo: '', reportedBy: '',
          title: '', description: '', priority: 'medium', severity: 'major', status: 'open', dueDate: ''
        });
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to create issue.');
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm(`Are you sure you want to delete issue ${issueId}?`)) return;
    try {
      const res = await issuesAPI.delete(issueId);
      if (res.data.success) {
        dispatch({ type: ACTIONS.DELETE_ISSUE, payload: issueId });
        showNotification('success', 'Issue deleted successfully');
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to delete issue.');
    }
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      const res = await issuesAPI.updateStatus(issueId, newStatus);
      if (res.data.success) {
        // Reducer will update in issues state
        dispatch({ type: ACTIONS.UPDATE_ISSUE, payload: { issueId, status: newStatus } });
        showNotification('success', 'Issue status updated successfully');
        setEditingIssueId(null);
        fetchTabSpecificData();
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleAssignIssue = async (issueId, assignedTo) => {
    try {
      const res = await issuesAPI.assign(issueId, assignedTo);
      if (res.data.success) {
        dispatch({ type: ACTIONS.UPDATE_ISSUE, payload: { issueId, assignedTo } });
        showNotification('success', 'Issue assigned successfully');
        setEditingIssueId(null);
        fetchTabSpecificData();
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to assign issue.');
    }
  };

  const selectCommentsIssue = async (issueId) => {
    setActiveIssueComments(issueId);
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const res = await commentsAPI.getAll(issueId);
      if (res.data.success) {
        dispatch({ type: ACTIONS.SET_COMMENTS, payload: res.data.data });
      }
    } catch (error) {
      showNotification('error', 'Failed to load comments.');
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!activeIssueComments || !newCommentMsg) return;
    try {
      const res = await commentsAPI.create({ issueId: activeIssueComments, message: newCommentMsg });
      if (res.data.success) {
        dispatch({ type: ACTIONS.ADD_COMMENT, payload: res.data.data });
        setNewCommentMsg('');
        showNotification('success', 'Comment added successfully');
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to add comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await commentsAPI.delete(commentId);
      if (res.data.success) {
        dispatch({ type: ACTIONS.DELETE_COMMENT, payload: commentId });
        showNotification('success', 'Comment deleted successfully');
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to delete comment.');
    }
  };

  // Synced Filter update dispatch
  const updateIssueFilters = (key, value) => {
    dispatch({
      type: ACTIONS.SET_FILTERS,
      payload: { [key]: value, page: 1 }
    });
  };

  const handleSearchClick = () => {
    dispatch({
      type: ACTIONS.SET_FILTERS,
      payload: { search: searchVal, page: 1 }
    });
  };

  return (
    <div style={{
      backgroundColor: '#121212',
      color: '#fff',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header & Navigation */}
      <nav data-testid="navbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ color: '#4da6ff', margin: 0 }}>PCP BugTracker</h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <span 
              data-testid="dashboard-link"
              onClick={() => navigate('/dashboard')}
              style={{ cursor: 'pointer', color: tab === 'dashboard' ? '#4da6ff' : '#aaa', fontWeight: tab === 'dashboard' ? 'bold' : 'normal' }}
            >
              Dashboard
            </span>
            <span 
              data-testid="users-link"
              onClick={() => navigate('/users')}
              style={{ cursor: 'pointer', color: tab === 'users' ? '#4da6ff' : '#aaa', fontWeight: tab === 'users' ? 'bold' : 'normal' }}
            >
              Users
            </span>
            <span 
              data-testid="projects-link"
              onClick={() => navigate('/projects')}
              style={{ cursor: 'pointer', color: tab === 'projects' ? '#4da6ff' : '#aaa', fontWeight: tab === 'projects' ? 'bold' : 'normal' }}
            >
              Projects
            </span>
            <span 
              data-testid="issues-link"
              onClick={() => navigate('/issues')}
              style={{ cursor: 'pointer', color: tab === 'issues' ? '#4da6ff' : '#aaa', fontWeight: tab === 'issues' ? 'bold' : 'normal' }}
            >
              Issues
            </span>
            <span 
              data-testid="comments-link"
              onClick={() => navigate('/comments')}
              style={{ cursor: 'pointer', color: tab === 'comments' ? '#4da6ff' : '#aaa', fontWeight: tab === 'comments' ? 'bold' : 'normal' }}
            >
              Comments
            </span>
            <span 
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer', color: tab === 'profile' ? '#4da6ff' : '#aaa', fontWeight: tab === 'profile' ? 'bold' : 'normal' }}
            >
              Profile
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {state.authenticatedUser && (
            <span style={{ fontSize: '14px', color: '#888' }}>
              Logged in as: <strong style={{ color: '#fff' }}>{state.authenticatedUser.name}</strong> ({state.authenticatedUser.role})
            </span>
          )}
          <button 
            data-testid="logout-btn"
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ff4d4f',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={{ padding: '20px', flex: 1 }}>
        {/* Local Notifications */}
        {message.text && (
          <div style={{
            padding: '10px 15px',
            marginBottom: '20px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#145214' : '#851414',
            color: message.type === 'success' ? '#ccffcc' : '#ffcccc',
            border: `1px solid ${message.type === 'success' ? '#c2f5c2' : '#f5c2c2'}`,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>x</button>
          </div>
        )}

        {state.loading && <div style={{ color: '#4da6ff', marginBottom: '15px' }}>Processing, please wait...</div>}

        {/* TAB: DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>System Analytics Dashboard</h3>
              <div>
                <button
                  data-testid="sync-btn"
                  onClick={() => setShowSyncForm(!showSyncForm)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4da6ff',
                    color: '#121212',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Sync API Dataset
                </button>
              </div>
            </div>

            {showSyncForm && (
              <div style={{
                backgroundColor: '#1e1e1e',
                padding: '20px',
                borderRadius: '6px',
                marginBottom: '20px',
                border: '1px solid #444',
                maxWidth: '400px'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#4da6ff' }}>Sync Credentials</h4>
                <form onSubmit={handleSync}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Student ID</label>
                    <input 
                      type="text" 
                      value={syncCreds.studentId}
                      onChange={e => setSyncCreds({ ...syncCreds, studentId: e.target.value })}
                      style={{ width: '90%', padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Password</label>
                    <input 
                      type="text" 
                      value={syncCreds.password}
                      onChange={e => setSyncCreds({ ...syncCreds, password: e.target.value })}
                      style={{ width: '90%', padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Set Variant</label>
                    <input 
                      type="text" 
                      value={syncCreds.set}
                      onChange={e => setSyncCreds({ ...syncCreds, set: e.target.value })}
                      style={{ width: '90%', padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    />
                  </div>
                  <button
                    type="submit"
                    data-testid="submit-sync-btn"
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#27ae60',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Submit & Synchronize
                  </button>
                </form>
              </div>
            )}

            {syncStatus && (
              <div style={{
                backgroundColor: '#1b2a1b',
                border: '1px solid #27ae60',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '20px',
                color: '#ccffcc'
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Synchronization Summary Result:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>Total Fetched: {syncStatus.totalFetched}</li>
                  <li>Inserted to DB: {syncStatus.inserted}</li>
                  <li>Duplicates Skipped: {syncStatus.duplicates}</li>
                  <li>Rejected Entries: {syncStatus.rejected}</li>
                </ul>
              </div>
            )}

            {/* Analytics Container */}
            <div data-testid="analytics-container" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div data-testid="total-issues-card" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #4da6ff' }}>
                <span style={{ fontSize: '12px', color: '#aaa' }}>TOTAL ISSUES</span>
                <h2 style={{ margin: '5px 0 0 0' }}>{state.analytics.issues?.totalIssues || 0}</h2>
              </div>
              <div data-testid="active-projects-card" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #27ae60' }}>
                <span style={{ fontSize: '12px', color: '#aaa' }}>ACTIVE PROJECTS</span>
                <h2 style={{ margin: '5px 0 0 0' }}>{state.analytics.projects?.activeCount || 0}</h2>
              </div>
              <div data-testid="open-issues-card" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #f39c12' }}>
                <span style={{ fontSize: '12px', color: '#aaa' }}>OPEN ISSUES</span>
                <h2 style={{ margin: '5px 0 0 0' }}>{state.analytics.issues?.openIssues || 0}</h2>
              </div>
              <div data-testid="closed-issues-card" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #95a5a6' }}>
                <span style={{ fontSize: '12px', color: '#aaa' }}>CLOSED ISSUES</span>
                <h2 style={{ margin: '5px 0 0 0' }}>{state.analytics.issues?.closedIssues || 0}</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <div data-testid="issue-chart" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#4da6ff' }}>Issue Distribution Status</h4>
                {state.analytics.issues ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Open ({state.analytics.issues.openIssues})</span>
                        <span>{Math.round((state.analytics.issues.openIssues / (state.analytics.issues.totalIssues || 1)) * 100)}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${(state.analytics.issues.openIssues / (state.analytics.issues.totalIssues || 1)) * 100}%`, backgroundColor: '#f39c12', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Resolved ({state.analytics.issues.resolvedIssues || 0})</span>
                        <span>{Math.round(((state.analytics.issues.resolvedIssues || 0) / (state.analytics.issues.totalIssues || 1)) * 100)}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${((state.analytics.issues.resolvedIssues || 0) / (state.analytics.issues.totalIssues || 1)) * 100}%`, backgroundColor: '#2ecc71', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Closed ({state.analytics.issues.closedIssues || 0})</span>
                        <span>{Math.round(((state.analytics.issues.closedIssues || 0) / (state.analytics.issues.totalIssues || 1)) * 100)}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${((state.analytics.issues.closedIssues || 0) / (state.analytics.issues.totalIssues || 1)) * 100}%`, backgroundColor: '#95a5a6', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '14px', color: '#888' }}>Sync data to view chart analytics.</span>
                )}
              </div>

              <div data-testid="recent-activity" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#4da6ff' }}>Project Workloads (Issues count)</h4>
                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {state.analytics.projects?.projectWiseCount && state.analytics.projects.projectWiseCount.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#aaa' }}>
                          <th style={{ padding: '6px' }}>Project Title</th>
                          <th style={{ padding: '6px' }}>Issues Count</th>
                          <th style={{ padding: '6px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.analytics.projects.projectWiseCount.slice(0, 5).map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #2d2d2d' }}>
                            <td style={{ padding: '6px', fontWeight: 'bold' }}>{p.title || p.project}</td>
                            <td style={{ padding: '6px' }}>{p.count || p.issueCount}</td>
                            <td style={{ padding: '6px' }}>{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <span style={{ fontSize: '14px', color: '#888' }}>Sync dataset to load project analytics details.</span>
                  )}
                </div>
              </div>
            </div>

            {['admin', 'manager'].includes(state.authenticatedUser?.role) && state.analytics.developers && (
              <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#4da6ff' }}>Developer Performance Directory</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#aaa' }}>
                        <th style={{ padding: '8px' }}>Developer Name</th>
                        <th style={{ padding: '8px' }}>Resolved Issues</th>
                        <th style={{ padding: '8px' }}>Avg Resolution Time</th>
                        <th style={{ padding: '8px' }}>Highest Resolved Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.analytics.developers.map((dev, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #2d2d2d' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{dev.developer}</td>
                          <td style={{ padding: '8px', color: '#2ecc71', fontWeight: 'bold' }}>{dev.resolvedIssues}</td>
                          <td style={{ padding: '8px' }}>{dev.averageResolutionTime} hrs</td>
                          <td style={{ padding: '8px' }}>{dev.highestResolvedIssueCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: USERS */}
        {tab === 'users' && (
          <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, color: '#4da6ff' }}>User Directory</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', textAlign: 'left', color: '#aaa', fontSize: '14px' }}>
                    <th style={{ padding: '10px' }}>User ID</th>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Role</th>
                    <th style={{ padding: '10px' }}>Department</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.users.map(u => (
                    <tr key={u.userId} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '10px' }}>{u.userId}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{u.name}</td>
                      <td style={{ padding: '10px' }}>{u.email}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          backgroundColor: u.role === 'admin' ? '#d32f2f' : u.role === 'manager' ? '#f57c00' : u.role === 'developer' ? '#1976d2' : '#388e3c'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>{u.department}</td>
                      <td style={{ padding: '10px', color: u.status === 'active' ? '#2ecc71' : '#e74c3c' }}>{u.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PROJECTS */}
        {tab === 'projects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Create Project Form (Admins & Managers Only) */}
            {['admin', 'manager'].includes(state.authenticatedUser?.role) && (
              <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, color: '#4da6ff' }}>Create New Project</h3>
                <form onSubmit={handleCreateProject} style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  alignItems: 'end'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Project ID</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. PROJ1001"
                      value={newProj.projectId}
                      onChange={e => setNewProj({ ...newProj, projectId: e.target.value })}
                      style={{ width: '90%', padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Project Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Core CRM"
                      value={newProj.title}
                      onChange={e => setNewProj({ ...newProj, title: e.target.value })}
                      style={{ width: '90%', padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Database engine"
                      value={newProj.description}
                      onChange={e => setNewProj({ ...newProj, description: e.target.value })}
                      style={{ width: '90%', padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Owner ID</label>
                    <select
                      value={newProj.owner}
                      onChange={e => setNewProj({ ...newProj, owner: e.target.value })}
                      style={{ width: '95%', padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    >
                      <option value="">Select Owner</option>
                      {state.users.filter(u => ['admin', 'manager'].includes(u.role)).map(u => (
                        <option key={u.userId} value={u.userId}>{u.name} ({u.userId})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      data-testid="create-project-btn"
                      style={{
                        padding: '9px 20px',
                        backgroundColor: '#27ae60',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Add Project
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Projects Directory & Filters */}
            <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#4da6ff' }}>Projects Directory</h3>
                {/* Project search input */}
                <div>
                  <input 
                    type="text" 
                    data-testid="project-search"
                    placeholder="Search by owner..."
                    value={projSearchVal}
                    onChange={e => setProjSearchVal(e.target.value)}
                    style={{ padding: '6px 12px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div data-testid="project-list">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #333', textAlign: 'left', color: '#aaa', fontSize: '14px' }}>
                      <th style={{ padding: '10px' }}>Project ID</th>
                      <th style={{ padding: '10px' }}>Title</th>
                      <th style={{ padding: '10px' }}>Description</th>
                      <th style={{ padding: '10px' }}>Owner</th>
                      <th style={{ padding: '10px' }}>Members</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      {['admin', 'manager'].includes(state.authenticatedUser?.role) && <th style={{ padding: '10px' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {state.projects.map(p => (
                      <tr key={p.projectId} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.projectId}</td>
                        <td style={{ padding: '10px' }}>{p.title}</td>
                        <td style={{ padding: '10px', color: '#aaa' }}>{p.description}</td>
                        <td style={{ padding: '10px' }}>{p.owner || 'N/A'}</td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>
                          {p.members && p.members.length > 0 ? p.members.join(', ') : 'No members'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: p.status === 'active' ? '#1b5e20' : p.status === 'completed' ? '#0d47a1' : '#37474f'
                          }}>
                            {p.status}
                          </span>
                        </td>
                        {['admin', 'manager'].includes(state.authenticatedUser?.role) && (
                          <td style={{ padding: '10px' }}>
                            <button
                              onClick={() => handleDeleteProject(p.projectId)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#b71c1c',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ISSUES */}
        {tab === 'issues' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Create Issue Form (Tester, Admin, Manager only) */}
            {['admin', 'manager', 'tester'].includes(state.authenticatedUser?.role) && (
              <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, color: '#4da6ff' }}>Report New Issue</h3>
                <form onSubmit={handleCreateIssue} style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Issue ID</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. ISS1001"
                      value={newIssue.issueId}
                      onChange={e => setNewIssue({ ...newIssue, issueId: e.target.value })}
                      style={{ width: '90%', padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Project</label>
                    <select 
                      required
                      value={newIssue.projectId}
                      onChange={e => setNewIssue({ ...newIssue, projectId: e.target.value })}
                      style={{ width: '95%', padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    >
                      <option value="">Select Project</option>
                      {state.projects.map(p => (
                        <option key={p.projectId} value={p.projectId}>{p.title} ({p.projectId})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Issue Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Title of bug"
                      value={newIssue.title}
                      onChange={e => setNewIssue({ ...newIssue, title: e.target.value })}
                      style={{ width: '90%', padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Priority</label>
                    <select 
                      value={newIssue.priority}
                      onChange={e => setNewIssue({ ...newIssue, priority: e.target.value })}
                      style={{ width: '95%', padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Severity</label>
                    <select 
                      value={newIssue.severity}
                      onChange={e => setNewIssue({ ...newIssue, severity: e.target.value })}
                      style={{ width: '95%', padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  {['admin', 'manager'].includes(state.authenticatedUser?.role) && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Assign Developer</label>
                      <select 
                        value={newIssue.assignedTo}
                        onChange={e => setNewIssue({ ...newIssue, assignedTo: e.target.value })}
                        style={{ width: '95%', padding: '8px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                      >
                        <option value="">Unassigned</option>
                        {state.users.filter(u => u.role === 'developer').map(u => (
                          <option key={u.userId} value={u.userId}>{u.name} ({u.userId})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Description</label>
                    <textarea 
                      value={newIssue.description}
                      onChange={e => setNewIssue({ ...newIssue, description: e.target.value })}
                      style={{ width: '96%', padding: '8px', height: '60px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button
                      type="submit"
                      data-testid="add-task-btn"
                      style={{
                        padding: '9px 20px',
                        backgroundColor: '#27ae60',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Report Issue
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Issues Directory with Search & Filtering */}
            <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#4da6ff' }}>Issues Directory</h3>
                {/* Filters Row */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '15px',
                  alignItems: 'center'
                }}>
                  {/* Search input */}
                  <div>
                    <input 
                      type="text" 
                      data-testid="issue-search"
                      placeholder="Search title/desc..."
                      value={searchVal}
                      onChange={e => setSearchVal(e.target.value)}
                      style={{ padding: '6px 12px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                    />
                    <button 
                      onClick={handleSearchClick}
                      style={{ padding: '6px 10px', marginLeft: '5px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', cursor: 'pointer', borderRadius: '4px' }}
                    >
                      Search
                    </button>
                  </div>

                  {/* Priority filter */}
                  <div>
                    <select 
                      data-testid="issue-filter"
                      value={state.filters.priority}
                      onChange={e => updateIssueFilters('priority', e.target.value)}
                      style={{ padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                    >
                      <option value="">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  {/* Status filter */}
                  <div>
                    <select 
                      data-testid="issue-filter"
                      value={state.filters.status}
                      onChange={e => updateIssueFilters('status', e.target.value)}
                      style={{ padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                    >
                      <option value="">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="testing">Testing</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {/* Severity filter */}
                  <div>
                    <select 
                      data-testid="issue-filter"
                      value={state.filters.severity}
                      onChange={e => updateIssueFilters('severity', e.target.value)}
                      style={{ padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                    >
                      <option value="">All Severities</option>
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Issues Table */}
              <div style={{ overflowX: 'auto', marginBottom: '15px' }}>
                <table data-testid="issue-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #333', textAlign: 'left', color: '#aaa', fontSize: '14px' }}>
                      <th style={{ padding: '10px' }}>Issue ID</th>
                      <th style={{ padding: '10px' }}>Project</th>
                      <th style={{ padding: '10px' }}>Title</th>
                      <th style={{ padding: '10px' }}>Priority</th>
                      <th style={{ padding: '10px' }}>Severity</th>
                      <th style={{ padding: '10px' }}>Assigned To</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.issues.map(i => {
                      const isAssignedDev = state.authenticatedUser?.role === 'developer' && i.assignedTo === state.authenticatedUser.userId;
                      const isManagerOrAdmin = ['admin', 'manager'].includes(state.authenticatedUser?.role);
                      
                      return (
                        <tr key={i.issueId} data-testid="issue-row" style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{i.issueId}</td>
                          <td style={{ padding: '10px' }}>{i.projectId}</td>
                          <td style={{ padding: '10px' }}>
                            <div style={{ fontWeight: 'bold' }}>{i.title}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{i.description}</div>
                          </td>
                          <td style={{ padding: '10px', textTransform: 'capitalize' }}>{i.priority}</td>
                          <td style={{ padding: '10px', textTransform: 'capitalize' }}>{i.severity}</td>
                          <td style={{ padding: '10px' }}>
                            {editingIssueId === i.issueId && isManagerOrAdmin ? (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <select 
                                  value={editAssigneeVal}
                                  onChange={e => setEditAssigneeVal(e.target.value)}
                                  style={{ padding: '4px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                                >
                                  <option value="">Unassigned</option>
                                  {state.users.filter(u => u.role === 'developer').map(u => (
                                    <option key={u.userId} value={u.userId}>{u.name}</option>
                                  ))}
                                </select>
                                <button 
                                  onClick={() => handleAssignIssue(i.issueId, editAssigneeVal)}
                                  style={{ backgroundColor: '#27ae60', border: 'none', color: '#fff', padding: '4px 6px', cursor: 'pointer' }}
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <span style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
                                {i.assignedTo || 'Unassigned'}
                                {isManagerOrAdmin && i.status !== 'closed' && (
                                  <span 
                                    data-testid="assign-issue-btn"
                                    onClick={() => { setEditingIssueId(i.issueId); setEditAssigneeVal(i.assignedTo || ''); }}
                                    style={{ color: '#4da6ff', cursor: 'pointer', fontSize: '11px' }}
                                  >
                                    [Assign]
                                  </span>
                                )}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {editingIssueId === i.issueId && (isAssignedDev || isManagerOrAdmin) ? (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <select 
                                  value={editStatusVal}
                                  onChange={e => setEditStatusVal(e.target.value)}
                                  style={{ padding: '4px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                                >
                                  <option value="open">Open</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="testing">Testing</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="closed">Closed</option>
                                </select>
                                <button 
                                  data-testid="save-task-btn"
                                  onClick={() => handleUpdateStatus(i.issueId, editStatusVal)}
                                  style={{ backgroundColor: '#27ae60', border: 'none', color: '#fff', padding: '4px 6px', cursor: 'pointer' }}
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <span style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  backgroundColor: i.status === 'open' ? '#d84315' : i.status === 'in-progress' ? '#1565c0' : i.status === 'testing' ? '#6a1b9a' : i.status === 'resolved' ? '#2e7d32' : '#37474f'
                                }}>
                                  {i.status}
                                </span>
                                {(isAssignedDev || isManagerOrAdmin) && (
                                  <span 
                                    onClick={() => { setEditingIssueId(i.issueId); setEditStatusVal(i.status); }}
                                    style={{ color: '#4da6ff', cursor: 'pointer', fontSize: '11px' }}
                                  >
                                    [Edit]
                                  </span>
                                )}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button 
                                onClick={() => {
                                  navigate('/comments');
                                  selectCommentsIssue(i.issueId);
                                }}
                                style={{ padding: '4px 8px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Comments
                              </button>
                              {isManagerOrAdmin && (
                                <button 
                                  onClick={() => handleDeleteIssue(i.issueId)}
                                  style={{ padding: '4px 8px', backgroundColor: '#c62828', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', gap: '15px', alignItems: 'center', fontSize: '14px' }}>
                <button
                  data-testid="pagination-prev"
                  disabled={state.filters.page <= 1}
                  onClick={() => dispatch({ type: ACTIONS.SET_FILTERS, payload: { page: state.filters.page - 1 } })}
                  style={{ padding: '5px 10px', backgroundColor: '#333', color: '#fff', border: 'none', cursor: state.filters.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <span>Page {pagination.page} of {pagination.pages || 1}</span>
                <button
                  data-testid="pagination-next"
                  disabled={state.filters.page >= pagination.pages}
                  onClick={() => dispatch({ type: ACTIONS.SET_FILTERS, payload: { page: state.filters.page + 1 } })}
                  style={{ padding: '5px 10px', backgroundColor: '#333', color: '#fff', border: 'none', cursor: state.filters.page >= pagination.pages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: COMMENTS */}
        {tab === 'comments' && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
            <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#4da6ff' }}>Select Issue</h4>
              {state.issues.map(i => (
                <div 
                  key={i.issueId} 
                  onClick={() => selectCommentsIssue(i.issueId)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '4px',
                    backgroundColor: activeIssueComments === i.issueId ? '#333' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '13px',
                    borderBottom: '1px solid #2d2d2d'
                  }}
                >
                  <strong>{i.issueId}</strong> - {i.title}
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
              {activeIssueComments ? (
                <div>
                  <h3 style={{ marginTop: 0, color: '#4da6ff' }}>Comments for {activeIssueComments}</h3>
                  
                  <form onSubmit={handleAddComment} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <input 
                      type="text"
                      required
                      placeholder="Add a comment message..."
                      value={newCommentMsg}
                      onChange={e => setNewCommentMsg(e.target.value)}
                      style={{ flex: 1, padding: '10px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                    />
                    <button
                      type="submit"
                      data-testid="add-comment-btn"
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#27ae60',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Post Comment
                    </button>
                  </form>

                  <div data-testid="comment-table" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {state.comments.length > 0 ? (
                      state.comments.map(c => {
                        const isCommentOwner = state.authenticatedUser?.userId === c.userId;
                        const isManagerOrAdmin = ['admin', 'manager'].includes(state.authenticatedUser?.role);
                        
                        return (
                          <div key={c.commentId} data-testid="comment-row" style={{
                            padding: '12px',
                            backgroundColor: '#262626',
                            borderRadius: '4px',
                            border: '1px solid #333',
                            position: 'relative'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>
                              <span>
                                User: <strong style={{ color: '#fff' }}>{c.userId}</strong>
                              </span>
                              <span>{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize: '14px' }}>{c.message}</div>
                            
                            {(isCommentOwner || isManagerOrAdmin) && (
                              <button 
                                onClick={() => handleDeleteComment(c.commentId)}
                                style={{
                                  position: 'absolute',
                                  right: '10px',
                                  bottom: '10px',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: '#ff4d4f',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: '14px', color: '#888' }}>No comments posted on this issue yet.</span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  <h4>Select an issue from the sidebar to view and add comments.</h4>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {tab === 'profile' && state.authenticatedUser && (
          <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '8px', maxWidth: '600px' }}>
            <h3 style={{ marginTop: 0, color: '#4da6ff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>User Profile Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <span style={{ color: '#888', display: 'block', fontSize: '12px' }}>NAME</span>
                <strong style={{ fontSize: '18px' }}>{state.authenticatedUser.name}</strong>
              </div>
              <div>
                <span style={{ color: '#888', display: 'block', fontSize: '12px' }}>EMAIL</span>
                <span>{state.authenticatedUser.email}</span>
              </div>
              <div>
                <span style={{ color: '#888', display: 'block', fontSize: '12px' }}>USER ID</span>
                <span>{state.authenticatedUser.userId}</span>
              </div>
              <div>
                <span style={{ color: '#888', display: 'block', fontSize: '12px' }}>ROLE</span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  backgroundColor: '#1976d2',
                  display: 'inline-block',
                  marginTop: '5px'
                }}>
                  {state.authenticatedUser.role}
                </span>
              </div>
              {state.authenticatedUser.department && (
                <div>
                  <span style={{ color: '#888', display: 'block', fontSize: '12px' }}>DEPARTMENT</span>
                  <span>{state.authenticatedUser.department}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
