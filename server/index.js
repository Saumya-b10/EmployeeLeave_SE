const dotenv = require("dotenv")
dotenv.config()

const express = require("express")
const cors = require("cors")
const connectDb = require("./config/db");
const authRoutes = require("./routes/authRoutes")
const errorMiddleware = require("./middleware/errorMiddleware")
const reimbursementRoute = require("./routes/reimbursementRoute")
const leaveRoute = require("./routes/leaveRoute")
const userRoleRoute = require("./routes/userRoutes")
const path = require("path");

const app = express()
app.use(cors())
app.use(express.json());

// Static bills & public assets
app.use(express.static(path.join(__dirname, "../client/public")));

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/leave", leaveRoute);
app.use("/api/reimbursement", reimbursementRoute)
app.use("/api/user", userRoleRoute)

// Unified Deployment Logic
if (process.env.NODE_ENV === "production") {
    const clientPath = path.join(__dirname, "../client/dist");
    app.use(express.static(clientPath));

    app.use((req, res) => {
        res.sendFile(path.join(clientPath, "index.html"));
    });
}
else {
    app.get("/", (req, res) => {
        res.send("Swiftly Server is running in development mode (API only)");
    });
}

// Global error Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`server running on ${PORT}`);
    });
});
