import { Router } from "express";
import * as configService from "../services/config.service.js";

export const configRouter = Router();

configRouter.get("/", (_req, res) => {
  res.json(configService.getConfig());
});

configRouter.put("/", (req, res) => {
  res.json(configService.updateConfig(req.body ?? {}));
});
