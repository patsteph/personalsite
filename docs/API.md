# API Documentation

## 📋 Overview

This document provides comprehensive documentation for all API endpoints in the Personal Website application. All endpoints are built with Next.js API routes and follow RESTful conventions.

### Base Information

- **Base URL:** `/api`
- **Authentication:** Firebase JWT tokens
- **Content Type:** `application/json`
- **Rate Limiting:** Implemented on all endpoints
- **Security:** Input validation, sanitization, and OWASP compliance

## 🔐 Authentication

### Authentication Methods

All protected endpoints require authentication via Firebase JWT tokens.

#### Header Authentication (Recommended)

```http
Authorization: Bearer <firebase_jwt_token>
```

#### Cookie Authentication (Fallback)

```http
Cookie: fb_token=<firebase_jwt_token>
```

### Authentication Endpoints

#### POST `/api/auth`

Authenticate user and establish session.

**Request Body:**

```json
{
  "idToken": "firebase_jwt_token",
  "sessionCookie": true
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "uid": "user_id",
    "email": "user@example.com",
    "role": "user|admin"
  }
}
```

#### GET `/api/auth/me`

Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "user": {
    "uid": "user_id",
    "email": "user@example.com",
    "displayName": "User Name",
    "role": "user|admin"
  }
}
```

#### POST `/api/auth/validate`

Validate authentication token.

**Request Body:**

```json
{
  "token": "firebase_jwt_token"
}
```

**Response:**

```json
{
  "success": true,
  "valid": true,
  "user": {
    "uid": "user_id",
    "email": "user@example.com"
  }
}
```

#### POST `/api/auth/signout`

Sign out current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

## 📝 Blog Endpoints

### GET `/api/blog`

Get list of blog posts.

**Query Parameters:**

- `published` (boolean) - Filter by published status
- `limit` (number) - Number of posts to return
- `offset` (number) - Pagination offset

**Response:**

```json
{
  "success": true,
  "posts": [
    {
      "id": "post_id",
      "title": "Post Title",
      "slug": "post-slug",
      "content": "Post content...",
      "published": true,
      "publishedAt": "2025-01-01T00:00:00Z",
      "tags": ["tag1", "tag2"],
      "reactions": {
        "likes": 10,
        "dislikes": 1
      }
    }
  ],
  "total": 25,
  "hasMore": true
}
```

### POST `/api/blog`

Create new blog post (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**

```json
{
  "title": "New Post Title",
  "slug": "new-post-slug",
  "content": "Post content in markdown...",
  "published": false,
  "tags": ["tag1", "tag2"],
  "metaDescription": "SEO description"
}
```

**Response:**

```json
{
  "success": true,
  "post": {
    "id": "new_post_id",
    "title": "New Post Title",
    "slug": "new-post-slug",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### POST `/api/blog-post`

Handle blog post interactions (reactions, visits).

**Request Body:**

```json
{
  "action": "increment|decrement|visit",
  "postId": "post_id",
  "reactionType": "like|dislike"
}
```

**Response:**

```json
{
  "success": true,
  "reactions": {
    "likes": 11,
    "dislikes": 1
  },
  "visits": 150
}
```

### POST `/api/generate-summary`

Generate AI summary for blog post (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**

```json
{
  "postId": "post_id",
  "content": "Full blog post content for summarization..."
}
```

**Response:**

```json
{
  "success": true,
  "summary": "AI-generated concise summary of the blog post..."
}
```

## 📚 Books Endpoints

### GET `/api/books`

Get user's book collection.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `status` (string) - Filter by reading status: `want-to-read|reading|read`
- `category` (string) - Filter by book category
- `search` (string) - Search in title and author

**Response:**

```json
{
  "success": true,
  "books": [
    {
      "id": "book_id",
      "title": "Book Title",
      "author": "Author Name",
      "isbn": "978-0123456789",
      "status": "read",
      "rating": 5,
      "notes": "Personal reading notes",
      "dateAdded": "2025-01-01T00:00:00Z",
      "dateRead": "2025-01-15T00:00:00Z",
      "coverImage": "https://covers.example.com/book.jpg",
      "categories": ["fiction", "sci-fi"]
    }
  ],
  "stats": {
    "totalBooks": 150,
    "booksRead": 120,
    "currentlyReading": 3,
    "wantToRead": 27
  }
}
```

### POST `/api/books`

Add new book to collection.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "title": "New Book Title",
  "author": "Author Name",
  "isbn": "978-0123456789",
  "status": "want-to-read",
  "rating": null,
  "notes": "",
  "categories": ["fiction"]
}
```

**Response:**

```json
{
  "success": true,
  "book": {
    "id": "new_book_id",
    "title": "New Book Title",
    "dateAdded": "2025-01-01T00:00:00Z"
  }
}
```

### GET `/api/public-books`

Get publicly visible book collection.

**No authentication required**

**Response:**

```json
{
  "success": true,
  "books": [
    {
      "title": "Public Book",
      "author": "Author Name",
      "rating": 5,
      "status": "read",
      "categories": ["fiction"]
    }
  ],
  "stats": {
    "totalBooks": 150,
    "favoriteGenres": ["fiction", "sci-fi", "biography"]
  }
}
```

### GET `/api/google-books`

Search Google Books API.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `q` (string) - Search query (title, author, etc.)
- `isbn` (string) - ISBN search
- `maxResults` (number) - Maximum results (1-40, default: 10)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "googleBooksId": "google_id",
      "title": "Book Title",
      "authors": ["Author Name"],
      "publisher": "Publisher",
      "publishedDate": "2023",
      "description": "Book description...",
      "pageCount": 300,
      "categories": ["Fiction"],
      "averageRating": 4.2,
      "imageLinks": {
        "thumbnail": "https://books.google.com/thumbnail.jpg"
      }
    }
  ]
}
```

## 📰 Signals Endpoints

### GET `/api/signals`

Get signals (newsletters/articles).

**Query Parameters:**

- `type` (string) - Filter by type: `newsletter|article`
- `id` (string) - Get specific signal by ID

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "signal_id",
      "title": "Signal Title",
      "type": "newsletter",
      "url": "https://example.com/signal",
      "description": "Signal description",
      "author": "Author Name",
      "publishedDate": "2025-01-01",
      "tags": ["tech", "ai"],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/signals`

Create new signal (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**

```json
{
  "title": "New Signal Title",
  "type": "newsletter",
  "url": "https://example.com/signal",
  "description": "Signal description",
  "author": "Author Name",
  "publishedDate": "2025-01-01",
  "tags": ["tech", "ai"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "new_signal_id",
    "title": "New Signal Title",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### DELETE `/api/signals`

Delete signal (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**

- `id` (string, required) - Signal ID to delete

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "deleted_signal_id"
  }
}
```

## 📊 Analytics & Monitoring

### GET `/api/site-stats`

Get public site statistics.

**No authentication required**

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalPosts": 25,
    "totalBooks": 150,
    "totalSignals": 50,
    "lastUpdated": "2025-01-01T00:00:00Z"
  }
}
```

### GET `/api/admin/dashboard-stats`

Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**

```json
{
  "success": true,
  "stats": {
    "posts": {
      "total": 25,
      "published": 20,
      "drafts": 5,
      "thisMonth": 3
    },
    "books": {
      "total": 150,
      "read": 120,
      "reading": 3,
      "wantToRead": 27
    },
    "signals": {
      "total": 50,
      "newsletters": 30,
      "articles": 20
    },
    "analytics": {
      "pageViews": 10000,
      "uniqueVisitors": 2500,
      "avgSessionDuration": 180
    }
  }
}
```

### POST `/api/analytics/performance`

Submit performance metrics.

**Request Body:**

```json
{
  "url": "/current-page",
  "metrics": {
    "FCP": 1200,
    "LCP": 2500,
    "FID": 50,
    "CLS": 0.1,
    "TTFB": 800
  },
  "userAgent": "Mozilla/5.0...",
  "connection": "4g"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Metrics recorded"
}
```

## 🔧 Admin Endpoints

### GET `/api/admin/cv`

Get CV data for editing.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**

```json
{
  "success": true,
  "cv": {
    "personal": {
      "name": "Full Name",
      "title": "Job Title",
      "email": "email@example.com",
      "location": "City, Country"
    },
    "experience": [
      {
        "company": "Company Name",
        "position": "Job Title",
        "startDate": "2020-01",
        "endDate": "2023-12",
        "description": "Job description..."
      }
    ],
    "education": [...],
    "skills": [...]
  }
}
```

### POST `/api/admin/cv`

Update CV data.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:** Same structure as GET response

**Response:**

```json
{
  "success": true,
  "message": "CV updated successfully"
}
```

## 💬 Feedback & AI

### POST `/api/feedback`

Submit user feedback.

**Request Body:**

```json
{
  "category": "bug|feature|general",
  "feedback": "User feedback message",
  "page": "/current-page",
  "sessionId": "session_id",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "id": "feedback_id"
}
```

### POST `/api/ai/blog-assistant`

Get AI assistance for blog writing.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**

```json
{
  "prompt": "Write an introduction about...",
  "context": "Additional context for AI",
  "type": "introduction|conclusion|outline|improvement"
}
```

**Response:**

```json
{
  "success": true,
  "content": "AI-generated content based on prompt",
  "suggestions": ["Additional suggestion 1", "Additional suggestion 2"]
}
```

### POST `/api/ai/book-recommendations`

Get AI book recommendations.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "preferences": {
    "genres": ["fiction", "sci-fi"],
    "authors": ["Author Name"],
    "recentBooks": ["book1", "book2"]
  },
  "count": 5
}
```

**Response:**

```json
{
  "success": true,
  "recommendations": [
    {
      "title": "Recommended Book",
      "author": "Author Name",
      "reason": "Based on your reading of...",
      "confidence": 0.85
    }
  ]
}
```

## 🔍 Monitoring Endpoints

### GET `/api/monitoring/health`

Application health check.

**No authentication required**

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "auth": "healthy",
    "storage": "healthy"
  },
  "version": "2.0.0"
}
```

### POST `/api/monitoring/errors`

Report application errors.

**Request Body:**

```json
{
  "error": {
    "message": "Error message",
    "stack": "Error stack trace",
    "url": "/page-where-error-occurred",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

**Response:**

```json
{
  "success": true,
  "errorId": "error_tracking_id"
}
```

### POST `/api/monitoring/security`

Report security events.

**Request Body:**

```json
{
  "event": {
    "type": "failed_auth|suspicious_activity|rate_limit",
    "details": "Event details",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

**Response:**

```json
{
  "success": true,
  "eventId": "security_event_id"
}
```

## 📋 Error Handling

### Standard Error Response

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error",
    "validation": ["Validation error details"]
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Common Error Codes

- `INVALID_INPUT` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

## 🔒 Security Features

### Input Validation

- **Zod Schemas:** All inputs validated with TypeScript schemas
- **Sanitization:** XSS protection and input cleaning
- **Type Safety:** TypeScript ensures type correctness
- **Length Limits:** Prevents oversized payloads

### Rate Limiting

- **Per IP:** 100 requests per minute
- **Per User:** 1000 requests per hour (authenticated)
- **Admin Endpoints:** 50 requests per minute
- **Feedback:** 10 submissions per hour

### CORS Configuration

```javascript
{
  "origin": "https://yourdomain.com",
  "methods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["Authorization", "Content-Type"],
  "credentials": true
}
```

## 🧪 Testing API Endpoints

### Using curl

```bash
# Get public books
curl -X GET "https://yoursite.com/api/public-books"

# Authenticate and get user books
curl -X GET "https://yoursite.com/api/books" \
  -H "Authorization: Bearer your_jwt_token"

# Create blog post
curl -X POST "https://yoursite.com/api/blog" \
  -H "Authorization: Bearer admin_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","content":"Content..."}'
```

### Using JavaScript fetch

```javascript
// Get authenticated data
const response = await fetch("/api/books", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
const data = await response.json();

// Post data with validation
const createBook = async (bookData) => {
  const response = await fetch("/api/books", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookData),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
};
```

## 📊 API Metrics

### Performance Targets

- **Response Time:** < 200ms for GET requests
- **Throughput:** 1000+ requests per minute
- **Availability:** 99.9% uptime
- **Error Rate:** < 0.1% for 5xx errors

### Monitoring Dashboard

Access real-time API metrics at `/admin/analytics`:

- Request volume and response times
- Error rates and status codes
- Authentication success/failure rates
- Rate limiting statistics

---

**Last Updated:** January 2025  
**API Version:** 2.0  
**Authentication:** Firebase JWT  
**Security Grade:** A (OWASP Compliant)
