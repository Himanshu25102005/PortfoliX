/* portfolio.controller.ts
getPortfolio()
Receives request
Calls portfolio service
Sends response/error */
import { Request, Response, NextFunction } from "express";
import { holdings_data } from "../data/PortfolioInputData";
import type { Portfolio_input_type } from "../types/portfolio";
import {
  mergePortfolioData,
  fetchAllHoldings,
} from "../services/portfolio.service";

export const getHoldings = (req: Request, res: Response): void => {
  try {
    const data = fetchAllHoldings();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      msg: e,
    });
  }
};

export const getCalPortData = (req: Request, res: Response): void => {
  try {
    const data = mergePortfolioData();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      msg: e,
    });
  }
};
