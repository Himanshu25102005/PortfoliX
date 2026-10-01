import { CombinedOutput } from "../services/portfolio.service";
import { fetchCMPYahoo } from "../services/yahoo.service";
import type {
  Portfolio_input_type,
  Calc_output_val_type,
  yahooCMP_type,
  Sector_summ_type,
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

export const calSectorSummary = (
  data: CombinedOutput[],
): Sector_summ_type[] => {

  const sectorMap = new Map<string, Sector_summ_type>();

  data.forEach((holding) => {

    if (!holding.sector) return;

    const existing = sectorMap.get(holding.sector);

    if (existing) {
      existing.total_investment += holding.investment;
      existing.total_present_val += holding.present_val ?? 0;
      existing.gain_loss += holding.gain_loss ?? 0;
    } else {
      sectorMap.set(holding.sector, {
        sector: holding.sector,
        total_investment: holding.investment,
        total_present_val: holding.present_val ?? 0,
        gain_loss: holding.gain_loss ?? 0,
      });
    }
  });

  return Array.from(sectorMap.values());
};
