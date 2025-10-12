import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';        // Panel Admin
import Tienda from './Tienda';  // Tienda Pública

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Tienda />} />           {/* Página principal = Tienda */}
        <Route path="/admin" element={<App />} />          {/* /admin = Panel Admin */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);