import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Search, X, Plus, Minus, Send } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function TiendaPublica() {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [clienteData, setClienteData] = useState({
    nombre: '', email: '', telefono: '', direccion: ''
  });

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_URL}/productos`);
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item._id === producto._id);
    if (existe) {
      setCarrito(carrito.map(item => 
        item._id === producto._id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    setMostrarCarrito(true);
  };

  const modificarCantidad = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item._id === id) {
        const nuevaCantidad = item.cantidad + delta;
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item;
      }
      return item;
    }).filter(item => item.cantidad > 0));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item._id !== id));
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const finalizarCompra = async () => {
    if (!clienteData.nombre || !clienteData.telefono) {
      alert('Por favor completa nombre y teléfono');
      return;
    }

    const pedido = {
      cliente: clienteData,
      productos: carrito.map(item => ({
        productoId: item._id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        imagen: item.imagenes && item.imagenes[0] ? item.imagenes[0] : ''
      })),
      total: calcularTotal()
    };

    try {
      const res = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
      });

      if (res.ok) {
        const items = carrito.map(item => 
          `${item.nombre} x${item.cantidad} - $${item.precio * item.cantidad}`
        ).join('\n');
        
        const whatsappMsg = `Hola! Quiero hacer un pedido:\n\n${items}\n\nTotal: $${calcularTotal()}\n\nNombre: ${clienteData.nombre}\nTeléfono: ${clienteData.telefono}`;
        
        const whatsappUrl = `https://wa.me/5491234567890?text=${encodeURIComponent(whatsappMsg)}`;
        window.open(whatsappUrl, '_blank');
        
        alert('Pedido enviado! Te contactaremos pronto.');
        setCarrito([]);
        setMostrarCheckout(false);
        setMostrarCarrito(false);
      }
    } catch (err) {
      alert('Error al enviar pedido');
    }
  };

  const categorias = ['todas', ...new Set(productos.map(p => p.categoria).filter(Boolean))];
  
  const productosFiltrados = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaFiltro === 'todas' || p.categoria === categoriaFiltro;
    return matchSearch && matchCategoria;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-pink-600">Mi Tienda de Carteras</h1>
              <p className="text-sm text-gray-500">Calidad y estilo en cada producto</p>
            </div>
            
            <button
              onClick={() => setMostrarCarrito(true)}
              className="relative bg-pink-500 text-white p-3 rounded-full hover:bg-pink-600 transition"
            >
              <ShoppingCart size={24} />
              {carrito.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                  {carrito.length}
                </span>
              )}
            </button>
          </div>

          <div className="mt-4 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat === 'todas' ? 'Todas las categorías' : cat}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productosFiltrados.map(producto => (
            <div key={producto._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group">
              <div 
                className="h-64 bg-gray-200 overflow-hidden cursor-pointer"
                onClick={() => setProductoSeleccionado(producto)}
              >
                {producto.imagenes && producto.imagenes[0] ? (
                  <img 
                    src={producto.imagenes[0]} 
                    alt={producto.nombre} 
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="text-gray-400" size={48} />
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{producto.nombre}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{producto.descripcion}</p>
                
                {producto.colores && producto.colores.length > 0 && (
                  <div className="flex gap-1 mb-3">
                    {producto.colores.slice(0, 4).map((color, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">{color}</span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-pink-600">${producto.precio}</span>
                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition flex items-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {productosFiltrados.length === 0 && (
          <div className="text-center py-20">
            <ShoppingCart className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-xl text-gray-500">No se encontraron productos</p>
          </div>
        )}
      </main>

      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{productoSeleccionado.nombre}</h2>
              <button
                onClick={() => setProductoSeleccionado(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  {productoSeleccionado.imagenes && productoSeleccionado.imagenes[0] ? (
                    <img 
                      src={productoSeleccionado.imagenes[0]} 
                      alt={productoSeleccionado.nombre}
                      className="w-full rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gray-200 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="text-gray-400" size={64} />
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-gray-600 mb-6">{productoSeleccionado.descripcion}</p>
                  
                  <div className="space-y-4 mb-6">
                    {productoSeleccionado.categoria && (
                      <div>
                        <span className="text-sm text-gray-500">Categoría:</span>
                        <p className="font-medium">{productoSeleccionado.categoria}</p>
                      </div>
                    )}
                    
                    {productoSeleccionado.colores && productoSeleccionado.colores.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500">Colores disponibles:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {productoSeleccionado.colores.map((color, idx) => (
                            <span key={idx} className="bg-gray-100 px-3 py-1 rounded">{color}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-sm text-gray-500">Stock:</span>
                      <p className="font-medium">{productoSeleccionado.stock} disponibles</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-bold text-pink-600">${productoSeleccionado.precio}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        agregarAlCarrito(productoSeleccionado);
                        setProductoSeleccionado(null);
                      }}
                      className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition flex items-center justify-center gap-2 text-lg font-semibold"
                    >
                      <ShoppingCart size={24} />
                      Agregar al Carrito
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarCarrito && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Carrito de Compras</h2>
              <button
                onClick={() => setMostrarCarrito(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {carrito.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-xl text-gray-500">Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {carrito.map(item => (
                      <div key={item._id} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {item.imagenes && item.imagenes[0] ? (
                            <img src={item.imagenes[0]} alt={item.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="text-gray-400" size={32} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold mb-1">{item.nombre}</h3>
                          <p className="text-pink-600 font-bold">${item.precio}</p>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => modificarCantidad(item._id, -1)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="font-medium">{item.cantidad}</span>
                            <button
                              onClick={() => modificarCantidad(item._id, 1)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => eliminarDelCarrito(item._id)}
                              className="ml-auto text-red-500 hover:text-red-700"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-lg">${item.precio * item.cantidad}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between text-2xl font-bold">
                      <span>Total:</span>
                      <span className="text-pink-600">${calcularTotal()}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setMostrarCarrito(false);
                      setMostrarCheckout(true);
                    }}
                    className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition text-lg font-semibold"
                  >
                    Continuar con la Compra
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Datos de Contacto</h2>
              <button
                onClick={() => setMostrarCheckout(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre completo *</label>
                  <input
                    type="text"
                    value={clienteData.nombre}
                    onChange={(e) => setClienteData({...clienteData, nombre: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="Tu nombre"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Teléfono *</label>
                  <input
                    type="tel"
                    value={clienteData.telefono}
                    onChange={(e) => setClienteData({...clienteData, telefono: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="1123456789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={clienteData.email}
                    onChange={(e) => setClienteData({...clienteData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Dirección</label>
                  <textarea
                    value={clienteData.direccion}
                    onChange={(e) => setClienteData({...clienteData, direccion: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    rows="3"
                    placeholder="Calle, número, localidad"
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total a pagar:</span>
                  <span className="text-pink-600">${calcularTotal()}</span>
                </div>
              </div>
              
              <button
                onClick={finalizarCompra}
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 text-lg font-semibold"
              >
                <Send size={20} />
                Enviar Pedido por WhatsApp
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Al enviar el pedido serás redirigido a WhatsApp para confirmar tu compra
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}