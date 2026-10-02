import { holdings_data } from "../data/PortfolioInputData";
import type { yahooCMP_type } from "../types/portfolio";

import createYahooFinance from "yahoo-finance2";
import type { Quote } from "yahoo-finance2/modules/quote";

import { TTLCache } from "../utils/cache";

const yahooFinance = new createYahooFinance({
  suppressNotices: ["yahooSurvey"],
});

const yahooCache = new TTLCache<yahooCMP_type[]>();

const YAHOO_CACHE_TTL = 60 * 1000;

export const fetchCMPYahoo = async (): Promise<yahooCMP_type[]> => {
  const cachedData = yahooCache.get("portfolio-cmp");

  if (cachedData) {
    console.log("Using cached Yahoo data");
    return cachedData;
  }

  const symbolArr: string[] = holdings_data.map(
    (holding) => holding.yahooSymbol,
  );

  console.log("Requested symbols:", symbolArr.length);
  console.log("Yahoo symbols:", symbolArr);

  try {
    console.log("Calling Yahoo Finance...");

    const quotes: Quote[] = await yahooFinance.quote(symbolArr);

    console.log("Yahoo response received:", quotes.length);

    const quoteMap = new Map(
      quotes.map((quote) => [quote.symbol, quote]),
    );

    const data: yahooCMP_type[] = holdings_data.map((holding) => {
      const matchingQuote = quoteMap.get(holding.yahooSymbol);

      return {
        symbol: holding.yahooSymbol,
        CMP: matchingQuote?.regularMarketPrice ?? null,
      };
    });

    yahooCache.set("portfolio-cmp", data, YAHOO_CACHE_TTL);

    return data;
  } catch (error) {
    console.error("Yahoo Finance request failed:", error);

    const fallbackData: yahooCMP_type[] = holdings_data.map(
      (holding) => ({
        symbol: holding.yahooSymbol,
        CMP: null,
      }),
    );

    return fallbackData;
  }
};