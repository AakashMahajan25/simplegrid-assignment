import { Router } from "express";
import { store } from "../store/store.js";

export const productsRouter = Router();

productsRouter.get("/", (_req, res) => {
  res.json([...store.products.values()]);
});