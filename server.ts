import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "./src/db";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Seed Function ---
  async function seed() {
    // Admin user
    const adminEmail = process.env.ADMIN_EMAIL || "admin@nandvanshi.com";
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: "Nandvanshi Admin",
          role: "admin"
        }
      });
      console.log("Admin seeded.");
    }

    // Categories
    const categories = ["Milk", "Curd", "Paneer", "Butter / Ghee", "Sweets"];
    const catModels = [];
    for (const name of categories) {
      let existing = await prisma.category.findUnique({ where: { name } });
      if (!existing) {
        existing = await prisma.category.create({ data: { name } });
      }
      catModels.push(existing);
    }

    // Products
    const existingProducts = await prisma.product.count();
    if (existingProducts === 0) {
      const milkCat = catModels.find(c => c.name === "Milk");
      const paneerCat = catModels.find(c => c.name === "Paneer");
      const curdCat = catModels.find(c => c.name === "Curd");

      if (milkCat) {
        await prisma.product.create({
          data: {
            name: "Full Cream Buffalo Milk",
            description: "Fresh farm milk with high fat content, perfect for tea and sweets.",
            price: 64,
            unit: "litre",
            image: "https://images.unsplash.com/photo-1563636619-e91000f88f5d?q=80&w=400&auto=format&fit=crop",
            stock: 500,
            categoryId: milkCat.id
          }
        });
      }
      if (paneerCat) {
        await prisma.product.create({
          data: {
            name: "Soft Malai Paneer",
            description: "Freshly made cottage cheese, extra soft and creamy.",
            price: 450,
            unit: "kg",
            image: "https://images.unsplash.com/photo-1567184109411-e2f8e132c774?q=80&w=400&auto=format&fit=crop",
            stock: 100,
            categoryId: paneerCat.id
          }
        });
      }
      if (curdCat) {
        await prisma.product.create({
          data: {
            name: "Sweet Mishti Doi",
            description: "Traditional Bengali sweet curd made with caramelized sugar.",
            price: 45,
            unit: "gram",
            image: "https://images.unsplash.com/photo-1571151631021-3964f434c449?q=80&w=400&auto=format&fit=crop",
            stock: 200,
            categoryId: curdCat.id
          }
        });
      }
    }
  }
  await seed();

  // --- Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin access required" });
    next();
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, phone } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, phone, role: "customer" }
      });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (e) {
      res.status(400).json({ error: "User already exists or invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });

  // Products & Categories
  app.get("/api/categories", async (req, res) => {
    const categories = await prisma.category.findMany({ 
      include: { 
        products: {
          include: { variants: true }
        } 
      } 
    });
    res.json(categories);
  });

  app.get("/api/products", async (req, res) => {
    const products = await prisma.product.findMany({ 
      include: { 
        category: true,
        variants: true
      } 
    });
    res.json(products);
  });

  // Admin Product Management
  app.post("/api/admin/products", authenticateToken, isAdmin, async (req, res) => {
    const { name, description, price, unit, image, stock, categoryId, variants } = req.body;
    try {
      const product = await prisma.product.create({
        data: { 
          name, 
          description, 
          price: parseFloat(price), 
          unit, 
          image, 
          stock: parseInt(stock), 
          categoryId,
          variants: {
            create: variants?.map((v: any) => ({
              name: v.name,
              price: parseFloat(v.price),
              stock: parseInt(v.stock)
            })) || []
          }
        },
        include: { variants: true }
      });
      res.json(product);
    } catch (e) {
      res.status(400).json({ error: "Failed to create product" });
    }
  });

  // Orders
  app.post("/api/orders", authenticateToken, async (req: any, res) => {
    const { items, totalAmount, deliveryType, scheduledDate, instructions } = req.body;
    try {
      const order = await prisma.order.create({
        data: {
          userId: req.user.id,
          totalAmount,
          deliveryType,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          instructions,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      });
      res.json(order);
    } catch (e) {
      console.error(e);
      res.status(400).json({ error: "Failed to place order" });
    }
  });

  app.get("/api/orders/my", authenticateToken, async (req: any, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { 
        items: { 
          include: { 
            product: true,
            variant: true
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  });

  // Admin Order Management
  app.get("/api/admin/orders", authenticateToken, isAdmin, async (req, res) => {
    const orders = await prisma.order.findMany({
      include: { 
        user: true, 
        items: { 
          include: { 
            product: true,
            variant: true
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  });

  app.patch("/api/admin/orders/:id/status", authenticateToken, isAdmin, async (req, res) => {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(order);
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
