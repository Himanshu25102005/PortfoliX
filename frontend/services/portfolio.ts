import { PortfolioResponse } from "../types/portfolio";

const API_URL = "http://localhost:5000";

export const fetchPortfolio = async (): Promise<PortfolioResponse> => {
  const response = await fetch(`${API_URL}/api/portfolio`);

  if (!response.ok) {
    throw new Error("Failed to fetch portfolio data");
  }

  const data: PortfolioResponse = await response.json();

  return data;
};