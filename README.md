# Inventory Buddy

**Inventory Buddy** is a web application designed to help users manage their pantry items efficiently. The application allows users to add, edit, and delete pantry items, capture or upload images of items, and view a list of their stored items.

## Features

- **User Authentication:** Secure sign-in and sign-out functionality.
- **Pantry Management:** Add, edit, and delete pantry items.
- **Image Management:** Capture images using the camera or upload images from the file system.
- **Responsive Design:** Works on both desktop and mobile devices.
- **Real-time Updates:** Automatically updates the pantry list upon change

## Project Structure

```bash
.
├── README.md
├── app
│   ├── globals.css
│   ├── landingpage
│   │   └── page.js
│   ├── layout.js
│   ├── page.js
│   ├── pantry
│   │   └── page.js
│   ├── protectedRoute.js
│   ├── signin
│   │   └── page.js
│   └── signup
│       └── page.js
├── firebase.js
```

## Technologies Used

- **Frontend:**
  - React
  - Next.js
  - Material UI
- **Backend:**
  - Firebase Firestore
  - Firebase Authentication
  - Firebase Storage
- **Deployment:**
  - Vercel
- **Additional:**
  - MUI (Material UI)

## Getting Started

To get a local copy up and running, follow these steps:

### Prerequisites

- Node.js
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository:**

```bash
    https://github.com/patelpratyush/Inventory-Management
```

2. **Navigate to the project directory:**

```bash
    cd Inventory-Management
```

3. **Install dependencies**

```bash
    npm install
    # or
    yarn install
```

4. **Set up Firebase:**

- Create a Firebase project and add your Firebase configuration.
- Set up Firestore, Authentication, and Storage in the Firebase console.
- Replace the Firebase configuration in `firebase.js` with your project's details.

5. **Run the development server:**

```bash
    npm run dev
    # or
    yarn dev
```

5. **Open your browser and go to:**

```bash
    http://localhost:3000
```

## Usage

- Sign In: Use your email and password to sign in.
- Manage Pantry Items: Add new items, edit existing ones, or delete items.
- Capture/Upload Images: Capture images directly from your device’s camera or upload them from your file system.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a new Pull Request.
