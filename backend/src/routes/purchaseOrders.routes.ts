import { Router } from "express";
import * as poService from "../services/purchaseOrder.service.js";

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get("/", (_req, res) => {
  res.json(poService.listPOs());
});

purchaseOrdersRouter.get("/:id", (req, res) => {
  res.json(poService.getPO(Number(req.params.id)));
});

purchaseOrdersRouter.post("/", (req, res) => {
  const po = poService.createPO(req.body ?? {});
  res.status(201).json(po);
});
