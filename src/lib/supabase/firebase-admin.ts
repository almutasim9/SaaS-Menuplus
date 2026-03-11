import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    
    // Fix issue where environment variables might contain escaped newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (Object.keys(serviceAccount).length > 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is missing or empty');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const firebaseAdmin = admin;

/**
 * Sends a push notification to multiple FCM tokens.
 */
export async function sendPushNotification({
  tokens,
  title,
  body,
  data,
}: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  if (!tokens || tokens.length === 0) return;

  const message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    tokens,
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default',
        channelId: 'new_orders',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications; ${response.failureCount} failed.`);
    
    // In a real app, you might want to remove invalid tokens from the database here
    if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                console.warn(`Token at index ${idx} failed:`, resp.error);
            }
        });
    }
    
    return response;
  } catch (error) {
    console.error('Error sending FCM message:', error);
  }
}
