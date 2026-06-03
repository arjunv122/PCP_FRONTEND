// Validation and Sanitization utilities for Issue Tracker (Frontend duplicate for testing/local checks)

export const validateAndSanitizeUser = (user) => {
  if (!user.userId || !user.name || !user.email || !user.role) {
    return null; // Missing mandatory fields
  }

  const role = user.role.toString().trim().toLowerCase();
  if (!['admin', 'manager', 'developer', 'tester'].includes(role)) {
    return null; // Invalid role
  }

  const email = user.email.toString().trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null; // Invalid email
  }

  let status = 'active';
  if (user.status) {
    const rawStatus = user.status.toString().trim().toLowerCase();
    if (rawStatus === 'active' || rawStatus === 'inactive') {
      status = rawStatus;
    }
  }

  return {
    userId: user.userId.toString().trim(),
    name: user.name.toString().trim(),
    email,
    role,
    department: user.department ? user.department.toString().trim() : '',
    status
  };
};

export const validateAndSanitizeProject = (proj, validUserIds) => {
  if (!proj.projectId || !proj.title) {
    return null; // Missing mandatory fields
  }

  const owner = proj.owner ? proj.owner.toString().trim() : null;
  if (owner && !validUserIds.has(owner)) {
    return null; // Invalid owner reference
  }

  let status = 'active';
  if (proj.status) {
    const rawStatus = proj.status.toString().trim().toLowerCase();
    if (['active', 'completed', 'archived'].includes(rawStatus)) {
      status = rawStatus;
    }
  }

  const members = Array.isArray(proj.members)
    ? proj.members.map(m => m.toString().trim()).filter(m => validUserIds.has(m))
    : [];

  let startDate = null;
  if (proj.startDate) {
    const parsedDate = Date.parse(proj.startDate);
    if (!isNaN(parsedDate)) {
      startDate = new Date(parsedDate);
    }
  }

  return {
    projectId: proj.projectId.toString().trim(),
    title: proj.title.toString().trim(),
    description: proj.description ? proj.description.toString().trim() : '',
    owner,
    members,
    status,
    startDate
  };
};

export const validateAndSanitizeIssue = (issue, validProjectIds, validUserIds) => {
  if (!issue.issueId || !issue.projectId || !issue.reportedBy || !issue.title) {
    return null; // Missing mandatory fields
  }

  const projectId = issue.projectId.toString().trim();
  if (!validProjectIds.has(projectId)) {
    return null; // Invalid project reference
  }

  const reportedBy = issue.reportedBy.toString().trim();
  if (!validUserIds.has(reportedBy)) {
    return null; // Invalid reportedBy user reference
  }

  const assignedTo = issue.assignedTo ? issue.assignedTo.toString().trim() : null;
  if (assignedTo && !validUserIds.has(assignedTo)) {
    return null; // Invalid assignedTo user reference
  }

  const priority = issue.priority ? issue.priority.toString().trim().toLowerCase() : 'medium';
  if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
    return null; // Invalid priority value
  }

  const severity = issue.severity ? issue.severity.toString().trim().toLowerCase() : 'major';
  if (!['minor', 'major', 'critical'].includes(severity)) {
    return null; // Invalid severity value
  }

  const status = issue.status ? issue.status.toString().trim().toLowerCase() : 'open';
  if (!['open', 'in-progress', 'testing', 'resolved', 'closed'].includes(status)) {
    return null; // Invalid status value
  }

  let dueDate = null;
  if (issue.dueDate) {
    const parsedDate = Date.parse(issue.dueDate);
    if (isNaN(parsedDate)) {
      return null; // Invalid date
    }
    dueDate = new Date(parsedDate);
  }

  return {
    issueId: issue.issueId.toString().trim(),
    projectId,
    reportedBy,
    assignedTo,
    title: issue.title.toString().trim(),
    description: issue.description ? issue.description.toString().trim() : '',
    priority,
    severity,
    status,
    dueDate
  };
};

export const validateAndSanitizeComment = (comment, validIssueIds, validUserIds) => {
  if (!comment.commentId || !comment.issueId || !comment.userId || !comment.message) {
    return null; // Missing mandatory fields
  }

  const issueId = comment.issueId.toString().trim();
  if (!validIssueIds.has(issueId)) {
    return null; // Invalid issue reference
  }

  const userId = comment.userId.toString().trim();
  if (!validUserIds.has(userId)) {
    return null; // Invalid user reference
  }

  let createdAt = new Date();
  if (comment.createdAt) {
    const parsedDate = Date.parse(comment.createdAt);
    if (!isNaN(parsedDate)) {
      createdAt = new Date(parsedDate);
    }
  }

  return {
    commentId: comment.commentId.toString().trim(),
    issueId,
    userId,
    message: comment.message.toString().trim(),
    createdAt
  };
};

export const validateAndSanitizeActivityLog = (log, validIssueIds, validUserIds) => {
  const logId = log.logId ? log.logId.toString().trim() : null;
  if (!logId || !log.issueId || !log.userId || !log.action || !log.newStatus) {
    return null; // Missing mandatory fields
  }

  const issueId = log.issueId.toString().trim();
  if (!validIssueIds.has(issueId)) {
    return null; // Invalid issue reference
  }

  const userId = log.userId.toString().trim();
  if (!validUserIds.has(userId)) {
    return null; // Invalid user reference
  }

  let timestamp = new Date();
  if (log.timestamp) {
    const parsedDate = Date.parse(log.timestamp);
    if (!isNaN(parsedDate)) {
      timestamp = new Date(parsedDate);
    }
  }

  return {
    logId,
    issueId,
    userId,
    action: log.action.toString().trim(),
    previousStatus: log.previousStatus ? log.previousStatus.toString().trim().toLowerCase() : null,
    newStatus: log.newStatus.toString().trim().toLowerCase(),
    timestamp
  };
};
