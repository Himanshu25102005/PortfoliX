import express from "express";
import {
  getCalPortData,
} from "../controllers/portfolio.controller";
import { fetchCMPYahoo } from "../services/yahoo.service";
const router = express.Router();

router.get("/api/portfolio", getCalPortData);

router.get("/api/health", (req, res) => {
  res.send("API is working");
});

export default router;
