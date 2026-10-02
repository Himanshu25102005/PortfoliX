import axios from "axios";

import { holdings_data } from "../data/PortfolioInputData";
import type { yahooCMP_type } from "../types/portfolio";

import { TTLCache } from "../utils/cache";

const yahooCache = new TTLCache<yahooCMP_type[]>();

const YAHOO_CACHE_TTL = 60 * 1000;

const fetchYahooPrice = async (
  symbol: string,
): Promise<number | null> => {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
      {
        params: {
          range: "1d",
          interval: "1d",
        },
        timeout: 5000,
      },
    );

    const price =
      response.data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    return typeof price === "number" ? price : null;
  } catch (error) {
    console.error(`Yahoo price failed for ${symbol}:`, error);
    return null;
  }
};

export const fetchCMPYahoo = async (): Promise<yahooCMP_type[]> => {
  const cachedData = yahooCache.get("portfolio-cmp");

  if (cachedData) {
    console.log("Using cached Yahoo data");
    return cachedData;
  }

  const symbolArr = holdings_data.map(
    (holding) => holding.yahooSymbol,
  );

  console.log("Requested symbols:", symbolArr.length);
  console.log("Yahoo symbols:", symbolArr);

  const data: yahooCMP_type[] = await Promise.all(
    symbolArr.map(async (symbol) => {
      const CMP = await fetchYahooPrice(symbol);

      return {
        symbol,
        CMP,
      };
    }),
  );

  const successfulPrices = data.filter(
    (item) => item.CMP !== null,
  ).length;

  console.log(
    `Yahoo prices received: ${successfulPrices}/${data.length}`,
  );

  yahooCache.set(
    "portfolio-cmp",
    data,
    YAHOO_CACHE_TTL,
  );

  return data;
};