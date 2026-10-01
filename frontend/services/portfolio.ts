import { PortfolioResponse } from "../types/portfolio";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchPortfolio = async (): Promise<PortfolioResponse> => {
  const response = await fetch(`${API_URL}/api/portfolio`);

  if (!response.ok) {
    throw new Error("Failed to fetch portfolio data");
  }

  const data: PortfolioResponse = await response.json();

  return data;
};