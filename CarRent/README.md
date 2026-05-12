# 🚗 CarRental — Full-Stack MERN Car Rental Platform

CarRental is a premium, high-performance car rental marketplace built with the MERN stack (MongoDB, Express, React, Node.js). It features a sleek, modern UI, atomic transactions for bookings, an owner dashboard for fleet management, and secure Razorpay payment integration.

---

## ✨ Key Features

### 👤 For Customers
- **Global Search**: Search cars by location and date availability.
- **Atomic Bookings**: Real-time availability checks to prevent double-booking.
- **Secure Payments**: Integrated Razorpay checkout for confirmed bookings.
- **User Dashboard**: Manage active bookings, view rental history, and track payment status.
- **Premium UI**: Smooth animations powered by `motion` and responsive design with Tailwind CSS.

### 🏢 For Fleet Owners
- **Owner Dashboard**: High-level statistics on revenue, bookings, and fleet size.
- **Fleet Management**: Easily add, edit, or remove cars from the platform.
- **Booking Management**: Approve or reject customer rental requests.
- **Profile Customization**: Manage business profile and imagery.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Tailwind CSS 4, TanStack Query, React Router 7 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT (JSON Web Tokens) with Secure Middleware |
| **Payments** | Razorpay (Test Mode Integrated) |
| **Image Hosting** | ImageKit.io |
| **Animations** | Motion (Framer Motion) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Razorpay Account (for API keys)
- ImageKit Account (for image uploads)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/CarRental.git
cd CarRental
```

### 2. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory:
   ```env
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   IMAGEKIT_URL_ENDPOINT=your_imagekit_url
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   CURRENCY_CODE=INR
   ```
4. Start the server:
   ```bash
   node server.js
   ```

### 3. Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `client` directory:
   ```env
   VITE_BASE_URL=http://localhost:3000
   VITE_CURRENCY=$
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 💳 Testing Payments
To test the payment flow:
1. Approve a booking from the **Owner Dashboard**.
2. Log in as a **User** and go to **My Bookings**.
3. Click the pulsing **Pay Now** button.
4. Use dummy card number: `4111 1111 1111 1111` for successful transactions.

---

## 📄 License
This project is licensed under the MIT License.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
