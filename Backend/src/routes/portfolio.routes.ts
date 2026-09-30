import express from "express";
import { getCalPortData, getHoldings } from "../controllers/portfolio.controller";
const router = express.Router();

router.get('/api/portfolio', getCalPortData)

router.get('/api/health', (req, res) => {
    res.send("API is working")
})

export default router;