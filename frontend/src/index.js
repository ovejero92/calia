import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // Panel Admin
// import Tienda from './Tienda'; // Tienda Pública

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    {/* <Tienda /> */}
  </React.StrictMode>
);