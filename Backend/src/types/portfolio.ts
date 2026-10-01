export interface Portfolio_input_type {
  stockName: string;
  purchasePrice: number;
  quantity: number;
  exchange: string;
  sector: string | null;
  yahooSymbol: string;
}

export interface Calc_output_val_type {
  investment: number ;
  portfolio_percentage: number | null;
  present_val: number | null;
  gain_loss: number | null;
  CMP: number | null;
}

export interface yahooCMP_type {
  symbol: string;
  CMP: number | null;
}

export interface google_out_type {
  symbol: string;
  PE_ratio: number | null;
  latestEarnings: number | null;
}

export interface Sector_summ_type {
  sector: string;
  total_investment: number;
  total_present_val: number;
  gain_loss: number;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}