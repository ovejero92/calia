// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar Multer con Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'carteras',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov'],
    resource_type: 'auto'
  }
});

const upload = multer({ storage });

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Schemas
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nombre: String
});

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true },
  imagenes: [String],
  videos: [String],
  categoria: String,
  colores: [String],
  stock: { type: Number, default: 1 },
  destacado: { type: Boolean, default: false },
  activo: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const pedidoSchema = new mongoose.Schema({
  cliente: {
    nombre: String,
    email: String,
    telefono: String,
    direccion: String
  },
  productos: [{
    productoId: mongoose.Schema.Types.ObjectId,
    nombre: String,
    precio: Number,
    cantidad: Number,
    imagen: String
  }],
  total: Number,
  estado: { type: String, default: 'pendiente' }, // pendiente, confirmado, enviado, entregado
  notas: String,
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);
const Producto = mongoose.model('Producto', productoSchema);
const Pedido = mongoose.model('Pedido', pedidoSchema);

// Middleware de autenticación
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// ============ RUTAS AUTH ============

// Registrar admin (solo para setup inicial)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    
    // Verificar si ya existe un admin
    const adminExiste = await Admin.findOne({ email });
    if (adminExiste) return res.status(400).json({ error: 'Admin ya existe' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword, nombre });
    await admin.save();
    
    res.json({ message: 'Admin creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login admin
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ error: 'Credenciales inválidas' });
    
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) return res.status(400).json({ error: 'Credenciales inválidas' });
    
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      admin: { 
        id: admin._id, 
        email: admin.email, 
        nombre: admin.nombre 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ RUTAS PRODUCTOS ============

// Obtener todos los productos (público)
app.get('/api/productos', async (req, res) => {
  try {
    const { categoria, destacados } = req.query;
    let filtro = { activo: true };
    
    if (categoria) filtro.categoria = categoria;
    if (destacados === 'true') filtro.destacado = true;
    
    const productos = await Producto.find(filtro).sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un producto (público)
app.get('/api/productos/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear producto (admin)
app.post('/api/productos', authMiddleware, async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria, colores, stock, destacado, imagenes } = req.body;
    
    const producto = new Producto({
      nombre,
      descripcion,
      precio: parseFloat(precio),
      imagenes: imagenes || [],
      videos: [], // Assuming videos are not sent via JSON body for creation
      categoria,
      colores: colores || [], // Frontend already sends an array of strings
      stock: parseInt(stock) || 1,
      destacado: destacado === 'true'
    });
    
    await producto.save();
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar producto (admin)
app.put('/api/productos/:id', authMiddleware, async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria, colores, stock, destacado, activo, imagenes, videos } = req.body;
    
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        imagenes: imagenes || [],
        videos: videos || [],
        categoria,
        colores: colores || [],
        stock: parseInt(stock),
        destacado: destacado === 'true',
        activo: activo === 'true'
      },
      { new: true }
    );
    
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar producto (admin)
app.delete('/api/productos/:id', authMiddleware, async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ RUTAS PEDIDOS ============

// Crear pedido (público)
app.post('/api/pedidos', async (req, res) => {
  try {
    const pedido = new Pedido(req.body);
    await pedido.save();
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los pedidos (admin)
app.get('/api/pedidos', authMiddleware, async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de pedido (admin)
app.put('/api/pedidos/:id', authMiddleware, async (req, res) => {
  try {
    const { estado, notas } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { estado, notas },
      { new: true }
    );
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas (admin)
app.get('/api/estadisticas', authMiddleware, async (req, res) => {
  try {
    const totalProductos = await Producto.countDocuments({ activo: true });
    const totalPedidos = await Pedido.countDocuments();
    const pedidosPendientes = await Pedido.countDocuments({ estado: 'pendiente' });
    
    const ventasTotal = await Pedido.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    res.json({
      totalProductos,
      totalPedidos,
      pedidosPendientes,
      ventasTotal: ventasTotal[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});