import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import jwt from "jsonwebtoken";
import connectDB from './config/db.js';
import userRouter from "./routes/userRoutes.js";
import hotelRouter from './routes/hotelRoutes.js';
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import connectCloudinary from "./config/cloudinary.js";
import { stripeWebHooks } from "./controllers/stripeWebHook.js";

//Configurations
const app = express();
await connectDB();
await connectCloudinary();

const allowedOrigins = [
  "http://localhost:5173",
  "https://stayza.vercel.app",
];

//API to listen Stripe Webhook
app.post('/api/stripe', express.raw({ type: "application/json" }), stripeWebHooks);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

//Middlewares
app.use(express.json());


const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Generate token (use in login/signup controller)
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // user details available in req.user
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

app.get('/', (req, res) => res.send("Working..."));


app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: "You accessed a protected route", user: req.user });
});

app.use('/api/user', userRouter);
app.use('/api/hotel', verifyToken, hotelRouter);
app.use('/api/room', verifyToken, roomRouter);
app.use('/api/bookings', verifyToken, bookingRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
