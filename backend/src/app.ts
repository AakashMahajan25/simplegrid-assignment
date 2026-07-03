import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

const NODE_ENV = process.env.NODE_ENV ?? "development";

app.use(cors({ origin: "*" }));
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

app.use(notFoundHandler);
app.use(errorHandler);

export default app;