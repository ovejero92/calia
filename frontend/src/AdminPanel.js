import { Edit2, LogOut, Package, Plus, Search, ShoppingCart, Trash2, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log("funcional")

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [productoForm, setProductoForm] = useState({
    nombre: '', descripcion: '', precio: '', categoria: '', 
    colores: '', stock: 1, destacado: false, 
    imagenPrincipal: '', 
    imagenesPorColor: []
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      loadData();
    }
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const prodRes = await fetch(`${API_URL}/productos`, { headers });
      const pedRes = await fetch(`${API_URL}/pedidos`, { headers });
      const statsRes = await fetch(`${API_URL}/estadisticas`, { headers });
      
      setProductos(await prodRes.json());
      setPedidos(await pedRes.json());
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.admin));
        setUser(data.admin);
        loadData();
      } else {
        alert(data.error || 'Error en login');
      }
    } catch (err) {
      alert('Error conectando');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const deleteProducto = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    
    try {
      await fetch(`${API_URL}/productos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      loadData();
    } catch (err) {
      alert('Error eliminando');
    }
  };

  const updatePedidoEstado = async (id, estado) => {
    try {
      await fetch(`${API_URL}/pedidos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ estado })
      });
      loadData();
    } catch (err) {
      alert('Error actualizando');
    }
  };

  const editProducto = (prod) => {
    setEditingId(prod._id);
    setProductoForm({
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      precio: prod.precio,
      categoria: prod.categoria,
      colores: Array.isArray(prod.colores) ? prod.colores.join(', ') : '',
      stock: prod.stock,
      destacado: prod.destacado,
      imagenPrincipal: (prod.imagenes && prod.imagenes.length > 0) ? prod.imagenes[0] : '',
      // Assuming the backend provides a structured imagenesPorColor if available
      imagenesPorColor: prod.imagenesPorColor && Array.isArray(prod.imagenesPorColor) ? prod.imagenesPorColor : 
                        (prod.colores && Array.isArray(prod.colores) && prod.imagenes && prod.imagenes.length > 1
                          ? prod.colores.slice(1).map((color, idx) => ({ color: color, url: prod.imagenes[idx + 1] || '' }))
                          : [])
    });
    setView('nuevo-producto');
  };

  const handleSaveProducto = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    const productData = {
      ...productoForm,
      precio: parseFloat(productoForm.precio),
      stock: parseInt(productoForm.stock, 10),
      colores: productoForm.colores.split(',').map(color => color.trim()).filter(Boolean),
      imagenes: [productoForm.imagenPrincipal, ...productoForm.imagenesPorColor.map(img => img.url)].filter(Boolean),
      imagenesPorColor: productoForm.imagenesPorColor.filter(img => img.color && img.url)
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/productos/${editingId}`, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(productData)
        });
      } else {
        res = await fetch(`${API_URL}/productos`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(productData)
        });
      }
      
      if (res.ok) {
        alert(`Producto ${editingId ? 'actualizado' : 'creado'} con éxito!`);
        setProductoForm({ nombre: '', descripcion: '', precio: '', categoria: '', colores: '', stock: 1, destacado: false });
        setEditingId(null);
        setView('productos');
        loadData(); // Recargar la lista de productos
      } else {
        const errorData = await res.json();
        alert(`Error al ${editingId ? 'actualizar' : 'crear'} producto: ${errorData.message || res.statusText}`);
      }
    } catch (err) {
      alert(`Error de conexión al ${editingId ? 'actualizar' : 'crear'} producto.`);
      console.error('Error guardando producto:', err);
    }
    setLoading(false);
  };

  const filteredProductos = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.categoria && p.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Panel Admin</h1>
            <p className="text-gray-500 mt-2">Gestiona tu tienda de carteras</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-pink-500 w-12 h-12 rounded-xl flex items-center justify-center">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Mi Tienda</h2>
            <p className="text-xs text-gray-500">{user.nombre}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
            { id: 'productos', icon: Package, label: 'Productos' },
            { id: 'pedidos', icon: ShoppingCart, label: 'Pedidos' },
            { id: 'nuevo-producto', icon: Plus, label: 'Nuevo Producto' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                view === item.id 
                  ? 'bg-pink-50 text-pink-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      <div className="ml-64 p-8">
        {view === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-500 text-sm">Productos</p>
                  <Package className="text-blue-500" size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.totalProductos || 0}</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-500 text-sm">Pedidos</p>
                  <ShoppingCart className="text-green-500" size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.totalPedidos || 0}</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-500 text-sm">Pendientes</p>
                  <ShoppingCart className="text-orange-500" size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.pedidosPendientes || 0}</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-500 text-sm">Ventas Total</p>
                  <TrendingUp className="text-pink-500" size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-800">${stats.ventasTotal || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Últimos Pedidos</h2>
              {pedidos.slice(0, 5).map(pedido => (
                <div key={pedido._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{pedido.cliente.nombre}</p>
                    <p className="text-sm text-gray-500">{new Date(pedido.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-pink-600">${pedido.total}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      pedido.estado === 'pendiente' ? 'bg-orange-100 text-orange-600' :
                      pedido.estado === 'confirmado' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {pedido.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'productos' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
              <button
                onClick={() => {
                  setEditingId(null);
                  setProductoForm({ 
                    nombre: '', descripcion: '', precio: '', categoria: '',
                    colores: '', stock: 1, destacado: false,
                    imagenPrincipal: '', imagenesPorColor: []
                  });
                  setView('nuevo-producto');
                }}
                className="flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition"
              >
                <Plus size={20} />
                Nuevo Producto
              </button>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProductos.map(producto => (
                <div key={producto._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {producto.imagenes && producto.imagenes[0] ? (
                      <img src={producto.imagenes[0]} alt={producto.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="text-gray-400" size={48} />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{producto.nombre}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{producto.descripcion}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-pink-600">${producto.precio}</span>
                      <span className="text-sm text-gray-500">Stock: {producto.stock}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editProducto(producto)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => deleteProducto(producto._id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'nuevo-producto' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
            
            <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={productoForm.nombre}
                    onChange={(e) => setProductoForm({...productoForm, nombre: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    value={productoForm.descripcion}
                    onChange={(e) => setProductoForm({...productoForm, descripcion: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    rows="4"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Precio</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productoForm.precio}
                      onChange={(e) => setProductoForm({...productoForm, precio: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                    <input
                      type="number"
                      value={productoForm.stock}
                      onChange={(e) => setProductoForm({...productoForm, stock: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <input
                    type="text"
                    value={productoForm.categoria}
                    onChange={(e) => setProductoForm({...productoForm, categoria: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="Ej: Carteras de mano, Mochilas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Colores (separados por coma)</label>
                  <input
                    type="text"
                    value={productoForm.colores}
                    onChange={(e) => setProductoForm({...productoForm, colores: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="Negro, Marrón, Beige"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Imagen Principal</label>
                  <input
                    type="text"
                    value={productoForm.imagenPrincipal}
                    onChange={(e) => setProductoForm({...productoForm, imagenPrincipal: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="URL de la imagen principal del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes por Color</label>
                  <div className="space-y-2">
                    {productoForm.imagenesPorColor.map((imgColor, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={imgColor.color}
                          onChange={(e) => {
                            const newImagenesPorColor = [...productoForm.imagenesPorColor];
                            newImagenesPorColor[index].color = e.target.value;
                            setProductoForm({...productoForm, imagenesPorColor: newImagenesPorColor});
                          }}
                          className="w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                          placeholder="Color (ej: Rojo)"
                        />
                        <input
                          type="text"
                          value={imgColor.url}
                          onChange={(e) => {
                            const newImagenesPorColor = [...productoForm.imagenesPorColor];
                            newImagenesPorColor[index].url = e.target.value;
                            setProductoForm({...productoForm, imagenesPorColor: newImagenesPorColor});
                          }}
                          className="w-2/3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                          placeholder="URL de la imagen"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImagenesPorColor = productoForm.imagenesPorColor.filter((_, i) => i !== index);
                            setProductoForm({...productoForm, imagenesPorColor: newImagenesPorColor});
                          }}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setProductoForm({...productoForm, imagenesPorColor: [...productoForm.imagenesPorColor, { color: '', url: '' }]})}
                      className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      <Plus size={16} />
                      Añadir Imagen por Color
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={productoForm.destacado}
                      onChange={(e) => setProductoForm({...productoForm, destacado: e.target.checked})}
                      className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Producto destacado</span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSaveProducto}
                    disabled={loading}
                    className="flex-1 bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
                  >
                    {editingId ? 'Actualizar' : 'Crear Producto'}
                  </button>
                  <button
                    onClick={() => setView('productos')}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'pedidos' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Pedidos</h1>
            
            <div className="space-y-4">
              {pedidos.map(pedido => (
                <div key={pedido._id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{pedido.cliente.nombre}</h3>
                      <p className="text-sm text-gray-500">{pedido.cliente.email}</p>
                      <p className="text-sm text-gray-500">{pedido.cliente.telefono}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(pedido.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-pink-600">${pedido.total}</p>
                      <select
                        value={pedido.estado}
                        onChange={(e) => updatePedidoEstado(pedido._id, e.target.value)}
                        className={`mt-2 px-3 py-1 rounded text-sm font-medium ${
                          pedido.estado === 'pendiente' ? 'bg-orange-100 text-orange-600' :
                          pedido.estado === 'confirmado' ? 'bg-blue-100 text-blue-600' :
                          pedido.estado === 'enviado' ? 'bg-purple-100 text-purple-600' :
                          'bg-green-100 text-green-600'
                        }`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregado">Entregado</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Productos:</h4>
                    {pedido.productos.map((prod, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span>{prod.nombre} x{prod.cantidad}</span>
                        <span className="font-medium">${prod.precio * prod.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
