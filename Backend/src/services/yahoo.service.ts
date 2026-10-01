/* yahoo.service.ts
Fetch CMP from Yahoo Finance
Normalize Yahoo response
Handle Yahoo errors */

import { holdings_data } from "../data/PortfolioInputData";
import type {
  Calc_output_val_type,
  Portfolio_input_type,
  yahooCMP_type,
} from "../types/portfolio";
import createYahooFinance from "yahoo-finance2";
import quote, { type Quote } from "yahoo-finance2/modules/quote";

/* async function fetchIndianStockPrices() {
  const tickers = ['RELIANCE.NS', 'TCS.NS', '500325.BO'];
  
  try {
    const quotes = await yahooFinance.quote(tickers);
    
    quotes.forEach(stock => {
      console.log(`${stock.symbol}: ₹${stock.regularMarketPrice}`);
    });
  } catch (error) {
    console.error("Error retrieving price data:", error);
  }
} */

/* interface symbols {
  name: string;
  symbol: string;
} */
const yahooFinance = new createYahooFinance();

export const fetchCMPYahoo = async (): Promise<yahooCMP_type[]> => {
  const symbolArr: string[] = holdings_data.map(
    (holding) => holding.yahooSymbol,
  );

  console.log("Requested symbols:", symbolArr.length);
  console.log("Yahoo symbols:", symbolArr);

  const quotes: Quote[] = await yahooFinance.quote(symbolArr);

  console.log("Received quotes:", quotes.length);

  const quoteMap = new Map(quotes.map((quote) => [quote.symbol, quote]));

  const data: yahooCMP_type[] = holdings_data.map((holding) => {
    const matchingQuote = quoteMap.get(holding.yahooSymbol);
    // console.log("matching quote: ", matchingQuote);
    return {
      symbol: holding.yahooSymbol,
      CMP: matchingQuote?.regularMarketPrice ?? null,
    };
  });

  return data;
};
