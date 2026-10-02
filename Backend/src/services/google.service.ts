import "dotenv/config";

import { getJson } from "serpapi";

import { holdings_data } from "../data/PortfolioInputData";
import { google_out_type } from "../types/portfolio";
import { TTLCache } from "../utils/cache";

const googleCache = new TTLCache<google_out_type>();

const GOOGLE_CACHE_TTL = 60 * 60 * 1000;

export const fetchGoogleFinance = async (
  symbol: string,
): Promise<google_out_type> => {
 
  const cachedData = googleCache.get(symbol);

  if (cachedData) {
    return cachedData;
  }

  try {
    const json = await getJson({
      engine: "google_finance",
      q: symbol,
      api_key: process.env.SERP_API_KEY,
    });

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

    const result: google_out_type = {
      symbol,
      PE_ratio: peRatio,
      latestEarnings,
    };

    googleCache.set(symbol, result, GOOGLE_CACHE_TTL);

    return result;
  } catch (error) {
    console.error(`Google Finance failed for ${symbol}:`, error);

    return {
      symbol,
      PE_ratio: null,
      latestEarnings: null,
    };
  }
};

export const MainGoogleService = async (): Promise<google_out_type[]> => {
  const GoogleCode: string[] = [];

  holdings_data.forEach((holding) => {
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