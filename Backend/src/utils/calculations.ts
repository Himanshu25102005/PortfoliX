/* calculations.ts

Handles:

Investment
Portfolio %
Present Value
Gain/Loss
Sector totals */
import { fetchCMPYahoo } from "../services/yahoo.service";
import type {
  Portfolio_input_type,
  Calc_output_val_type,
  yahooCMP_type,
} from "../types/portfolio";

export const Calc_output = (
  data: Portfolio_input_type[],
  CMP_Data: yahooCMP_type[],
): Calc_output_val_type[] => {
  var total_invest: number = 0;
  for (let i: number = 0; i < data.length; i++) {
    total_invest += data[i].purchasePrice * data[i].quantity;
  }

  return data.map((holding, index) => {
    const liveCMPObj = CMP_Data[index];
    const CMP = liveCMPObj?.CMP ?? null;

    const investment = holding.purchasePrice * holding.quantity;
    const portfolio_percentage: number = (investment / total_invest) * 100;

    const present_val = CMP !== null ? CMP * holding.quantity : null;
    const gain_loss = present_val !== null ? present_val - investment : null;

    return {
      investment,
      portfolio_percentage,
      present_val,
      gain_loss,
      CMP: CMP,
    };
  });
};
/* 
const CMP = 100;
data.forEach((val) => {
        const investment:number = val.purchasePrice * val.quantity;
        const portfolio_percentage:number = (investment/total_invest) * 100;
        const present_val:number = CMP * val.quantity;
        const gain_loss:number = present_val-investment

        const temp_obj: Calc_output_val_type = {
            investment: investment,
            portfolio_percentage: portfolio_percentage,
            present_val: present_val,
            gain_loss: gain_loss
        };

        res.push(temp_obj)
    }); */

// return res;
