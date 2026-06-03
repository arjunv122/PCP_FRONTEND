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
  const [projFilter, setProjFilter] = useState({ status: '', owner: '' });

  // Issues states
  const [newIssue, setNewIssue] = useState({
    issueId: '', projectId: '', assignedTo: '', reportedBy: '',
    title: '', description: '', priority: 'medium', severity: 'major', status: 'open', dueDate: ''
  });
  const [issueFilter, setIssueFilter] = useState({ priority: '', status: '', severity: '', search: '', page: 1, limit: 10 });
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

  // Fetch initial data based on active tab
  useEffect(() => {
    if (state.jwtToken && state.authenticatedUser) {
      fetchTabSpecificData();
    }
  }, [tab, state.jwtToken, state.authenticatedUser, issueFilter.priority, issueFilter.status, issueFilter.severity, issueFilter.page, projFilter.status]);

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
        
        // Also fetch developers analytics for admin/manager
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
        const res = await projectsAPI.getAll(projFilter);
        if (res.data.success) {
          dispatch({ type: ACTIONS.SET_PROJECTS, payload: res.data.data });
        }
        // Also load users to choose members/owners
        const usersRes = await usersAPI.getAll();
        if (usersRes.data.success) {
          dispatch({ type: ACTIONS.SET_USERS, payload: usersRes.data.data });
        }
      } else if (tab === 'issues') {
        const res = await issuesAPI.getAll(issueFilter);
        if (res.data.success) {
          dispatch({ type: ACTIONS.SET_ISSUES, payload: res.data.data });
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
        // Load projects & users for issue forms
        const projsRes = await projectsAPI.getAll();
        const usersRes = await usersAPI.getAll();
        if (projsRes.data.success) {
          dispatch({ type: ACTIONS.SET_PROJECTS, payload: projsRes.data.data });
        }
        if (usersRes.data.success) {
          dispatch({ type: ACTIONS.SET_USERS, payload: usersRes.data.data });
        }
      } else if (tab === 'comments') {
        // Load issues to post comments on
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

  // Sync dataset handler
  const handleSync = async (e) => {
    if (e) e.preventDefault();
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    setSyncStatus(null);
    try {
      const res = await syncAPI.sync(syncCreds);
      if (res.data.success) {
        setSyncStatus(res.data.data || res.data);
        showNotification('success', 'Synchronization completed successfully!');
        setShowSyncForm(false);
        // Refresh dashboard counters
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

  // Project submission handler
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await projectsAPI.create(newProj);
      if (res.data.success) {
        dispatch({ type: ACTIONS.ADD_PROJECT, payload: res.data.data });
        showNotification('success', 'Project created successfully!');
        setNewProj({ projectId: '', title: '', description: '', owner: '', status: 'active' });
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to create project.');
    }
  };

  // Project deletion
  const handleDeleteProject = async (projId) => {
    if (!window.confirm(`Are you sure you want to delete project ${projId}?`)) return;
    try {
      const res = await projectsAPI.delete(projId);
      if (res.data.success) {
        dispatch({ type: ACTIONS.DELETE_PROJECT, payload: projId });
        showNotification('success', 'Project deleted successfully.');
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to delete project.');
    }
  };

  // Issue creation
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newIssue, reportedBy: state.authenticatedUser.userId };
      const res = await issuesAPI.create(payload);
      if (res.data.success) {
        dispatch({ type: ACTIONS.ADD_ISSUE, payload: res.data.data });
        showNotification('success', 'Issue reported successfully!');
        setNewIssue({
          issueId: '', projectId: '', assignedTo: '', reportedBy: '',
          title: '', description: '', priority: 'medium', severity: 'major', status: 'open', dueDate: ''
        });
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to create issue.');
    }
  };

  // Issue deletion
  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm(`Are you sure you want to delete issue ${issueId}?`)) return;
    try {
      const res = await issuesAPI.delete(issueId);
      if (res.data.success) {
        dispatch({ type: ACTIONS.DELETE_ISSUE, payload: issueId });
        showNotification('success', 'Issue deleted successfully.');
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to delete issue.');
    }
  };

  // Workflow: Update status
  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      const res = await issuesAPI.updateStatus(issueId, newStatus);
      if (res.data.success) {
        dispatch({ type: ACTIONS.UPDATE_ISSUE, payload: res.data.data });
        showNotification('success', 'Issue status updated successfully.');
        setEditingIssueId(null);
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to update issue status.');
    }
  };

  // Workflow: Assign issue
  const handleAssignIssue = async (issueId, assignedTo) => {
    try {
      const res = await issuesAPI.assign(issueId, assignedTo);
      if (res.data.success) {
        dispatch({ type: ACTIONS.UPDATE_ISSUE, payload: res.data.data });
        showNotification('success', 'Issue assigned successfully.');
        setEditingIssueId(null);
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to assign issue.');
    }
  };

  // Comments: Load comments for an issue
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

  // Comments: Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!activeIssueComments || !newCommentMsg) return;
    try {
      const res = await commentsAPI.create({ issueId: activeIssueComments, message: newCommentMsg });
      if (res.data.success) {
        dispatch({ type: ACTIONS.ADD_COMMENT, payload: res.data.data });
        setNewCommentMsg('');
        showNotification('success', 'Comment added.');
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to add comment.');
    }
  };

  // Comments: Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      const res = await commentsAPI.delete(commentId);
      if (res.data.success) {
        dispatch({ type: ACTIONS.DELETE_COMMENT, payload: commentId });
        showNotification('success', 'Comment deleted.');
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to delete comment.');
    }
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

            {/* Sync configuration overlay form */}
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

            {/* Sync results display */}
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
                <h2 style={{ margin: '5px 0 0 0' }}>{state.analytics.issues?.total || 0}</h2>
              </div>
              <div data-testid="active-projects-card" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #27ae60' }}>
                <span style={{ fontSize: '12px', color: '#aaa' }}>ACTIVE PROJECTS</span>
                <h2 style={{ margin: '5px 0 0 0' }}>{state.analytics.projects?.activeCount || 0}</h2>
              </div>
              <div data-testid="open-issues-card" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #f39c12' }}>
                <span style={{ fontSize: '12px', color: '#aaa' }}>OPEN ISSUES</span>
                <h2 style={{ margin: '5px 0 0 0' }}>{state.analytics.issues?.open || 0}</h2>
              </div>
              <div data-testid="closed-issues-card" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #95a5a6' }}>
                <span style={{ fontSize: '12px', color: '#aaa' }}>CLOSED ISSUES</span>
                <h2 style={{ margin: '5px 0 0 0' }}>{state.analytics.issues?.closed || 0}</h2>
              </div>
            </div>

            {/* Analytics Details & Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              {/* Chart/Representation Card */}
              <div data-testid="issue-chart" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#4da6ff' }}>Issue Distribution Status</h4>
                {state.analytics.issues ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Open ({state.analytics.issues.open})</span>
                        <span>{Math.round((state.analytics.issues.open / (state.analytics.issues.total || 1)) * 100)}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${(state.analytics.issues.open / (state.analytics.issues.total || 1)) * 100}%`, backgroundColor: '#f39c12', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>In Progress ({state.analytics.issues.inProgress || 0})</span>
                        <span>{Math.round(((state.analytics.issues.inProgress || 0) / (state.analytics.issues.total || 1)) * 100)}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${((state.analytics.issues.inProgress || 0) / (state.analytics.issues.total || 1)) * 100}%`, backgroundColor: '#3498db', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Testing ({state.analytics.issues.testing || 0})</span>
                        <span>{Math.round(((state.analytics.issues.testing || 0) / (state.analytics.issues.total || 1)) * 100)}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${((state.analytics.issues.testing || 0) / (state.analytics.issues.total || 1)) * 100}%`, backgroundColor: '#9b59b6', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Resolved ({state.analytics.issues.resolved || 0})</span>
                        <span>{Math.round(((state.analytics.issues.resolved || 0) / (state.analytics.issues.total || 1)) * 100)}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${((state.analytics.issues.resolved || 0) / (state.analytics.issues.total || 1)) * 100}%`, backgroundColor: '#2ecc71', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '14px', color: '#888' }}>Sync data to view chart analytics.</span>
                )}
              </div>

              {/* Recent Activity Card */}
              <div data-testid="recent-activity" style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#4da6ff' }}>Project Workloads (Issues count)</h4>
                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {state.analytics.projects?.projectWiseCount && state.analytics.projects.projectWiseCount.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#aaa' }}>
                          <th style={{ padding: '6px' }}>Project ID</th>
                          <th style={{ padding: '6px' }}>Project Title</th>
                          <th style={{ padding: '6px' }}>Issues Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.analytics.projects.projectWiseCount.slice(0, 5).map(p => (
                          <tr key={p.projectId} style={{ borderBottom: '1px solid #2d2d2d' }}>
                            <td style={{ padding: '6px' }}>{p.projectId}</td>
                            <td style={{ padding: '6px' }}>{p.title}</td>
                            <td style={{ padding: '6px', fontWeight: 'bold' }}>{p.count}</td>
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

            {/* Developer Performance Analytics (Admins & Managers Only) */}
            {['admin', 'manager'].includes(state.authenticatedUser?.role) && state.analytics.developers && (
              <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#4da6ff' }}>Developer Resolution Performance</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#aaa' }}>
                        <th style={{ padding: '8px' }}>Developer Name</th>
                        <th style={{ padding: '8px' }}>Developer ID</th>
                        <th style={{ padding: '8px' }}>Department</th>
                        <th style={{ padding: '8px' }}>Resolved Issues</th>
                        <th style={{ padding: '8px' }}>Avg Resolution Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.analytics.developers.developers.map(dev => (
                        <tr key={dev.developerId} style={{ borderBottom: '1px solid #2d2d2d' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{dev.name}</td>
                          <td style={{ padding: '8px' }}>{dev.developerId}</td>
                          <td style={{ padding: '8px' }}>{dev.department}</td>
                          <td style={{ padding: '8px', color: '#2ecc71', fontWeight: 'bold' }}>{dev.resolvedCount}</td>
                          <td style={{ padding: '8px' }}>
                            {dev.avgResolutionTimeHours > 0 ? `${dev.avgResolutionTimeHours} hrs` : 'N/A'}
                          </td>
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
                {/* Project filter */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    value={projFilter.status}
                    onChange={e => setProjFilter({ ...projFilter, status: e.target.value })}
                    style={{ padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
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
                      placeholder="Search title/desc..."
                      value={issueFilter.search}
                      onChange={e => setIssueFilter({ ...issueFilter, search: e.target.value, page: 1 })}
                      style={{ padding: '6px 12px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
                    />
                    <button 
                      onClick={fetchTabSpecificData}
                      style={{ padding: '6px 10px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', cursor: 'pointer' }}
                    >
                      Search
                    </button>
                  </div>

                  {/* Priority filter */}
                  <div>
                    <select 
                      value={issueFilter.priority}
                      onChange={e => setIssueFilter({ ...issueFilter, priority: e.target.value, page: 1 })}
                      style={{ padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
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
                      value={issueFilter.status}
                      onChange={e => setIssueFilter({ ...issueFilter, status: e.target.value, page: 1 })}
                      style={{ padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
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
                      value={issueFilter.severity}
                      onChange={e => setIssueFilter({ ...issueFilter, severity: e.target.value, page: 1 })}
                      style={{ padding: '6px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}
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
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                        <tr key={i.issueId} style={{ borderBottom: '1px solid #333' }}>
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
                                  data-testid="save-task-btn"
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
                                    onClick={() => { setEditingIssueId(i.issueId); setEditAssigneeVal(i.assignedTo || ''); }}
                                    style={{ color: '#4da6ff', cursor: 'pointer', fontSize: '11px' }}
                                  >
                                    [Edit]
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
                  disabled={issueFilter.page <= 1}
                  onClick={() => setIssueFilter({ ...issueFilter, page: issueFilter.page - 1 })}
                  style={{ padding: '5px 10px', backgroundColor: '#333', color: '#fff', border: 'none', cursor: issueFilter.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <span>Page {pagination.page} of {pagination.pages || 1}</span>
                <button
                  disabled={issueFilter.page >= pagination.pages}
                  onClick={() => setIssueFilter({ ...issueFilter, page: issueFilter.page + 1 })}
                  style={{ padding: '5px 10px', backgroundColor: '#333', color: '#fff', border: 'none', cursor: issueFilter.page >= pagination.pages ? 'not-allowed' : 'pointer' }}
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
            {/* Sidebar of Issues */}
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

            {/* Comments List & Posting */}
            <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
              {activeIssueComments ? (
                <div>
                  <h3 style={{ marginTop: 0, color: '#4da6ff' }}>Comments for {activeIssueComments}</h3>
                  
                  {/* Post Comment Form (Admin, Manager, Tester, Developer - all logged in users can comment) */}
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

                  {/* List of comments */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {state.comments.length > 0 ? (
                      state.comments.map(c => {
                        const isCommentOwner = state.authenticatedUser?.userId === c.userId;
                        const isManagerOrAdmin = ['admin', 'manager'].includes(state.authenticatedUser?.role);
                        
                        return (
                          <div key={c.commentId} style={{
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
      </div>
    </div>
  );
};

export default Dashboard;
