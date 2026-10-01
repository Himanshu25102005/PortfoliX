import { holdings_data } from "../data/PortfolioInputData";
import type { yahooCMP_type } from "../types/portfolio";

import createYahooFinance from "yahoo-finance2";
import quote, { type Quote } from "yahoo-finance2/modules/quote";
import { TTLCache } from "../utils/cache";

const yahooFinance = new createYahooFinance();

const yahooCache = new TTLCache<yahooCMP_type[]>();

const YAHOO_CACHE_TTL = 15 * 1000; // 15 seconds

export const fetchCMPYahoo = async (): Promise<yahooCMP_type[]> => {

  const cachedData = yahooCache.get("portfolio-cmp");

  if (cachedData) {
    console.log("using Cahche data ")
    return cachedData;
  }

  const symbolArr: string[] = holdings_data.map(
    (holding) => holding.yahooSymbol,
  );

  console.log("Requested sYmbols:", symbolArr.length);
  console.log("Yahoo symbols:", symbolArr);

  const quotes: Quote[] = await yahooFinance.quote(symbolArr);

  console.log("Received quotees:", quotes.length);

  const quoteMap = new Map(quotes.map((quote) => [quote.symbol, quote]));

  const data: yahooCMP_type[] = holdings_data.map((holding) => {
    const matchingQuote = quoteMap.get(holding.yahooSymbol);

    return {
      symbol: holding.yahooSymbol,
      CMP: matchingQuote?.regularMarketPrice ?? null,
    };
  });

  yahooCache.set("portfolio-cmp", data, YAHOO_CACHE_TTL);

  return data;
};
