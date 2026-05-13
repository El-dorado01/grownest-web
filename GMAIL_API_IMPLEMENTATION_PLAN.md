# Gmail API Implementation Plan for GrowNest Admin Portal

This document outlines the strategy for integrating the Google Gmail API into the GrowNest Admin Portal to create a centralized support communication system.

## 1. Objectives
- Centralize all support emails (`support@grownest.africa`) within the Admin Dashboard.
- Link incoming support threads to registered user accounts automatically.
- Provide a rich interface for reading, replying to, and managing support tickets.
- Enable automated tagging and filtering for efficient ticket resolution.

## 2. Technical Architecture

### A. Authentication & Authorization
- **Google Cloud Console**: Create a project and enable the **Gmail API**.
- **OAuth 2.0**: Use Service Account or User-based OAuth (depending on admin preference).
- **Scopes**: Require `https://www.googleapis.com/auth/gmail.modify` or `https://www.googleapis.com/auth/gmail.readonly` (for reading) and `https://www.googleapis.com/auth/gmail.send` (for replying).

### B. Backend (GrowNest.Africa)
- **Node.js Integration**: Use the official `googleapis` npm package.
- **Webhook/Polling**: 
  - **Google Cloud Pub/Sub**: Recommended for real-time notifications of new emails.
  - **Polling**: Fallback mechanism to sync emails every few minutes.
- **Database Schema**:
  - `SupportTicket`: Stores metadata linking a Gmail thread ID to a `ProfileId`.
  - `SupportMessage`: Optional cache of email bodies for faster rendering and offline access.

### C. Frontend (Admin-GrowNest)
- **Email Portal UI**:
  - **Inbox View**: List of active threads with status badges (New, In Progress, Resolved).
  - **Thread View**: Conversational interface showing the history of emails.
  - **User Context**: Sidebar showing user details (KYC status, balance, recent activity) next to the email.
  - **Editor**: Rich text editor for composing replies with template support.

## 3. Implementation Steps

### Phase 1: Setup & Basic Fetching
1.  Configure Google Cloud project and credentials.
2.  Implement a background worker to fetch messages from the `support@grownest.africa` inbox.
3.  Match sender email addresses with the `Profile` table in the database.

### Phase 2: Real-time Sync & UI
1.  Implement Google Pub/Sub for instant email notifications.
2.  Build the Inbox and Thread views in the Admin frontend.
3.  Add "Quick Reply" templates for common inquiries.

### Phase 3: Advanced Features
1.  Implement attachment support (upload/download via Gmail API).
2.  Add internal notes for admins on specific threads.
3.  Implement "Resolved" status that archives the thread in Gmail.

## 4. Security Considerations
- **Token Management**: Securely store Refresh Tokens in the database (encrypted).
- **Audit Logs**: Log all admin actions taken via the email portal.
- **Access Control**: Restrict the Email Portal to specific Admin roles.

---

*This plan is a living document and should be updated as implementation details evolve.*
