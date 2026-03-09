# Admin API Guide - Amenity Booking Application

## 🔐 Authentication
All admin endpoints require the `X-Admin-API-Key` header:
```
X-Admin-API-Key: YTKqy-pm8NBJscBDZy9DbyuIlFhYbK7YBPYKRxpNHIw
```

## 📋 Admin Endpoints

### 1. List All Users
**GET** `/v1/admin/users`

**Response:**
```json
{
  "users": [
    {
      "auth_user_id": "9b9bd11c-e8f9-43fe-ba4e-b0c8e87d0491",
      "resident_id": "RES001",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+1-555-0123",
      "apartment": "A-101",
      "role": "resident",
      "status": "ACTIVE",
      "created_at": "2026-03-01T10:00:00Z",
      "email_confirmed_at": "2026-03-01T10:15:00Z",
      "last_sign_in_at": "2026-03-08T09:30:00Z"
    }
  ]
}
```

---

### 2. Create New User (Send Invitation)
**POST** `/v1/admin/users`

**Request Body:**
```json
{
  "resident_id": "RES002",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-0124",
  "apartment": "B-205",
  "role": "resident"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation email sent. The user will receive a link to set their password.",
  "temporary_password": "(set via email link)",
  "user": {
    "auth_user_id": "abc123...",
    "resident_id": "RES002",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1-555-0124",
    "apartment": "B-205",
    "role": "resident",
    "status": "INVITED"
  }
}
```

---

### 3. ✨ **NEW** Update User Profile
**PUT** `/v1/admin/users/{user_id}`

**Parameters:**
- `user_id` - The auth_user_id (UUID) of the user to update

**Request Body (all fields optional):**
```json
{
  "name": "John Smith Jr.",
  "email": "newemail@example.com",
  "phone": "+1-555-9999",
  "apartment": "A-102",
  "role": "admin",
  "status": "ACTIVE"
}
```

**Fields:**
- `name` - User's full name
- `email` - Email address (must be unique)
- `phone` - Phone number
- `apartment` - Apartment/unit number
- `role` - One of: `admin`, `resident`, `user`
- `status` - One of: `ACTIVE`, `SUSPENDED`, `INACTIVE`

**Response:**
```json
{
  "success": true,
  "message": "User profile updated successfully.",
  "user": {
    "auth_user_id": "9b9bd11c-e8f9-43fe-ba4e-b0c8e87d0491",
    "resident_id": "RES001",
    "name": "John Smith Jr.",
    "email": "newemail@example.com",
    "phone": "+1-555-9999",
    "apartment": "A-102",
    "role": "admin",
    "status": "ACTIVE",
    "created_at": "2026-03-01T10:00:00Z"
  }
}
```

**What Gets Updated:**
- ✅ Supabase auth user metadata (name, phone, apartment, role)
- ✅ Supabase auth email (if changed)
- ✅ Database tables: `users` and `profiles` (if they exist)
- ✅ User status (ACTIVE = unbanned, SUSPENDED/INACTIVE = banned)

---

## 🧪 Testing Examples

### Using cURL (Windows)
```powershell
# List users
curl http://127.0.0.1:8000/v1/admin/users ^
  -H "X-Admin-API-Key: YTKqy-pm8NBJscBDZy9DbyuIlFhYbK7YBPYKRxpNHIw"

# Update user
curl -X PUT http://127.0.0.1:8000/v1/admin/users/9b9bd11c-e8f9-43fe-ba4e-b0c8e87d0491 ^
  -H "Content-Type: application/json" ^
  -H "X-Admin-API-Key: YTKqy-pm8NBJscBDZy9DbyuIlFhYbK7YBPYKRxpNHIw" ^
  -d "{\"name\":\"Updated Name\",\"phone\":\"+1-555-8888\"}"
```

### Using PowerShell
```powershell
# Update user
$headers = @{
    "Content-Type" = "application/json"
    "X-Admin-API-Key" = "YTKqy-pm8NBJscBDZy9DbyuIlFhYbK7YBPYKRxpNHIw"
}

$body = @{
    name = "Updated Name"
    phone = "+1-555-8888"
    apartment = "C-301"
} | ConvertTo-Json

Invoke-RestMethod -Method PUT `
  -Uri "http://127.0.0.1:8000/v1/admin/users/9b9bd11c-e8f9-43fe-ba4e-b0c8e87d0491" `
  -Headers $headers `
  -Body $body
```

### From Frontend (Next.js API Route)
```typescript
// Call: PUT /api/admin/users/[user_id]
const response = await fetch(`/api/admin/users/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Updated Name',
    phone: '+1-555-8888',
    role: 'admin'
  })
});

const result = await response.json();
console.log(result.message); // "User profile updated successfully."
```

---

## 📊 API Documentation

Visit: **http://127.0.0.1:8000/docs**

Interactive Swagger UI with all endpoints and schemas.

---

## ⚠️ Error Handling

**400 Bad Request:**
```json
{
  "detail": "At least one field must be provided for update."
}
```

**401 Unauthorized:**
```json
{
  "detail": "Invalid or missing admin API key."
}
```

**404 Not Found:**
```json
{
  "detail": "User not found after update."
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Unable to update user metadata: [error details]"
}
```

---

## 🔧 Configuration

Make sure these are set in `backend/.env`:
```env
ADMIN_API_KEY=YTKqy-pm8NBJscBDZy9DbyuIlFhYbK7YBPYKRxpNHIw
SUPABASE_URL=https://vobavbcusbhsluovxwfw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

Frontend config in `frontend/admin/.env.local`:
```env
ADMIN_API_BASE_URL=http://127.0.0.1:8000
ADMIN_API_KEY=YTKqy-pm8NBJscBDZy9DbyuIlFhYbK7YBPYKRxpNHIw
```

---

## 🚀 Other Admin Endpoints

### Create/Update Amenity
**POST** `/v1/admin/amenities`

### Update Amenity Rules
**POST** `/v1/admin/rules`

See full documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
