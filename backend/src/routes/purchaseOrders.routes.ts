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

purchaseOrdersRouter.post("/:id/approve", (req, res) => {
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  res.json(poService.approvePO(Number(req.params.id), role));
});

purchaseOrdersRouter.post("/:id/receive", (req, res) => {
  res.json(poService.receivePO(Number(req.params.id)));
});