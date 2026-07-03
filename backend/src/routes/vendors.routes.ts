import { Router } from "express";
import { store } from "../store/store.js";

export const vendorsRouter = Router();

vendorsRouter.get("/", (_req, res) => {
  res.json([...store.vendors.values()]);
});