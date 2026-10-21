import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AgentAuthProvider } from '../context/AgentAuthContext';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { SavedPropertiesProvider } from '../context/SavedPropertiesContext';
import AppRouter from './router';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SavedPropertiesProvider>
          <AgentAuthProvider>
            <AdminAuthProvider>
              <AppRouter />
            </AdminAuthProvider>
          </AgentAuthProvider>
        </SavedPropertiesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
