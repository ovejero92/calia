import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminPanel from './AdminPanel';
import Tienda from './Tienda'; // Asegúrate de que este sea el componente de tu tienda

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Tienda />} />
        <Route path="/admin" element={<AdminPanel />} />
        {/* Agrega más rutas para la tienda aquí si es necesario */}
      </Routes>
    </Router>
  );
}

export default App;


