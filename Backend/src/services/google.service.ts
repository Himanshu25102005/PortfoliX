/* google.service.ts
Fetch P/E ratio
Fetch latest earnings
Normalize response
Handle Google Finance errors */
import "dotenv/config";
import { getJson } from "serpapi";
import { holdings_data } from "../data/PortfolioInputData";
import { google_out_type } from "../types/portfolio";

export const fetchGoogleFinance = (
  symbol: string,
): Promise<google_out_type> => {
  return new Promise((resolve, reject) => {
    getJson(
      {
        engine: "google_finance",
        q: symbol,
        api_key: process.env.SERP_API_KEY,
      },
      (json) => {
        try {
          const incomeStatement = json.financials?.find(
            (statement: any) => statement.title === "Income statement",
          );

          const quarterlyResults = incomeStatement?.results?.filter(
            (result: any) => result.period_type === "Quarterly",
          );

          const latestQuarter = quarterlyResults?.[0];

          const earningsPerShare = latestQuarter?.table?.find(
            (item: any) => item.title === "Earnings per share",
          );

          const latestEarnings = earningsPerShare
            ? Number(earningsPerShare.value)
            : null;

          const peRatioData = json.knowledge_graph?.key_stats?.stats?.find(
            (item: any) => item.label === "P/E ratio",
          );

          const peRatio = peRatioData ? Number(peRatioData.value) : null;

          resolve({
            symbol,
            PE_ratio: peRatio,
            latestEarnings,
          });
        } catch (error) {
          reject(error);
        }
      },
    );
  });
};

export const MainGoogleService = async (): Promise<google_out_type[]> => {
  const GoogleCode: string[] = [];
  holdings_data.map((holding, index) => {
    const str = holding.yahooSymbol;
    const parts = str.split(".");
    parts[0] = parts[0] + ":NSE";
    GoogleCode.push(parts[0]);
  });

  const results = await Promise.all(
    GoogleCode.map((symbol) => fetchGoogleFinance(symbol)),
  );

  return results;
};
