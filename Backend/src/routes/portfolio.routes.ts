import express from "express";
import {
  getCalPortData,
  getGoogleFinData,
  getHoldings,
  getYahooCMP,
} from "../controllers/portfolio.controller";
import { fetchCMPYahoo } from "../services/yahoo.service";
const router = express.Router();

router.get("/api/portfolio", getGoogleFinData);

router.get("/api/health", (req, res) => {
  res.send("API is working");
});

export default router;
