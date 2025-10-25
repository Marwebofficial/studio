import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

// IMPORTANT: Do not expose this to the client-side.
// This is a server-only file.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let adminApp: App;

if (getApps().length === 0) {
  // If no apps are initialized, initialize the admin app.
  if (serviceAccount) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
  } else {
    // For local development or environments without service account JSON,
    // initialize with default credentials.
    adminApp = initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log("Firebase Admin SDK initialized with default credentials. Full access may not be available.");
  }
} else {
  // If apps are already initialized, get the default app.
  // This avoids re-initializing, which would cause an error.
  adminApp = getApps()[0];
}

export { adminApp };
