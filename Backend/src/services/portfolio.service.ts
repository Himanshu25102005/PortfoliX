/* portfolio.service.ts

Main business logic.

Load portfolio.json
Get market data
Combine everything
Calculate portfolio values
Group by sector
Return final portfolio response */

import { holdings_data } from "../data/PortfolioInputData";
import type { Calc_output_val_type, Portfolio_input_type } from "../types/portfolio";
import { Calc_output } from "../utils/calculations";

export const fetchAllHoldings = (): Portfolio_input_type[] => {
    return holdings_data
}

type CombinedOutput = Calc_output_val_type & Portfolio_input_type

export const mergePortfolioData = ():CombinedOutput[] => {
    const data = Calc_output(holdings_data);
    return holdings_data.map((holding, index) => {
        return{
            ...holding,
            ...data[index]
        }
    })
}




