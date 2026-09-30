/* calculations.ts

Handles:

Investment
Portfolio %
Present Value
Gain/Loss
Sector totals */
import type { Portfolio_input_type, Calc_output_val_type } from "../types/portfolio";

export const Calc_output = (data:Portfolio_input_type[]):Calc_output_val_type[] => {
    const res:Calc_output_val_type[] = [];
    var total_invest:number = 0;
    const CMP = 1000;
    for(let i:number =0; i<data.length; i++)
    {
        total_invest += data[i].purchasePrice * data[i].quantity;
    }
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
    });

    return res;
}