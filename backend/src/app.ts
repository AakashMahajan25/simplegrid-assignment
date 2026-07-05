import path from "node:path";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler.js";
import { productsRouter, vendorsRouter, purchaseOrdersRouter, devRouter } from "./routes/index.js";
import { NODE_ENV, CORS_ORIGIN } from "./conf.js";

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/vendors", vendorsRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);
app.use("/api/dev", devRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use(express.static(path.resolve("public")));

// SPA fallback. Express 5's path-to-regexp requires a named wildcard
// instead of the bare "*" that worked in Express 4 — and "/*splat" alone
// requires at least one path segment, so it misses the bare "/". The
// "{...}" group makes the segment optional, matching "/" too.
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.resolve("public", "index.html"), (err) => {
    if (err) {
      res.status(404).json({ error: "Not found" });
    }
  });
});

app.use(errorHandler);


export default app;