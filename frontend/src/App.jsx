import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import CreateTest from './pages/CreateTest.jsx';
import TestRunner from './pages/TestRunner.jsx';
import Results from './pages/Results.jsx';
import EditTest from './pages/EditTest.jsx';
import { ToastProvider } from './components/Toast.jsx';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateTest />} />
        <Route path="/test/:id" element={<TestRunner />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/edit/:id" element={<EditTest />} />
      </Routes>
    </ToastProvider>
  );
}
