import express from "express";
import cors from "cors";
import portfolioRouter from "./routes/portfolio.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", portfolioRouter);

export default app;