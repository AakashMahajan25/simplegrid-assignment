import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { productsRouter, vendorsRouter, purchaseOrdersRouter } from "./routes/index.js";
import { NODE_ENV, CORS_ORIGIN } from "./conf.js";

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/vendors", vendorsRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);

app.use(notFoundHandler);
app.use(errorHandler);


export default app;