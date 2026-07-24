# FRAILSS Mobile App

`frailss-app` is a React Native mobile application built with Expo for a face-assisted resident lift access workflow. The app lets a resident register with a username, password, floor level, and a guided set of face photos, then log in and send floor selection commands to a Raspberry Pi based lift controller.

## What the app does

- Registers a resident profile with username, password, and resident level
- Guides the user through capturing 5 face images: front, left, right, up, and down
- Uploads registration data and captured images to a Raspberry Pi backend for face processing
- Uses Firebase Firestore to look up resident login data
- Sends lift floor selection commands from the dashboard to a Raspberry Pi server
- Restricts floor access based on the resident's assigned level

## Main flow

1. User opens the app and lands on the login screen.
2. New users go to the registration screen and enter username, password, and resident level.
3. The app opens the camera flow and captures 5 guided face images.
4. Images and registration data are uploaded to the Raspberry Pi backend for processing.
5. Returning users log in with their username and password.
6. After login, the dashboard allows the user to choose accessible floors and send commands to the lift system.

## Tech stack

- Expo 53
- React 19
- React Native 0.79
- React Navigation
- `expo-camera`
- `expo-file-system`
- Firebase
- `bcryptjs`

## Project structure

```text
frailss-app/
|-- App.tsx
|-- index.ts
|-- config/
|   `-- firebaseConfig.js
|-- screens/
|   |-- LoginScreen.js
|   |-- RegisterScreen.js
|   |-- DashboardScreen.js
|   `-- cameracapture.js
`-- assets/
```

## Screens

### Login

- Queries Firebase Firestore for a resident record
- Compares the entered password against the stored hashed password using `bcryptjs`
- Navigates to the dashboard with the resident username and level

<img width="707" height="1564" alt="image" src="https://github.com/user-attachments/assets/2b8c2b9f-7a0a-4a30-be59-704db1e3027f" />
<img width="706" height="1564" alt="image" src="https://github.com/user-attachments/assets/09187eb9-066a-4827-a6ab-6cdf69cc6767" />
<img width="707" height="1564" alt="image" src="https://github.com/user-attachments/assets/d4adccd1-0439-4e52-bc07-a15603067e20" />


### Register

- Collects username, password, and resident level
- Passes registration data into the camera capture workflow

<img width="242" height="538" alt="image" src="https://github.com/user-attachments/assets/763e147c-d200-4f44-9d76-3d860b65a1b3" />

### Camera Capture

- Requests camera permission through `expo-camera`
- Guides the user to capture 5 face angles
- Saves captured images locally before upload
- Uploads face images and registration data to the Raspberry Pi backend

<img width="304" height="676" alt="image (1)" src="https://github.com/user-attachments/assets/a6ca4d64-a083-46f2-b773-d8e1f37a8349" />

### Dashboard

- Displays resident information
- Shows the floors the user can access
- Sends floor selection commands to the lift control API

<img width="707" height="1564" alt="image" src="https://github.com/user-attachments/assets/ff486bbb-3230-4548-8aab-ab7f923e28e4" />

## Backend dependencies

This mobile app depends on external services:

- Firebase Firestore for resident account data
- A Raspberry Pi backend server for:
  - face image processing
  - registration handling
  - lift control API endpoints

The current app code is configured to contact the Raspberry Pi at:

```text
172.20.10.2:3000
```

The app expects backend routes similar to:

- `GET /api/test`
- `POST /api/process-face`
- `POST /api/lift-control`

## Firebase configuration

Firebase is initialized in [config/firebaseConfig.js](/C:/YunLing/AI/AI_Project_Learn/AI_Face_Recognition_System/frailss-app/config/firebaseConfig.js). If you are setting this project up for a different environment, replace the Firebase configuration with your own project credentials.

## Getting started

### Prerequisites

- Node.js
- npm
- Expo CLI tooling through `npx expo`
- Android Studio emulator or a physical Android device
- A running Firebase project
- A reachable Raspberry Pi backend on the same network as the mobile device

### Install dependencies

```bash
npm install
```

### Start the Expo development server

```bash
npm start
```

### Run on Android

```bash
npm run android
```

### Run on web

```bash
npm run web
```

## Notes

- Camera-based registration works best on a physical device.
- The app currently uses a fixed Raspberry Pi IP address in the screen files.
- Registration is currently limited to `Level 2` in the UI.
- The login flow checks Firestore records in the `residents` collection.

## Known limitations

- Real-time face guidance and on-device face recognition are not implemented in the Expo app.
- Backend IP addresses are hardcoded and should ideally be moved into configuration.
- The README describes the mobile app only; backend server setup is not included in this repository.


