import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';  // Import the cors module

// Initialize Firebase Admin SDK with a service account object
const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),  // Ensure the private key is properly formatted
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const port = process.env.PORT || 3000;

// Use CORS middleware
app.use(cors());  // This will allow all origins to access the API

app.use(express.json()); // For parsing JSON bodies

// Send notification via FCM
const sendMessage = async (message) => {
  try {
      const response = await admin.messaging().send(message)
        .then(response => {
          console.log('Successfully sent message:', response);
        })
        .catch(error => {
          console.error('Error sending message:', error);
        });
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

app.get('/', async (req, res) => {
  const _token = req.query.token;  // Get token from query parameter

  if (!_token) {
    return res.status(400).json({
      error: 'FCM token is required',
    });
  }

  const _title = req.query.title || "title";
  const _body = req.query.body || "body";
  const _data = req.query.data || "data";

  const newMessage = {
    notification: {
      title: _title,
      body: _body
    },
    data: {
        data: _data
    },
    token: _token
  };

  try {
    const response = await sendMessage(newMessage);
    res.json({
      message: 'Message sent successfully!',
      response,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send notification',
      details: error.message,
    });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
