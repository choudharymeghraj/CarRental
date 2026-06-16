# Car Rental Website - Project Architecture & File Functionality Report

This report outlines the structure and functionality of each file in your Car Rental website project. You can share this document with Gemini to provide complete context when asking for refinements, new features, or debugging help.

---

## 1. Frontend Architecture (`client/` directory)

The frontend is built using **React** and **Vite**, with routing handled by `react-router-dom` and global state managed via React Context.

### Core Setup & Configuration
*   **`client/src/main.jsx`**: The entry point of the React application. It renders the root `<App />` component into the DOM.
*   **`client/src/App.jsx`**: Sets up the main routing using `react-router-dom`, defining the paths for both public user pages and protected owner dashboard routes.
*   **`client/src/context/AppContext.jsx`**: Contains the `AppContext` and `AppProvider`. This is used for global state management, such as storing user authentication status, user details, and the backend API URL.
*   **`client/src/index.css`**: Contains global CSS styles and potentially Tailwind CSS directives (if Tailwind is used).

### Shared Components (`client/src/components/`)
These are reusable UI components used across various pages.
*   **`Navbar.jsx`**: The main navigation bar for regular users, containing links to Home, Cars, My Bookings, and Login/Logout buttons.
*   **`Footer.jsx`**: The standard website footer displayed at the bottom of public pages.
*   **`Login.jsx`**: Handles both user login and registration logic. It likely includes forms for email/password and communicates with the backend authentication API.
*   **`Hero.jsx`**: The hero section (landing banner) displayed at the top of the homepage to grab user attention.
*   **`FeaturedSection.jsx`**: A section displaying a curated list of featured or popular cars.
*   **`CarCard.jsx`**: A reusable card component used to display a single car's thumbnail, name, price, and basic details in lists or grids.
*   **`Banner.jsx`**: A promotional banner component used for marketing or calls-to-action.
*   **`Testimonial.jsx`**: A section displaying reviews or feedback from past customers.
*   **`Newsletter.jsx`**: A component allowing users to subscribe to a newsletter.
*   **`Loader.jsx`**: A visual loading spinner displayed while data is being fetched from the backend.
*   **`Title.jsx`**: A reusable styled heading component.

### Public & User Pages (`client/src/pages/`)
*   **`Home.jsx`**: The landing page of the application. It aggregates components like `Hero`, `FeaturedSection`, `Banner`, and `Testimonial`.
*   **`Cars.jsx`**: The main listing page where users can browse all available cars for rent.
*   **`CarDetails.jsx`**: The detailed view for a specific car. It fetches a single car's full details from the backend and provides the interface for a user to book it.
*   **`MyBookings.jsx`**: A private page for authenticated regular users to view their rental history and active bookings.

### Owner Dashboard Components & Pages (`client/src/components/owner/` & `client/src/pages/owner/`)
These files handle the administrative interface for car owners.
*   **`owner/Layout.jsx`**: A layout wrapper specific to the owner dashboard. It ensures the sidebar and top navbar are consistently displayed around owner page content.
*   **`owner/NavbarOwner.jsx`**: The top navigation bar specific to the owner dashboard.
*   **`owner/Sidebar.jsx`**: The side navigation menu allowing owners to switch between dashboard views.
*   **`owner/Title.jsx`**: A styled title component for dashboard sections.
*   **`owner/Dashboard.jsx`**: The main overview page for owners, showing high-level metrics (e.g., total cars, total bookings, revenue).
*   **`owner/AddCar.jsx`**: A form interface allowing owners to list a new car, including uploading images and setting pricing/specifications.
*   **`owner/ManageCars.jsx`**: A data table or list where owners can view, edit, or delete their existing car listings.
*   **`owner/ManageBookings.jsx`**: A page where owners can view incoming rental requests and update booking statuses (e.g., approve, reject, complete).

---

## 2. Backend Architecture (`server/` directory)

The backend is built using **Node.js** and **Express.js**, acting as a RESTful API. It connects to a database (likely **MongoDB** via Mongoose) to persist data.

### Core Server & Configuration
*   **`server.js`**: The main entry point for the backend. It initializes the Express app, sets up middleware (CORS, JSON parsing), connects to the database, and registers API routes.
*   **`config/db.js`**: Contains the logic to connect to the MongoDB database using Mongoose.
*   **`config/imageKit.js`**: Configuration for ImageKit, a third-party service used for storing and serving uploaded car and profile images.
*   **`.env`**: Stores environment variables securely (e.g., Database URI, JWT Secret, ImageKit keys, Port).

### Data Models (`server/models/`)
These define the schema and structure of the MongoDB collections.
*   **`User.js`**: Defines the schema for users. Likely includes fields for name, email, password (hashed), and role (e.g., 'user', 'owner').
*   **`Car.js`**: Defines the schema for cars. Includes fields like make, model, year, price per day, availability status, owner ID reference, and image URLs.
*   **`Booking.js`**: Defines the schema for rental transactions. Includes references to the User (renter) and the Car, along with start/end dates, total price, and booking status (e.g., 'pending', 'approved', 'cancelled').

### Controllers (`server/controllers/`)
These contain the core business logic for handling API requests.
*   **`userController.js`**: Handles user authentication (register, login) and fetching user profile details.
*   **`ownerController.js`**: Handles operations restricted to owners, such as adding a new car to the database, editing car details, and managing owner-specific data.
*   **`bookingController.js`**: Handles creating new bookings, retrieving a user's bookings, retrieving an owner's received bookings, and updating booking statuses.

### API Routes (`server/routes/`)
These map URL endpoints to the corresponding controller functions.
*   **`userRoutes.js`**: Endpoints like `POST /api/users/register`, `POST /api/users/login`.
*   **`ownerRoutes.js`**: Endpoints like `POST /api/owner/add-car`, `GET /api/owner/cars`.
*   **`bookingRoutes.js`**: Endpoints like `POST /api/bookings/create`, `GET /api/bookings/my-bookings`.

### Middleware (`server/middleware/`)
*   **`auth.js`**: Authentication middleware. It checks incoming requests for a valid JSON Web Token (JWT) in the headers. If valid, it attaches the user data to the request object; if not, it blocks access to protected routes.
*   **`multer.js`**: Middleware for handling `multipart/form-data`. It's used to process file uploads (like car images) before passing the data to controllers or third-party storage (ImageKit).

### Utility Scripts
*   **`test-db.js` / `update-bookings.js`**: Utility scripts used during development for testing database connections or migrating/updating existing database records.

---

## How to use this report with Gemini:
If you want to add a feature, fix a bug, or restyle a component, you can copy sections of this report and say:

*   *"Hey Gemini, based on my project structure where `client/src/pages/owner/AddCar.jsx` handles adding cars and `server/controllers/ownerController.js` handles the backend logic, how can I add a new field for 'Car Mileage'?"*
*   *"Gemini, my styling is in `client/src/index.css` and I'm using `client/src/components/CarCard.jsx`. Can you rewrite `CarCard.jsx` to have a modern glassmorphism design?"*
*   *"I want to implement a payment gateway. Given my models are in `server/models/Booking.js` and routes in `server/routes/bookingRoutes.js`, how should I integrate Stripe?"*
