import { describe, it, expect } from 'vitest';
import {
  validateAndSanitizeUser,
  validateAndSanitizeProject,
  validateAndSanitizeIssue
} from './sanitizer.js';

describe('Data Sanitizer and Validator Unit Tests', () => {
  
  describe('validateAndSanitizeUser', () => {
    it('should successfully sanitize a valid user', () => {
      const rawUser = {
        userId: ' USR1001 ',
        name: 'Rahul Kumar',
        email: 'Rahul.Kumar@Test.com',
        role: ' ADMIN ',
        department: 'Management',
        status: ' ACTIVE '
      };

      const result = validateAndSanitizeUser(rawUser);
      expect(result).not.toBeNull();
      expect(result.userId).toBe('USR1001');
      expect(result.email).toBe('rahul.kumar@test.com');
      expect(result.role).toBe('admin');
      expect(result.status).toBe('active');
    });

    it('should reject a user with an invalid role', () => {
      const rawUser = {
        userId: 'USR1001',
        name: 'Rahul Kumar',
        email: 'rahul.kumar@test.com',
        role: 'superadmin' // invalid role
      };
      const result = validateAndSanitizeUser(rawUser);
      expect(result).toBeNull();
    });

    it('should reject a user with an invalid email address', () => {
      const rawUser = {
        userId: 'USR1001',
        name: 'Rahul Kumar',
        email: 'invalid-email-format',
        role: 'developer'
      };
      const result = validateAndSanitizeUser(rawUser);
      expect(result).toBeNull();
    });
  });

  describe('validateAndSanitizeProject', () => {
    const validUserIds = new Set(['USR1001', 'USR1002']);

    it('should successfully sanitize a project with valid owner', () => {
      const rawProj = {
        projectId: 'PROJ1001',
        title: '  CRM Portal  ',
        owner: 'USR1001',
        members: ['USR1002', 'USR1999'], // USR1999 is invalid and should be filtered
        status: 'ACTIVE',
        startDate: '2026-01-10'
      };

      const result = validateAndSanitizeProject(rawProj, validUserIds);
      expect(result).not.toBeNull();
      expect(result.title).toBe('CRM Portal');
      expect(result.owner).toBe('USR1001');
      expect(result.members).toContain('USR1002');
      expect(result.members).not.toContain('USR1999');
      expect(result.status).toBe('active');
      expect(result.startDate).toBeInstanceOf(Date);
    });

    it('should reject a project with an invalid owner reference', () => {
      const rawProj = {
        projectId: 'PROJ1001',
        title: 'CRM Portal',
        owner: 'USR9999' // invalid user
      };
      const result = validateAndSanitizeProject(rawProj, validUserIds);
      expect(result).toBeNull();
    });
  });

  describe('validateAndSanitizeIssue', () => {
    const validProjectIds = new Set(['PROJ1001']);
    const validUserIds = new Set(['USR1001', 'USR1002']);

    it('should successfully sanitize an issue', () => {
      const rawIssue = {
        issueId: 'ISS1001',
        projectId: 'PROJ1001',
        reportedBy: 'USR1002',
        assignedTo: 'USR1001',
        title: 'Lead assignment failure',
        priority: ' HIGH ',
        severity: ' MAJOR ',
        status: ' OPEN ',
        dueDate: '2026-06-15'
      };

      const result = validateAndSanitizeIssue(rawIssue, validProjectIds, validUserIds);
      expect(result).not.toBeNull();
      expect(result.issueId).toBe('ISS1001');
      expect(result.priority).toBe('high');
      expect(result.severity).toBe('major');
      expect(result.status).toBe('open');
      expect(result.dueDate).toBeInstanceOf(Date);
    });

    it('should reject an issue referencing an invalid project', () => {
      const rawIssue = {
        issueId: 'ISS1001',
        projectId: 'PROJ9999', // invalid project
        reportedBy: 'USR1001',
        title: 'Bug'
      };
      const result = validateAndSanitizeIssue(rawIssue, validProjectIds, validUserIds);
      expect(result).toBeNull();
    });

    it('should reject an issue with invalid status', () => {
      const rawIssue = {
        issueId: 'ISS1001',
        projectId: 'PROJ1001',
        reportedBy: 'USR1001',
        title: 'Bug',
        status: 'done' // invalid status ('done' is not in allowed status values)
      };
      const result = validateAndSanitizeIssue(rawIssue, validProjectIds, validUserIds);
      expect(result).toBeNull();
    });
  });

});
