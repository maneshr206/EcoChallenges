import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const userPoolId   = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId     = import.meta.env.VITE_COGNITO_CLIENT_ID;
const region       = import.meta.env.VITE_REGION || 'us-east-1';

const isConfigured =
  userPoolId  && userPoolId  !== 'us-east-1_PLACEHOLDER' &&
  clientId    && clientId    !== 'PLACEHOLDER';

if (!isConfigured) {
  console.warn(
    '[EcoChallenges] AWS Cognito is not configured.\n' +
    'Copy frontend/.env.example → frontend/.env and fill in your ' +
    'VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID after running `sam deploy`.'
  );
}

// Always configure Amplify — Cognito will throw clear errors if placeholders used
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId:     userPoolId  || 'us-east-1_PLACEHOLDER',
      userPoolClientId: clientId  || 'PLACEHOLDER',
      region,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
