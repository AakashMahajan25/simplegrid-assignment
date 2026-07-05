import { Router } from "express";
import { resetStore } from "../store/store.js";

export const devRouter = Router();

devRouter.post("/reset", (_req, res) => {
  resetStore();
  res.status(204).end();
});
