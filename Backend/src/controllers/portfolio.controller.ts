import { Request, Response, NextFunction } from "express";
import { holdings_data } from "../data/PortfolioInputData";
import type { Portfolio_input_type } from "../types/portfolio";
import {
  mergePortfolioData,
  fetchAllHoldings,
} from "../services/portfolio.service";
import { fetchCMPYahoo } from "../services/yahoo.service";
import { MainGoogleService } from "../services/google.service";
import { calSectorSummary } from "../utils/calculations";

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

export const getCalPortData = async(req: Request, res: Response): Promise<void> => {
  try {
    const data = await mergePortfolioData();
    const sector_summary = calSectorSummary(data);
    res.status(200).json({
      success: true,
      data,
      sector_summary
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      msg: e,
    });
  }
};

export const getYahooCMP = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = await fetchCMPYahoo();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (e) {
    console.error("Yahoo error:", e);

    res.status(500).json({
      success: false,
      msg: "Failed to fetch Yahoo Finance data",
    });
  }
};

export const getGoogleFinData = async(req: Request, res: Response): Promise<void> => {
  try{
    const data = await MainGoogleService();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (e) {
    console.error("Yahoo error:", e);

    res.status(500).json({
      success: false,
      msg: "Failed to fetch Yahoo Finance data",
    });
  }
}