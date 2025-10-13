import { Minus, Package, Plus, Search, Send, ShoppingCart, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Tienda() {
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
        
        // REEMPLAZA 5491123456789 con el número de WhatsApp de tu novia
        const whatsappUrl = `https://wa.me/5491123456789?text=${encodeURIComponent(whatsappMsg)}`;
        window.open(whatsappUrl, '_blank');
        
        alert('¡Pedido enviado! Te contactaremos pronto por WhatsApp.');
        setCarrito([]);
        setMostrarCheckout(false);
        setMostrarCarrito(false);
        setClienteData({ nombre: '', email: '', telefono: '', direccion: '' });
      }
    } catch (err) {
      alert('Error al enviar pedido. Por favor intenta de nuevo.');
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
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-pink-600">Calia</h1>
              <p className="text-sm text-gray-500">Carteras de calidad</p>
            </div>
            
            <button
              onClick={() => setMostrarCarrito(true)}
              className="relative bg-pink-500 text-white p-3 rounded-full hover:bg-pink-600 transition shadow-lg"
            >
              <ShoppingCart size={24} />
              {carrito.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold animate-bounce">
                  {carrito.length}
                </span>
              )}
            </button>
          </div>

          {/* Búsqueda y filtros */}
          <div className="mt-4 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar carteras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'todas' ? 'Todas las categorías' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Productos */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Package className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-xl text-gray-500">
              {productos.length === 0 
                ? 'Estamos preparando nuestros productos...' 
                : 'No se encontraron productos con ese criterio'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosFiltrados.map(producto => (
              <div key={producto._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div 
                  className="h-64 bg-gray-200 overflow-hidden cursor-pointer"
                  onClick={() => setProductoSeleccionado({
                    ...producto,
                    selectedImage: producto.imagenPrincipal || (producto.imagenesPorColor && producto.imagenesPorColor[0] ? producto.imagenesPorColor[0].url : (producto.imagenes && producto.imagenes[0])),
                    selectedColor: (producto.imagenesPorColor && producto.imagenesPorColor[0] ? producto.imagenesPorColor[0].color : null)
                  })}
                >
                  {producto.imagenes && producto.imagenes[0] ? (
                    <img 
                      src={producto.imagenes[0]} 
                      alt={producto.nombre} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="text-gray-400" size={48} />
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">{producto.nombre}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{producto.descripcion}</p>
                  
                  {producto.colores && producto.colores.length > 0 && (
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {producto.colores.slice(0, 3).map((color, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">{color}</span>
                      ))}
                      {producto.colores.length > 3 && (
                        <span className="text-xs text-gray-400">+{producto.colores.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-2xl font-bold text-pink-600">${producto.precio}</span>
                    <button
                      onClick={() => agregarAlCarrito(producto)}
                      className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <ShoppingCart size={18} />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Detalle Producto */}
      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{productoSeleccionado.nombre}</h2>
              <button
                onClick={() => setProductoSeleccionado(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  {productoSeleccionado.imagenes && productoSeleccionado.selectedImage ? (
                    <img 
                      src={productoSeleccionado.selectedImage} 
                      alt={productoSeleccionado.nombre}
                      className="w-full rounded-xl shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gray-200 rounded-xl flex items-center justify-center">
                      <Package className="text-gray-400" size={64} />
                    </div>
                  )}
                  
                </div>
                
                <div>
                  <p className="text-gray-600 mb-6 text-lg">{productoSeleccionado.descripcion}</p>
                  
                  <div className="space-y-4 mb-6">
                    {productoSeleccionado.categoria && (
                      <div>
                        <span className="text-sm text-gray-500 font-medium">Categoría:</span>
                        <p className="text-lg">{productoSeleccionado.categoria}</p>
                      </div>
                    )}
                    
                    {productoSeleccionado.colores && productoSeleccionado.colores.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500 font-medium">Colores disponibles:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {productoSeleccionado.colores.map((color, idx) => (
                            <span key={idx} className="bg-gray-100 px-3 py-2 rounded-lg">{color}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {productoSeleccionado.imagenesPorColor && productoSeleccionado.imagenesPorColor.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-500 font-medium">Colores Disponibles:</span>
                          <div className="flex gap-2 mt-2">
                            {productoSeleccionado.imagenesPorColor.map((imgColor, index) => (
                              <button
                                key={index}
                                onClick={() => setProductoSeleccionado({
                                  ...productoSeleccionado, 
                                  selectedImage: imgColor.url,
                                  selectedColor: imgColor.color
                                })}
                                className={`w-8 h-8 rounded-full border-2 ${productoSeleccionado.selectedColor === imgColor.color ? 'border-pink-500' : 'border-gray-300'} focus:outline-none`}
                                style={{ backgroundColor: imgColor.color.toLowerCase().includes('negro') ? '#000' : 
                                                  imgColor.color.toLowerCase().includes('blanco') ? '#fff' : 
                                                  imgColor.color.toLowerCase().includes('rojo') ? '#f00' : 
                                                  imgColor.color.toLowerCase().includes('azul') ? '#00f' : 
                                                  imgColor.color.toLowerCase().includes('verde') ? '#0f0' : 
                                                  imgColor.color.toLowerCase().includes('amarillo') ? '#ff0' : 
                                                  imgColor.color.toLowerCase().includes('rosa') ? '#ffc0cb' : 
                                                  imgColor.color.toLowerCase().includes('violeta') ? '#8a2be2' : 
                                                  imgColor.color.toLowerCase().includes('marrón') ? '#a52a2a' : 
                                                  imgColor.color.toLowerCase().includes('gris') ? '#808080' : '#ccc'}}
                                title={imgColor.color}
                              >
                                {productoSeleccionado.selectedColor === imgColor.color && (
                                  <span className="block w-4 h-4 rounded-full bg-white mx-auto" style={{ marginTop: '4px' }}></span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                    )}
                    
                    <div>
                      <span className="text-sm text-gray-500 font-medium">Stock:</span>
                      <p className="text-lg">
                        {productoSeleccionado.stock > 0 
                          ? `${productoSeleccionado.stock} unidades disponibles` 
                          : 'Agotado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl font-bold text-pink-600">${productoSeleccionado.precio}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        agregarAlCarrito(productoSeleccionado);
                        setProductoSeleccionado(null);
                      }}
                      disabled={productoSeleccionado.stock === 0}
                      className="w-full bg-pink-500 text-white py-4 rounded-lg hover:bg-pink-600 transition flex items-center justify-center gap-2 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <ShoppingCart size={24} />
                      {productoSeleccionado.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Carrito */}
      {mostrarCarrito && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Mi Carrito</h2>
              <button
                onClick={() => setMostrarCarrito(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {carrito.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-xl text-gray-500">Tu carrito está vacío</p>
                  <button
                    onClick={() => setMostrarCarrito(false)}
                    className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition"
                  >
                    Seguir comprando
                  </button>
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
                              <Package className="text-gray-400" size={32} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold mb-1">{item.nombre}</h3>
                          <p className="text-pink-600 font-bold">${item.precio}</p>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => modificarCantidad(item._id, -1)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="font-medium w-8 text-center">{item.cantidad}</span>
                            <button
                              onClick={() => modificarCantidad(item._id, 1)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => eliminarDelCarrito(item._id)}
                              className="ml-auto text-red-500 hover:text-red-700 transition"
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
                    className="w-full bg-pink-500 text-white py-4 rounded-lg hover:bg-pink-600 transition text-lg font-semibold shadow-lg hover:shadow-xl"
                  >
                    Continuar con la Compra
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Checkout */}
      {mostrarCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Datos de Contacto</h2>
              <button
                onClick={() => setMostrarCheckout(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Tu nombre"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Teléfono (WhatsApp) *</label>
                  <input
                    type="tel"
                    value={clienteData.telefono}
                    onChange={(e) => setClienteData({...clienteData, telefono: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="11 2345 6789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={clienteData.email}
                    onChange={(e) => setClienteData({...clienteData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Dirección de envío</label>
                  <textarea
                    value={clienteData.direccion}
                    onChange={(e) => setClienteData({...clienteData, direccion: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows="3"
                    placeholder="Calle, número, localidad, provincia"
                  />
                </div>
              </div>
              
              <div className="bg-pink-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between font-bold text-lg mb-2">
                  <span>Total a pagar:</span>
                  <span className="text-pink-600">${calcularTotal()}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {carrito.reduce((sum, item) => sum + item.cantidad, 0)} producto(s) en tu carrito
                </p>
              </div>
              
              <button
                onClick={finalizarCompra}
                className="w-full bg-green-500 text-white py-4 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 text-lg font-semibold shadow-lg hover:shadow-xl"
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