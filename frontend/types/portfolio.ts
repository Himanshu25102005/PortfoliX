export interface Portfolio {
  stockName: string;
  purchasePrice: number;
  quantity: number;
  investment: number;
  portfolio_percentage: number;
  exchange: string;
  sector: string | null;
  yahooSymbol: string;
  CMP: number | null;
  present_val: number | null;
  gain_loss: number | null;
  symbol: string;
  PE_ratio: number | null;
  latestEarnings: number | null;
}

export interface SectorSummaryType {
  sector: string;
  total_investment: number;
  total_present_val: number;
  gain_loss: number;
}

export interface PortfolioResponse {
  success: boolean;
  data: Portfolio[];
  sector_summary: SectorSummaryType[];
}