import { holdings_data } from "../data/PortfolioInputData";
import type {
  Calc_output_val_type,
  google_out_type,
  Portfolio_input_type,
} from "../types/portfolio";
import { Calc_output } from "../utils/calculations";
import { MainGoogleService } from "./google.service";
import { fetchCMPYahoo } from "./yahoo.service";

export const fetchAllHoldings = (): Portfolio_input_type[] => {
  return holdings_data;
};

export type CombinedOutput = Calc_output_val_type & Portfolio_input_type &google_out_type;

export const mergePortfolioData = async (): Promise<CombinedOutput[]> => {
  const CMP_Data = await fetchCMPYahoo(); 
  const GoogleData = await MainGoogleService();
  const data = Calc_output(holdings_data,CMP_Data);
  return holdings_data.map((holding, index) => {
    return {
      ...holding,
      ...data[index],
      ...GoogleData[index]
    };
  });
};
