# Chat Request Feature - API Documentation

## Overview

The chat request feature adds a privacy layer to SARS CONNECT, requiring users to send and accept chat requests before they can exchange messages.

## API Endpoints

All endpoints require JWT authentication via cookies.

### Send Chat Request

```http
POST /api/requests
Content-Type: application/json

{
  "recipientId": "user_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "request_id",
    "requester": { "_id": "...", "fullName": "...", "email": "...", "profilePic": "..." },
    "recipient": { "_id": "...", "fullName": "...", "email": "...", "profilePic": "..." },
    "status": "pending",
    "createdAt": "2025-12-04T00:00:00.000Z",
    "updatedAt": "2025-12-04T00:00:00.000Z"
  }
}
```

---

### Get Incoming Requests

```http
GET /api/requests/incoming
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "request_id",
      "requester": { ... },
      "status": "pending",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### Get Outgoing Requests

```http
GET /api/requests/outgoing
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "request_id",
      "recipient": { ... },
      "status": "pending",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### Get Request Status

```http
GET /api/requests/status/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "request_id",
    "requester": { ... },
    "recipient": { ... },
    "status": "accepted",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### Accept Request

```http
POST /api/requests/:id/accept
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "request_id",
    "status": "accepted",
    ...
  }
}
```

---

### Reject Request

```http
POST /api/requests/:id/reject
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "request_id",
    "status": "rejected",
    ...
  }
}
```

---

### Cancel Request

```http
POST /api/requests/:id/cancel
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "request_id",
    "status": "cancelled",
    ...
  }
}
```

---

## Socket.IO Events

### Client → Server

No custom client-to-server events for requests (all actions via REST API).

### Server → Client

#### `request:sent`
Emitted to the recipient when a new chat request is received.

**Payload:**
```json
{
  "_id": "request_id",
  "requester": { ... },
  "recipient": { ... },
  "status": "pending",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### `request:updated`
Emitted when a request is rejected or cancelled.

**Payload:** Same as `request:sent`

#### `request:accepted`
Emitted to both users when a request is accepted.

**Payload:** Same as `request:sent`

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Cannot send request to yourself"
}
```

### 403 Forbidden
```json
{
  "error": "Chat request not accepted",
  "message": "Wait for the recipient to accept your chat request"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "Conversation already exists"
}
```

---

## Request Status Flow

```
pending → accepted (conversation created)
        → rejected (no conversation)
        → cancelled (requester cancels)
```

---

## Backward Compatibility

- Existing conversations (with messages) are automatically marked as "accepted"
- When sending a message, if no request exists but messages do, an accepted request is auto-created
- This ensures existing users can continue chatting without disruption

---

## Testing

### Manual Testing Steps

1. **Send Request Flow:**
   - User A logs in
   - Selects User B from sidebar
   - Clicks "Send Chat Request"
   - Verify request appears in User A's "Outgoing" tab
   - Verify User B receives real-time notification
   - Verify request appears in User B's "Incoming" tab

2. **Accept Request Flow:**
   - User B clicks "Accept" on the request
   - Verify both users can now send messages
   - Verify message input is enabled
   - Verify messages are delivered in real-time

3. **Reject/Cancel Flow:**
   - User B rejects a request → Verify requester is notified
   - User A cancels a pending request → Verify recipient is notified

4. **Edge Cases:**
   - Try sending duplicate request → Should return existing request
   - Try sending message before acceptance → Should show error
   - Try accepting request as non-recipient → Should return 403

### Sample cURL Commands

```bash
# Send request (replace JWT token and IDs)
curl -X POST http://localhost:5001/api/requests \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_JWT_TOKEN" \
  -d '{"recipientId":"USER_ID"}'

# Get incoming requests
curl http://localhost:5001/api/requests/incoming \
  -H "Cookie: jwt=YOUR_JWT_TOKEN"

# Accept request
curl -X POST http://localhost:5001/api/requests/REQUEST_ID/accept \
  -H "Cookie: jwt=YOUR_JWT_TOKEN"
```

---

## UI Components

### RequestsPanel
Modal showing incoming and outgoing requests with tabs.

**Features:**
- Accept/Reject buttons for incoming requests
- Cancel button for outgoing requests
- Real-time updates via socket events
- Timestamp display

### ChatContainer Updates
- Shows "Send Chat Request" button if no request exists
- Shows "Waiting for acceptance" message if request is pending
- Disables message input until request is accepted
- Automatically enables input when request is accepted

### Sidebar Updates
- "Requests" button with notification badge
- Badge shows count of incoming requests
- Opens RequestsPanel on click

---

## Environment Variables

No new environment variables required.

---

## Database Schema

### ConversationRequest Collection

```javascript
{
  requester: ObjectId (ref: User),
  recipient: ObjectId (ref: User),
  status: String (enum: ['pending', 'accepted', 'rejected', 'cancelled', 'blocked']),
  expiresAt: Date (default: 7 days from creation),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- Compound unique index on `(requester, recipient)`
