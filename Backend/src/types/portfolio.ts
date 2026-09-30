/* portfolio.ts

TypeScript types/interfaces for:

Portfolio holding
Market data
Processed stock
Sector summary
Portfolio response */

export interface Portfolio_input_type {
  stockName: string;
  purchasePrice: number;
  quantity: number;
  exchange: string;
  sector: string | null;
  yahooSymbol:string
}

export interface Calc_output_val_type {
  investment: number | null;
  portfolio_percentage: number | null;
  present_val: number | null;
  gain_loss: number | null;
}

export interface yahooCMP_type {
  symbol: string;
  CMP: number | null;
}
