# 🚗 CarRental Project Architecture & Context Report

This document serves as a comprehensive technical blueprint of the **CarRental** platform. It has been curated to be copied and pasted directly into **ChatGPT, Gemini, Claude, or other LLMs** as a system prompt / codebase context. Sharing this document with an LLM will instantly give it a detailed understanding of the MERN architecture, database schemas, API endpoints, payment logic, and UI routing, allowing it to write precise, context-aware code and debug issues effectively.

---

## 🏗️ 1. Technical Stack Overview
*   **Frontend**: React 19 (Vite-powered), React Router v7 (`react-router-dom`).
*   **State & Fetching**: React Context API (`AppContext.jsx`) handles global auth & modal UI states; TanStack Query handles component-level data queries and mutations. Axios is used for all HTTP requests.
*   **Styling & Motion**: Tailwind CSS 4 for utility-first responsive layout; Framer Motion (`motion`) for smooth animations and transitions.
*   **Backend**: Node.js & Express.js REST API.
*   **Database**: MongoDB with Mongoose ODM (utilizes compound indexes for performance).
*   **Authentication**: JWT-based bearer authentication with custom route-guard middleware.
*   **Payments**: Razorpay SDK (Test Mode) with backend signature-verification checks.
*   **Image Hosting**: Multer (file parsing) + ImageKit.io SDK for secure, fast cloud image hosting.

---

## 🗃️ 2. Database Models & Schema Definitions

### 👤 User Model (`server/models/User.js`)
```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["owner", "user"],
        default: "user"
    },
    image: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
```

### 🚗 Car Model (`server/models/Car.js`)
```javascript
import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const carSchema = new mongoose.Schema({
  owner: { type: ObjectId, ref: 'User' },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  image: { type: String, required: true },
  year: { type: Number, required: true },
  category: { type: String, required: true },
  seating_capacity: { type: Number, required: true },
  fuel_type: { type: String, required: true },
  transmission: { type: String, required: true },
  pricePerDay: { type: Number, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Car", carSchema);
```

### 📅 Booking Model (`server/models/Booking.js`)
```javascript
import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const bookingSchema = new mongoose.Schema({
    car:         { type: ObjectId, ref: "Car",  required: true },
    user:        { type: ObjectId, ref: "User", required: true },
    owner:       { type: ObjectId, ref: "User", required: true },
    pickupDate:  { type: Date, required: true },
    returnDate:  { type: Date, required: true },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending"
    },
    price: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod:     { type: String, default: 'razorpay' },
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },
    paidAt:            { type: Date }
}, { timestamps: true });

// Compound indexes optimized for lookup performance
bookingSchema.index({ car: 1, pickupDate: 1, returnDate: 1 });
bookingSchema.index({ owner: 1, createdAt: -1 });
bookingSchema.index({ user:  1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
```

---

## 🛣️ 3. Backend Routes & API Reference

| Endpoint | Method | Middleware | Controller Action | Purpose |
| :--- | :---: | :--- | :--- | :--- |
| **User & Auth** | | | | |
| `/api/user/register` | `POST` | None | `registerUser` | Registers a new account |
| `/api/user/login` | `POST` | None | `loginUser` | Authenticates user and returns JWT token |
| `/api/user/data` | `GET` | `protect` | `getUserData` | Returns current user profile |
| `/api/user/cars` | `GET` | None | `getCars` | Gets all cars with optional search query |
| **Owner Dashboard** | | | | |
| `/api/owner/change-role` | `POST` | `protect` | `changeRoleToOwner` | Toggles standard user into a Fleet Owner |
| `/api/owner/add-car` | `POST` | `protect`, `isOwner`, `upload.single("image")` | `addCar` | Uploads image to ImageKit and saves vehicle specs |
| `/api/owner/cars` | `GET` | `protect`, `isOwner` | `getOwnerCars` | Returns cars listed by current owner |
| `/api/owner/toggle-car` | `POST` | `protect`, `isOwner` | `toggleCarAvailability` | Toggles vehicle availability status (`isAvailable`) |
| `/api/owner/delete-car` | `POST` | `protect`, `isOwner` | `deleteCar` | Deletes a car listing from the fleet |
| `/api/owner/dashboard` | `GET` | `protect`, `isOwner` | `getDashboardData` | Summarizes earnings, booking status stats, and totals |
| `/api/owner/update-image` | `POST` | `protect`, `isOwner`, `upload.single("image")` | `updateUserImage` | Updates the owner profile image on ImageKit |
| **Bookings** | | | | |
| `/api/bookings/check-availability` | `POST` | `protect` | `checkAvailabilityOfCar` | Scans date overlaps to confirm vehicle availability |
| `/api/bookings/create` | `POST` | `protect`, `createLimiter`, `validate(schema)` | `createBooking` | Submits a new rental request |
| `/api/bookings/user` | `GET` | `protect` | `getUserBookings` | Returns list of bookings placed by active user |
| `/api/bookings/owner` | `GET` | `protect`, `isOwner` | `getOwnerBookings` | Returns bookings requested for owner's vehicles |
| `/api/bookings/change-status` | `POST` | `protect`, `isOwner`, `validate(schema)` | `changeBookingStatus` | Approves (`confirmed`) or Rejects (`cancelled`) booking |
| `/api/bookings/cancel` | `POST` | `protect`, `validate(schema)` | `cancelBooking` | Allows user or owner to cancel an unpaid request |
| `/api/bookings/edit` | `POST` | `protect`, `validate(schema)` | `editBooking` | Updates booking pickup or return dates |
| **Payments** | | | | |
| `/api/payment/create-order` | `POST` | `protect` | `createOrder` | Prepares a Razorpay transaction order |
| `/api/payment/verify` | `POST` | `protect` | `verifyPayment` | Verifies the cryptographic Razorpay payload signature |

---

## ⚡ 4. Core System Workflows

### A. Rental Booking & Payment lifecycle
1. **Search & Check**: User searches for cars. Once a car is selected, client requests `/api/bookings/check-availability` for a target date range.
2. **Reservation Request**: User books. A Booking document is saved in MongoDB with `status: "pending"` and `paymentStatus: "pending"`.
3. **Approval**: The fleet owner views bookings via `ManageBookings.jsx` page. If they approve, backend updates the status to `"confirmed"`.
4. **Checkout Initiation**: In `MyBookings.jsx`, the user clicks "Pay Now". The app fires `/api/payment/create-order` with the `bookingId`.
5. **Razorpay Modal**: The frontend launches the Razorpay Checkout widget. On successful completion, the checkout widget returns three tokens:
   - `razorpay_order_id`
   - `razorpay_payment_id`
   - `razorpay_signature`
6. **Verification**: The client posts these keys to `/api/payment/verify`. The backend builds a HMAC sha256 hex digest using `RAZORPAY_KEY_SECRET` and matches the signature. On success, `paymentStatus` is updated to `"paid"`.

### B. Image Upload Workflow
1. Client initiates a `multipart/form-data` upload (e.g. adding a new car).
2. Backend middleware `multer` accepts the file buffers.
3. Controller forwards the file payload to **ImageKit.io** using key credentials in `.env`.
4. ImageKit returns a cloud URL which is stored in MongoDB (`Car.image`).

---

## 💻 5. Frontend Architecture & Routing Map

### State & Context (`client/src/context/AppContext.jsx`)
Exposes authorization details globally. When a `token` exists in `localStorage`, the context attaches it to all Axios headers as default `Authorization` and triggers `fetchUser()` to populate the global profile state.

```javascript
const value = {
    navigate,
    currency, // defaults to ₹
    axios,
    user,
    setUser,
    token,
    setToken,
    isOwner, // true if user.role === 'owner'
    showLogin,
    setShowLogin,
    logout,
};
```

### Route Map (`client/src/App.jsx`)
```jsx
<Routes>
    {/* Public & Customer Routes */}
    <Route path='/' element={<Home />} />
    <Route path='/cars' element={<Cars />} />
    <Route path='/car-details/:id' element={<CarDetails />} />
    <Route path='/my-bookings' element={<MyBookings />} />
    <Route path='/payment-success' element={<PaymentSuccess />} />
    <Route path='/payment-failed' element={<PaymentFailed />} />

    {/* Protected Owner Dashboard Routes */}
    <Route path='/owner' element={<Layout />}>
      <Route index element={<Dashboard />} />
      <Route path='add-car' element={<AddCar />} />
      <Route path='manage-cars' element={<ManageCars />} />
      <Route path='manage-bookings' element={<ManageBookings />} />
    </Route>
</Routes>
```

---

## 🤖 6. Prompt Templates to use with ChatGPT or Gemini

Copy this entire report, paste it into your prompt window, and append one of these requests:

### Prompt 1: Adding a new Car field (e.g. Mileage)
> "Using the provided CarRental blueprint, write the code to add a mileage field:
> 1. In `server/models/Car.js`, add a `mileage` field (Number, required).
> 2. Update `server/controllers/ownerController.js` (specifically `addCar`) to capture and save `mileage`.
> 3. Update the frontend form in `client/src/pages/owner/AddCar.jsx` to render a styled mileage input field.
> Provide clean, copy-pasteable files or diffs."

### Prompt 2: Adding a Reviews & Ratings feature
> "Based on the CarRental architecture, I want to add reviews:
> 1. Create a Mongoose schema `server/models/Review.js` referencing `User` and `Car`, holding a rating (1-5) and comment.
> 2. Create the backend endpoints and routes for adding a review (`POST /api/user/review` — only allow users who have a 'completed' booking status for this car).
> 3. Draft a star-rating component in React that can render inside `client/src/pages/CarDetails.jsx` to fetch and show ratings."

### Prompt 3: Handling JWT session expiration gracefully
> "In the current `AppContext.jsx`, when the `/api/user/data` endpoint returns an invalid token error, `logout()` is triggered. How should I update the Axios setup to intercept standard 401 Unauthorized errors globally and trigger an automatic redirect to Home and display the Login Modal?"
