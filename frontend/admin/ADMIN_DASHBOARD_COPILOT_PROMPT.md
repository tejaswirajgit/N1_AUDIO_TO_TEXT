# Copilot Prompt: Admin Dashboard for Amenity Booking Platform
## Using v0.dev Template (React/Next.js/TailwindCSS)

**Copy the entire prompt below and paste into GitHub Copilot or v0.dev chat:**

---

```
You are an expert React/Next.js frontend engineer tasked with building a complete, 
production-ready Admin Dashboard for an Amenity Booking Platform. This is a property 
manager/owner-facing interface for managing building amenities, bookings, users, and reports.

I have downloaded a v0.dev template (React + Next.js + TailwindCSS) and saved it locally.
The template includes basic layout components (nav, sidebar, cards, tables, forms, modals).

Build ADMIN SIDE ONLY (not resident side). Use the v0 template components as base.

## PROJECT STRUCTURE & ROUTES

### Main Navigation
Route: /admin (admin home/dashboard)
Layout: Sidebar navigation + Top header with user profile

Sidebar Menu Items:
├─ Dashboard (/admin/dashboard)
├─ Bookings (/admin/bookings)
├─ Amenities (/admin/amenities)
├─ Users (/admin/users)
├─ Reports (/admin/reports)
└─ Settings (/admin/settings)

Top Right:
├─ User Profile (Admin Name)
├─ Settings Dropdown (Change Password, Account Details, Logout)
└─ Notifications Bell (optional)

---

## PAGE 1: ADMIN DASHBOARD (/admin/dashboard)

### Overview
Property manager/owner landing page showing key metrics for the day.

### Components Required:

1. **Header Section**
   - Page title: "Dashboard"
   - Date range selector (Today | This Week | This Month) - tabs
   - Quick stats cards (side-by-side, responsive grid)

2. **Stats Cards** (4 cards in grid)
   - Card 1: "Today's Bookings"
     * Large number (e.g., "12")
     * Subtitle: "Confirmed bookings today"
     * Color: Blue (#3B82F6)
   
   - Card 2: "Pending Approvals"
     * Number with warning badge (e.g., "3")
     * Subtitle: "Awaiting admin review"
     * Color: Amber/Yellow (#F59E0B)
   
   - Card 3: "New Reports"
     * Number (e.g., "5")
     * Subtitle: "Complaints/complaints this week"
     * Color: Red (#EF4444)
   
   - Card 4: "Capacity Utilization"
     * Percentage (e.g., "78%")
     * Small progress bar below
     * Color: Green (#10B981)

3. **Today's Bookings Table**
   - Columns: Amenity | User Name | Time Slot | Status | Action
   - Status badges: CONFIRMED (green), PENDING (yellow), CANCELLED (gray)
   - Rows: 5-10 most recent bookings
   - "View More" button links to /admin/bookings

4. **Pending Reports Widget**
   - Title: "Recent Reports"
   - List of 3-5 most recent reports
   - Each item: Report title | Reporter name | "Critical" badge if urgent
   - "View All" button links to /admin/reports

5. **Quick Actions**
   - 2-3 buttons: "Add Amenity", "View All Bookings", "Manage Users"

### Data Mock:
```
Today's Bookings:
- Gym | John Smith | 06:00-07:00 | CONFIRMED
- Pool | Sarah Johnson | 14:00-15:30 | CONFIRMED
- Lounge | Mike Davis | 18:00-19:00 | PENDING

Stats:
- Today's Bookings: 12
- Pending Approvals: 3
- New Reports: 5
- Capacity: 78%
```

---

## PAGE 2: BOOKINGS (/admin/bookings)

### Overview
Admin views all bookings in the building with filter and search capabilities.

### Components Required:

1. **Filter & Search Bar**
   - Search input: "Search by user name, amenity, booking ID..."
   - Date range picker: From date | To date
   - Status filter: Dropdown (All | Confirmed | Pending | Cancelled)
   - Amenity filter: Dropdown (All | Gym | Pool | Lounge | Spa | etc.)
   - "Apply Filters" button
   - "Reset" button

2. **Bookings Table**
   - Columns: Booking ID | Amenity | User | Date | Time | Capacity | Status | Actions
   
   - Booking ID: "BOOK-001", etc. (clickable to view details)
   - Amenity: Name + type icon
   - User: First and last name
   - Date: Format "Mar 4, 2026"
   - Time: "14:00 - 15:00" (show duration)
   - Capacity: "8/30 people" (used/total)
   - Status: Badge (CONFIRMED=green, PENDING=yellow, CANCELLED=gray)
   - Actions: "View Details" button | "Cancel" button | "Edit" button (dropdown menu)

3. **Pagination**
   - Items per page: 10, 25, 50 (dropdown)
   - Page numbers at bottom
   - "Previous" | "Next" buttons

4. **Booking Details Modal**
   - Shows when clicking "View Details"
   - Fields: Booking ID | User Name | User Email | Amenity | Date/Time | Capacity Used | Status | Notes
   - Actions: "Approve" button (if pending) | "Cancel" button | "Edit" button | "Close" button

5. **Edit Booking Modal** (if status is PENDING)
   - Allow admin to: Change time slot | Change date | Approve | Reject with reason

6. **Empty State**
   - If no bookings: "No bookings found" with icon + "Create a booking" button

### Data Mock:
```
Bookings Table:
BOOK-001 | Gym | John Smith | Mar 3 | 06:00-07:00 | 15/30 | CONFIRMED | [Actions]
BOOK-002 | Pool | Sarah J. | Mar 4 | 14:00-15:30 | 8/50 | PENDING | [Actions]
BOOK-003 | Lounge | Mike D. | Mar 4 | 18:00-19:00 | 6/20 | CONFIRMED | [Actions]
```

---

## PAGE 3: AMENITIES (/admin/amenities)

### Overview
Admin manages all amenities: add, edit, delete, view rules and regulations.

### Components Required:

1. **Header Section**
   - Page title: "Amenities"
   - "Add New Amenity" button (primary) - opens modal

2. **Amenities List/Grid**
   - Display: Card view (recommended) or Table view (toggle between them)
   
   **Card View (Responsive Grid: 1 col mobile, 2-3 cols desktop):**
   - Card per amenity showing:
     * Amenity image/icon
     * Amenity name (e.g., "Fitness Center")
     * Type badge (e.g., "GYM")
     * Current capacity: "15/30 people booked today"
     * Operating hours: "06:00 - 22:00"
     * Status toggle: ON/OFF switch (green=active, gray=inactive)
     * Action buttons: "Edit" | "Manage Rules" | "Delete" (in dropdown menu)

3. **Create/Edit Amenity Modal**
   - Title: "Add New Amenity" or "Edit Amenity"
   - Form fields:
     * Amenity Name (text input, required, max 100 chars)
     * Type (dropdown: Gym, Pool, Lounge, Spa, Conference Room, Parking, etc.)
     * Description (textarea, optional, max 500 chars)
     * Capacity (number input, min 1, max 1000, required)
     * Image upload (file input, optional)
     * Operating Hours:
       - Opening Time (time picker, e.g., 06:00)
       - Closing Time (time picker, e.g., 22:00)
     * Status (toggle: Active/Inactive, default Active)
   - Validation:
     * Name required, unique
     * Capacity must be > 0
     * Closing time must be after opening time
   - Buttons: "Save" (primary) | "Cancel"
   - On save: Show success toast, close modal, refresh table

4. **Manage Rules Modal**
   - Title: "Manage Rules - [Amenity Name]"
   - Rule fields (each with inline help text):
     * Min Slot Duration (dropdown: 15 min, 30 min, 1 hour, 90 min, 2 hours)
     * Max Booking Duration (dropdown: 1 hour, 2 hours, 4 hours, 8 hours, All day)
     * Advance Booking Window (number input: 1-365 days, e.g., "7 days in advance")
     * Allow Overlapping Bookings (toggle: Yes/No, default No)
     * Capacity Override (number input, optional - override default capacity for peak times)
     * Booking Approval Required (toggle: Yes/No, default No)
       - If Yes, show message: "All bookings for this amenity require admin approval"
   - Validation: All fields valid before save
   - Buttons: "Save Rules" | "Cancel"
   - On save: Show success toast, close modal

5. **Delete Amenity Confirmation Modal**
   - Warning message: "Are you sure you want to delete [Amenity Name]? This action cannot be undone."
   - Show count of future bookings affected
   - Buttons: "Delete" (danger) | "Cancel"

6. **Empty State**
   - If no amenities: "No amenities yet. Create your first one." + "Add Amenity" button

### Data Mock:
```
Amenities:
1. Fitness Center (GYM)
   - Capacity: 30
   - Hours: 06:00-22:00
   - Today's Bookings: 15
   - Rules: 30-min slots, 2-hour max, 7-day advance booking

2. Swimming Pool (POOL)
   - Capacity: 50
   - Hours: 08:00-20:00
   - Today's Bookings: 30
   - Rules: 1-hour slots, 4-hour max, 14-day advance booking

3. Community Lounge (LOUNGE)
   - Capacity: 20
   - Hours: 10:00-22:00
   - Today's Bookings: 8
   - Rules: 30-min slots, 2-hour max, no advance booking
```

---

## PAGE 4: USERS (/admin/users)

### Overview
Admin views all residents/users living in the building with detailed profiles and search.

### Components Required:

1. **Search & Filter Bar**
   - Search input: "Search by name, user ID, email, phone..."
   - Category filter (dropdown): All | Active | Inactive | Pending | On Leave
   - Sort by (dropdown): Name (A-Z) | Join Date | Rent Due | Maintenance Due
   - "Search" button

2. **Users Table**
   - Columns: User ID | Name | Email | Phone | Apt/Unit | Rent Status | Maintenance Due | Status | Actions
   
   - User ID: Format "USR-001" (clickable to view profile)
   - Name: First and Last Name
   - Email: User email address
   - Phone: Contact number
   - Apt/Unit: Apartment/Unit number (e.g., "A-301")
   - Rent Status: 
     * Green checkmark = "Paid" (on time)
     * Orange warning = "Due [Date]"
     * Red alert = "OVERDUE"
   - Maintenance Due:
     * Green checkmark = "None due"
     * Orange warning = "Due [Date]" (e.g., "Due Mar 15")
     * Red alert = "OVERDUE"
   - Status badge: ACTIVE (green) | INACTIVE (gray) | PENDING (yellow) | ON_LEAVE (blue)
   - Actions: "View Profile" button (opens modal) | "Send Message" | "Suspend" (dropdown)

3. **User Profile Modal**
   - Header: User name + User ID
   - Tabs: Profile | Bookings | Payments | Maintenance
   
   **Profile Tab:**
   - Name | Email | Phone | Apartment | Join Date | Status
   - Action buttons: "Edit" | "Send Reminder" | "Suspend User"
   
   **Bookings Tab:**
   - Recent bookings list (same format as bookings table)
   - "View All Bookings" button
   
   **Payments Tab:**
   - Rent: Due date | Amount | Status (Paid/Due/Overdue)
   - Maintenance fees (if any)
   - Payment history
   
   **Maintenance Tab:**
   - Maintenance requests or issues
   - Status of each request

4. **Pagination**
   - Items per page: 10, 25, 50
   - Page numbers
   - "Previous" | "Next" buttons

5. **Bulk Actions** (optional)
   - Checkboxes on each row
   - Select All checkbox
   - Bulk action dropdown when items selected: "Send Message" | "Send Reminder" | "Suspend"

6. **Empty State**
   - If no users: "No users found. Add a new resident." + "Add User" button

### Data Mock:
```
Users Table:
USR-001 | John Smith | john@email.com | +1-555-0101 | A-301 | Paid ✓ | None | ACTIVE | [Actions]
USR-002 | Sarah Johnson | sarah@email.com | +1-555-0102 | A-302 | Due Mar 15 | Due Mar 20 | ACTIVE | [Actions]
USR-003 | Mike Davis | mike@email.com | +1-555-0103 | A-303 | OVERDUE | OVERDUE | INACTIVE | [Actions]
```

---

## PAGE 5: REPORTS (/admin/reports)

### Overview
Admin views and manages user complaints, requests, announcements, and emergency contacts.

### Components Required:

1. **Filter & Search Bar**
   - Search input: "Search by title, user, description..."
   - Type filter (dropdown): All | Complaint | Request | Announcement | Maintenance
   - Priority filter (dropdown): All | Critical | High | Medium | Low
   - Status filter (dropdown): All | Open | In Progress | Resolved | Closed
   - Date range: From | To
   - "Apply Filters" button | "Reset" button

2. **Reports Table/List**
   - Columns: Report ID | Type | Title | Reported By | Date | Priority | Status | Actions
   
   - Report ID: "REP-001", etc. (clickable)
   - Type: Badge (Complaint=red, Request=blue, Announcement=green, Maintenance=orange)
   - Title: Brief title of report
   - Reported By: User name
   - Date: Created date
   - Priority: Badge (Critical=red, High=orange, Medium=yellow, Low=gray)
   - Status: Badge (Open=blue, In Progress=orange, Resolved=green, Closed=gray)
   - Actions: "View Details" | "Respond" | "Close" (dropdown menu)

3. **Report Details Modal**
   - Header: Report ID | Type | Priority | Status | Created Date
   - Fields:
     * Title
     * Description (full text)
     * Reported By (user name, avatar, contact info clickable)
     * Category/Type
     * Attachments (if any - images/files)
     * Response timeline (admin responses, timestamps)
   
   - Response/Action Section:
     * Text area: "Add a response..." (placeholder)
     * "Add Response" button
     * Previous responses shown above in chronological order
     * Each response: Admin name | Timestamp | Response text
   
   - Status Change:
     * Status dropdown: Open | In Progress | Resolved | Closed
     * "Update Status" button
   
   - Emergency Flag:
     * If marked as Emergency: Show red "🚨 EMERGENCY" badge
     * Ability to mark as emergency

4. **Announcement Creation Modal**
   - Title: "Create Announcement"
   - Form fields:
     * Title (required)
     * Message (textarea, required)
     * Priority (dropdown: Low, Medium, High, Critical)
     * Target Audience (dropdown: All Residents | Select Amenity | Select User Group)
     * Scheduled Send (toggle): Immediate or Schedule for date/time
   - Buttons: "Send" (primary) | "Cancel"
   - Show toast: "Announcement sent to [X] residents"

5. **Emergency Contacts Section** (top of page or separate widget)
   - Emergency Contact Phone
   - Emergency Contact Email
   - Building Manager: Name + Phone
   - Police Non-Emergency
   - Maintenance Emergency Line
   - Each with copy-to-clipboard button + call button

6. **Pagination**
   - Items per page: 10, 25, 50
   - Page numbers
   - "Previous" | "Next" buttons

7. **Empty State**
   - If no reports: "No reports found."

### Data Mock:
```
Reports:
REP-001 | Complaint | Noise in Gym | Sarah J. | Mar 3 | High | Open | [Actions]
REP-002 | Maintenance | Pool heater broken | John S. | Mar 2 | Critical | In Progress | [Actions]
REP-003 | Request | New equipment for gym | Mike D. | Mar 1 | Low | Resolved | [Actions]

Emergency Contacts:
- Police: 911
- Building Manager: +1-555-1000
- Maintenance: +1-555-1001
```

---

## PAGE 6: SETTINGS (/admin/settings)

### Overview
Admin account settings and preferences.

### Components Required:

1. **Header Section**
   - Page title: "Settings"

2. **Settings Tabs/Sections**

   **Account Section:**
   - Admin Name: Text input (editable)
   - Email: Text input (editable, verify if changed)
   - Phone: Text input (editable)
   - Profile Picture: Image upload (circular avatar)
   - "Save Changes" button
   - "Change Password" link (opens modal)

   **Change Password Modal:**
   - Current Password: Password input (required)
   - New Password: Password input (required, validation: min 8 chars, 1 uppercase, 1 number)
   - Confirm Password: Password input (must match)
   - Strength indicator (visual bar: weak/medium/strong)
   - "Update Password" button (primary) | "Cancel"
   - Show toast on success: "Password changed successfully"

   **Building Information Section:**
   - Building Name: Text input
   - Building Address: Text input
   - Building Phone: Text input
   - Manager Name: Text input
   - Building Image: Image upload
   - "Save Changes" button

   **Notification Preferences Section:**
   - Checkboxes:
     * [ ] Email notifications for new bookings
     * [ ] Email notifications for pending approvals
     * [ ] SMS alerts for emergencies
     * [ ] Daily summary report
   - "Save Preferences" button

   **Appearance/Theme Section:**
   - Theme toggle: Light | Dark (radio buttons or toggle)
   - Language dropdown: English | [Other languages if supported]
   - "Save Preferences" button

   **Activity Log Section:**
   - Table showing admin actions (last 20)
   - Columns: Action | Date/Time | IP Address
   - Examples:
     * "Deleted Amenity: Gym" | "Mar 3, 10:30 AM" | "192.168.1.1"
     * "Updated user: John Smith" | "Mar 2, 3:45 PM" | "192.168.1.1"
   - Pagination: 10 items per page

   **Danger Zone Section:** (at bottom, red background)
   - "Suspend Account" button (with confirmation)
   - "Delete Account" button (with confirmation + warning)

3. **Success/Error Messages**
   - Show toast notifications for all saves

---

## GLOBAL COMPONENTS (All Pages)

### 1. **Top Header**
- Left: Logo/Building Name + "AMENITY ADMIN"
- Center: Current page title
- Right:
  * Admin Name (e.g., "John Manager")
  * User avatar (circular image)
  * Dropdown menu:
    - Profile
    - Settings
    - Logout
  * Notifications bell (optional, shows unread count)

### 2. **Sidebar Navigation**
- Collapsible/responsive (hamburger on mobile)
- Menu items with icons:
  * Dashboard
  * Bookings
  * Amenities
  * Users
  * Reports
  * Settings
- Active item highlighted
- On mobile: Collapse to icons only

### 3. **Common UI Elements**
- Buttons: Primary (blue) | Secondary (gray) | Danger (red)
- Cards: Rounded corners, subtle shadow
- Tables: Striped rows, hover effect, responsive (scroll on mobile)
- Modals: Centered, backdrop blur, close button, keyboard escape
- Toast notifications: Top-right corner, auto-dismiss
- Loading spinners: Center page with text
- Empty states: Icon + message + CTA button

### 4. **Color Scheme**
- Primary: Blue #3B82F6
- Success: Green #10B981
- Warning: Amber #F59E0B
- Danger: Red #EF4444
- Neutral: Gray #6B7280
- Background: White #FFFFFF or Light Gray #F9FAFB

### 5. **Responsive Design**
- Mobile: Single column, stacked cards, bottom sheet modals
- Tablet: 2-column layout
- Desktop: Full multi-column layout
- All components must work on 320px+ widths

---

## DATA STRUCTURE (Mock Data Examples)

### Booking Model:
```javascript
{
  id: "BOOK-001",
  amenityId: "GYM-001",
  amenityName: "Fitness Center",
  userId: "USR-001",
  userName: "John Smith",
  date: "2026-03-04",
  startTime: "06:00",
  endTime: "07:00",
  capacity: "15/30",
  status: "CONFIRMED",
  createdAt: "2026-03-03T10:00:00Z",
  notes: ""
}
```

### Amenity Model:
```javascript
{
  id: "GYM-001",
  name: "Fitness Center",
  type: "GYM",
  description: "Modern gym with cardio and weights",
  capacity: 30,
  image: "url-to-image",
  openingTime: "06:00",
  closingTime: "22:00",
  isActive: true,
  rules: {
    minSlotDuration: 30,
    maxBookingDuration: 120,
    advanceBookingDays: 7,
    allowOverlapping: false,
    capacityOverride: null,
    approvalRequired: false
  },
  createdAt: "2026-01-01T00:00:00Z"
}
```

### User Model:
```javascript
{
  id: "USR-001",
  name: "John Smith",
  email: "john@email.com",
  phone: "+1-555-0101",
  apartmentNumber: "A-301",
  joinDate: "2025-01-15",
  status: "ACTIVE",
  rentStatus: "PAID",
  rentDueDate: "2026-04-01",
  maintenanceDue: null,
  avatar: "url-to-image"
}
```

### Report Model:
```javascript
{
  id: "REP-001",
  type: "COMPLAINT",
  title: "Noise in Gym during evening",
  description: "The gym is too noisy after 8 PM...",
  reportedBy: "Sarah Johnson",
  userId: "USR-002",
  date: "2026-03-03T15:00:00Z",
  priority: "HIGH",
  status: "OPEN",
  attachments: ["image1.jpg"],
  responses: [
    {
      adminName: "John Manager",
      timestamp: "2026-03-03T16:00:00Z",
      message: "Thank you for reporting. We will investigate."
    }
  ]
}
```

---

## BUILD ORDER (Fastest Path)

### Phase 1: Layout & Navigation (Day 1)
1. Main layout with sidebar + top header
2. All page routes created (empty)
3. Navigation between pages working
4. User profile dropdown

### Phase 2: Dashboard (Day 1-2)
1. Dashboard page with stats cards
2. Today's bookings widget
3. Pending reports widget
4. Quick action buttons

### Phase 3: Bookings (Day 2-3)
1. Bookings table with mock data
2. Filters & search working
3. Booking details modal
4. Edit/cancel functionality

### Phase 4: Amenities (Day 3-4)
1. Amenity card grid or table
2. Create amenity modal
3. Edit amenity modal
4. Manage rules modal
5. Delete confirmation

### Phase 5: Users (Day 4-5)
1. Users table with mock data
2. Search & filters working
3. User profile modal
4. Bulk actions (optional)

### Phase 6: Reports (Day 5-6)
1. Reports table with filters
2. Report details modal
3. Response/comment system
4. Announcement creation
5. Emergency contacts display

### Phase 7: Settings (Day 6)
1. Account settings form
2. Change password modal
3. Building info section
4. Notification preferences
5. Activity log
6. Danger zone

### Phase 8: Polish & Responsive (Day 7+)
1. Mobile responsive design audit
2. Loading states + error handling
3. Toast notifications
4. Empty states
5. Accessibility review

---

## IMPLEMENTATION NOTES

### Use v0 Template Components:
- Card, Table, Button, Input, Select, Modal, Toast, etc.
- Extend/customize as needed with TailwindCSS
- Keep styling consistent with v0 theme

### API Integration (Mock First, Replace Later):
- Use React Query (useQuery, useMutation) for data fetching
- Mock endpoints first with localStorage or JSON
- Replace with real API endpoints later
- Example:
  ```javascript
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings,
  });
  ```

### State Management:
- Use React state for form inputs
- Use React Query for server state (bookings, amenities, users, reports)
- Use localStorage for user preferences (theme, sidebar state)

### Validation:
- Client-side validation on all forms
- Show field-level error messages
- Disable submit button until valid

### Error Handling:
- Try-catch for API calls
- Show error toast if fails
- Retry button for failed requests

### Loading States:
- Show skeleton loaders for tables
- Show spinner for modals
- Disable buttons while saving

---

## EXAMPLE COMPONENTS TO GENERATE

### 1. Start with: AdminLayout Component
```
File: components/AdminLayout.tsx
Purpose: Main layout wrapper with sidebar + top nav
Props: children
Renders: Sidebar | TopNav | Main content area
```

### 2. Then: Dashboard Page
```
File: app/admin/dashboard/page.tsx
Purpose: Admin dashboard landing page
Components: StatsCards, TodayBookingsWidget, PendingReportsWidget
```

### 3. Then: Bookings Page
```
File: app/admin/bookings/page.tsx
Purpose: View and manage bookings
Components: BookingsTable, BookingFilters, BookingDetailsModal
```

(Continue for Amenities, Users, Reports, Settings)

---

## TESTING CHECKLIST

- [ ] All pages load without errors
- [ ] Navigation between pages works
- [ ] All modals open/close correctly
- [ ] Form validation works
- [ ] Filters and search functional
- [ ] Responsive design works on mobile
- [ ] Mock data displays correctly
- [ ] All buttons have hover/active states
- [ ] Toast notifications appear
- [ ] Empty states show when no data
- [ ] Loading states display while fetching

---

## DEPLOYMENT READY CHECKLIST

- [ ] All TypeScript types defined
- [ ] No console errors or warnings
- [ ] Accessibility review passed (tab navigation, ARIA labels)
- [ ] Performance optimized (lazy loading, code splitting)
- [ ] SEO friendly (meta tags, structured data)
- [ ] All assets optimized (images compressed)
- [ ] Environment variables configured
- [ ] Error boundaries added
- [ ] Analytics integrated (optional)
- [ ] Ready for production deployment

---

## NEXT STEPS

1. **Generate AdminLayout component** first (foundation for all pages)
2. **Generate Dashboard page** (landing page)
3. **Generate Bookings page** (most complex)
4. **Generate remaining pages in order** (Amenities, Users, Reports, Settings)
5. **Integrate with real API** (replace mock data)
6. **Test on real devices** (mobile, tablet, desktop)
7. **Deploy to staging** for admin user testing
8. **Iterate based on feedback**

---

**You're ready to generate the admin dashboard. Start with AdminLayout, then ask follow-up questions for each page. Good luck! 🚀**
```

---

## HOW TO USE THIS PROMPT

### Step 1: Open GitHub Copilot or v0.dev Chat
- Copy the entire prompt above (everything between the triple backticks)
- Paste into GitHub Copilot Chat (Ctrl+Shift+I in VS Code)
- OR paste into v0.dev template chat interface

### Step 2: Ask Copilot to Start
Send this message after pasting the prompt:
```
Build the AdminLayout component first.

It should include:
1. Sidebar with navigation items (Dashboard, Bookings, Amenities, Users, Reports, Settings)
2. Top header with logo, page title, user profile dropdown
3. Main content area for page content
4. Responsive: Hamburger menu on mobile, full sidebar on desktop
5. Icons for each menu item
6. Highlight active page

Use TailwindCSS for styling. Make it look professional.
```

### Step 3: Follow-Up Prompts (After AdminLayout is generated)

```
Now generate the Dashboard page (/admin/dashboard).

Include:
1. Header with "Dashboard" title
2. Date range tabs (Today, This Week, This Month)
3. Four stat cards (Today's Bookings, Pending Approvals, New Reports, Capacity Utilization)
4. Today's Bookings table (5-10 rows)
5. Recent Reports widget (3-5 items)
6. Quick action buttons

Use the mock data I provided. Make it responsive.
```

```
Now generate the Bookings page (/admin/bookings).

Include:
1. Search and filter bar (search, date range, status, amenity)
2. Bookings table (columns: Booking ID, Amenity, User, Date, Time, Capacity, Status, Actions)
3. Pagination (10 items per page)
4. Booking Details modal (opens when clicking View Details)
5. Edit modal (if status is PENDING)
6. Responsive table (scrollable on mobile)

Use mock data. All filters should work.
```

```
Now generate the Amenities page (/admin/amenities).

Include:
1. "Add New Amenity" button
2. Amenity cards in grid (3 columns on desktop, 1 on mobile)
3. Each card: Name, Type, Capacity, Hours, Status toggle, Actions menu
4. Create/Edit Amenity modal (form with all fields)
5. Manage Rules modal (for each amenity)
6. Delete confirmation modal
7. All CRUD operations functional

Use mock data. Make modals beautiful with validation.
```

Continue this pattern for each page...

---

## 🎯 Key Copilot Conversation Tips

**DO:**
- ✅ Ask for one page/component at a time
- ✅ Be specific about fields, columns, buttons
- ✅ Request specific styling/colors from your palette
- ✅ Ask for responsive design explicitly
- ✅ Request validation + error handling
- ✅ Ask Copilot to add TypeScript types
- ✅ Request mock data to be included

**DON'T:**
- ❌ Ask for entire app at once
- ❌ Vague requests like "make it look good"
- ❌ Skip responsive design ("desktop only")
- ❌ Forget to ask about form validation
- ❌ Mix multiple pages in one prompt

**Example Good Request:**
```
Generate the Users page with:
- Search input + filter dropdown (status, sort by)
- Table: User ID, Name, Email, Phone, Apt, Rent Status, Maintenance, Status, Actions
- User Profile modal with tabs (Profile, Bookings, Payments)
- Pagination (10 items/page)
- Mobile responsive (table converts to cards on small screens)
- All buttons should have hover effects
- Show loading spinner while fetching
```

**Example Bad Request:**
```
Build the users page
```

---

**Ready to generate? Paste this prompt into Copilot and start building! 🚀**

