import express, { Router } from "express";
import portfolioRouter from "./routes/portfolio.routes";

const app = express();


app.use("/", portfolioRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



export default app;