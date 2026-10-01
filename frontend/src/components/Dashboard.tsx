"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import {
  Activity,
  BarChart3,
  Building2,
  ChevronRight,
  DollarSign,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Portfolio, SectorSummaryType } from "../../types/portfolio";
import { fetchPortfolio } from "../../services/portfolio";
import AnimatedNumber from "./AnimatedNumber";

/* import { fetchPortfolio } from "@/services/portfolio";

import type {
  Portfolio,
  SectorSummary as SectorSummaryType,
} from "@/types/portfolio"; */

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const trendText = (value: number) =>
  value >= 0
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-red-700 dark:text-red-400";

const formatCurrency = (value: number | null) => {
  if (value === null) return "N/A";

  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

// --------------------------------------------------
// Portfolio Overview
// --------------------------------------------------

function PortfolioOverview({ portfolio }: { portfolio: Portfolio[] }) {
  const totalInvestment = portfolio.reduce(
    (sum, stock) => sum + stock.investment,
    0,
  );

  const totalPresentValue = portfolio.reduce(
    (sum, stock) => sum + (stock.present_val ?? 0),
    0,
  );

  const totalGainLoss = portfolio.reduce(
    (sum, stock) => sum + (stock.gain_loss ?? 0),
    0,
  );

  const cards = [
    {
      label: "Total investment",
      icon: DollarSign,
      value: totalInvestment,
      note: "Original investment",
      tone: "",
      animated: false,
      currency: true,
    },
    {
      label: "Current portfolio value",
      icon: BarChart3,
      value: totalPresentValue,
      note: "Based on current prices",
      tone: "",
      animated: true,
      currency: true,
    },
    {
      label: "Total gain / loss",
      icon: totalGainLoss >= 0 ? TrendingUp : TrendingDown,
      value: totalGainLoss,
      note: totalGainLoss >= 0 ? "Overall gain" : "Overall loss",
      tone: trendText(totalGainLoss),
      animated: true,
      currency: true,
    },
    {
      label: "Holdings",
      icon: Activity,
      value: portfolio.length,
      note: "Stocks in portfolio",
      tone: "",
      animated: false,
      currency: false,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label} className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                {card.label}
              </CardTitle>

              <Icon
                className={`size-4 ${card.tone || "text-muted-foreground"}`}
              />
            </CardHeader>

            <CardContent>
              <div
                className={`text-xl font-bold tabular-nums sm:text-2xl ${card.tone}`}
              >
                {card.animated ? (
                  <AnimatedNumber
                    value={card.value}
                    prefix={card.currency ? "₹" : ""}
                  />
                ) : card.currency ? (
                  formatCurrency(card.value)
                ) : (
                  card.value
                )}
              </div>

              <p
                className={`mt-1 text-xs tabular-nums ${
                  card.tone || "text-muted-foreground"
                }`}
              >
                {card.note}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// --------------------------------------------------
// Sector Summary
// --------------------------------------------------

function SectorSummary({ sectors }: { sectors: SectorSummaryType[] }) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Sector performance</CardTitle>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[650px]">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                Sector
              </th>

              <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground">
                Investment
              </th>

              <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground">
                Current value
              </th>

              <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground">
                Gain / Loss
              </th>
            </tr>
          </thead>

          <tbody>
            {sectors.map((sector) => (
              <tr
                key={sector.sector}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-3 py-3 text-sm font-medium">
                  {sector.sector}
                </td>

                <td className="px-3 py-3 text-right text-sm tabular-nums">
                  {formatCurrency(sector.total_investment)}
                </td>

                <td className="px-3 py-3 text-right text-sm tabular-nums">
                  {formatCurrency(sector.total_present_val)}
                </td>

                <td
                  className={`px-3 py-3 text-right text-sm font-semibold tabular-nums ${trendText(
                    sector.gain_loss,
                  )}`}
                >
                  {formatCurrency(sector.gain_loss)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// --------------------------------------------------
// Stock Details Dialog
// --------------------------------------------------

function StockDetails({
  stock,
  isOpen,
  onClose,
}: {
  stock: Portfolio | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {stock && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="size-5" />
                </div>

                <div className="min-w-0 text-left">
                  <DialogTitle className="text-xl">
                    {stock.stockName}
                  </DialogTitle>

                  <DialogDescription>{stock.exchange}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* CMP + Gain/Loss */}

            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums">
                {formatCurrency(stock.CMP)}
              </span>

              {stock.gain_loss !== null && (
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${trendText(
                    stock.gain_loss,
                  )}`}
                >
                  {stock.gain_loss >= 0 ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}

                  {formatCurrency(stock.gain_loss)}
                </span>
              )}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Purchase price
                </dt>

                <dd className="mt-0.5 text-base font-semibold tabular-nums">
                  {formatCurrency(stock.purchasePrice)}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">Quantity</dt>

                <dd className="mt-0.5 text-base font-semibold tabular-nums">
                  {stock.quantity}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">Investment</dt>

                <dd className="mt-0.5 text-base font-semibold tabular-nums">
                  {formatCurrency(stock.investment)}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">Present value</dt>

                <dd className="mt-0.5 text-base font-semibold tabular-nums">
                  {formatCurrency(stock.present_val)}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">Portfolio %</dt>

                <dd className="mt-0.5 text-base font-semibold tabular-nums">
                  {formatPercentage(stock.portfolio_percentage)}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">P/E ratio</dt>

                <dd className="mt-0.5 text-base font-semibold tabular-nums">
                  {stock.PE_ratio ?? "N/A"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Latest earnings
                </dt>

                <dd className="mt-0.5 text-base font-semibold tabular-nums">
                  {stock.latestEarnings ?? "N/A"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">Sector</dt>

                <dd className="mt-0.5">
                  {stock.sector ? (
                    <Badge variant="outline">{stock.sector}</Badge>
                  ) : (
                    "N/A"
                  )}
                </dd>
              </div>
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------
// Holdings Table
// --------------------------------------------------

function DataTable({
  portfolio,
  onRowClick,
}: {
  portfolio: Portfolio[];
  onRowClick: (stock: Portfolio) => void;
}) {
  const th =
    "px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap sm:px-4";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Activity className="size-5" />
          Stock holdings
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 sm:p-6">
        <div
          role="region"
          aria-label="Stock holdings table"
          tabIndex={0}
          className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <table className="w-full min-w-[1250px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={`${th} text-left`}>Stock</th>

                <th className={`${th} text-right`}>Purchase Price</th>

                <th className={`${th} text-right`}>Qty</th>

                <th className={`${th} text-right`}>Investment</th>

                <th className={`${th} text-right`}>Portfolio %</th>

                <th className={`${th} text-left`}>Exchange</th>

                <th className={`${th} text-right`}>CMP</th>

                <th className={`${th} text-right`}>Present Value</th>

                <th className={`${th} text-right`}>Gain / Loss</th>

                <th className={`${th} text-right`}>P/E</th>

                <th className={`${th} text-right`}>Earnings</th>

                <th className={`${th} text-left`}>Sector</th>

                <th className={`${th} text-right`}>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {portfolio.map((stock) => (
                <tr
                  key={stock.yahooSymbol}
                  className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/50"
                >
                  <th scope="row" className="px-3 py-3 text-left sm:px-4">
                    <div className="whitespace-nowrap">
                      <div className="text-sm font-semibold sm:text-base">
                        {stock.stockName}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {stock.yahooSymbol}
                      </div>
                    </div>
                  </th>

                  <td className="px-3 py-3 text-right text-sm tabular-nums sm:px-4">
                    {formatCurrency(stock.purchasePrice)}
                  </td>

                  <td className="px-3 py-3 text-right text-sm tabular-nums sm:px-4">
                    {stock.quantity}
                  </td>

                  <td className="px-3 py-3 text-right text-sm tabular-nums sm:px-4">
                    {formatCurrency(stock.investment)}
                  </td>

                  <td className="px-3 py-3 text-right text-sm tabular-nums sm:px-4">
                    {formatPercentage(stock.portfolio_percentage)}
                  </td>

                  <td className="px-3 py-3 text-left text-sm sm:px-4">
                    {stock.exchange}
                  </td>

                  <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums sm:px-4">
                    <AnimatedNumber value={stock.CMP} prefix="₹" />
                  </td>

                  <td className="px-3 py-3 text-right text-sm tabular-nums sm:px-4">
                    <AnimatedNumber value={stock.present_val} prefix="₹" />
                  </td>

                  <td
                    className={`px-3 py-3 text-right text-sm font-semibold tabular-nums sm:px-4 ${
                      stock.gain_loss !== null ? trendText(stock.gain_loss) : ""
                    }`}
                  >
                    <AnimatedNumber value={stock.gain_loss} prefix="₹" />
                  </td>

                  <td className="px-3 py-3 text-right text-sm tabular-nums sm:px-4">
                    {stock.PE_ratio ?? "N/A"}
                  </td>

                  <td className="px-3 py-3 text-right text-sm tabular-nums sm:px-4">
                    {stock.latestEarnings ?? "N/A"}
                  </td>

                  <td className="px-3 py-3 text-left sm:px-4">
                    {stock.sector ? (
                      <Badge variant="outline">{stock.sector}</Badge>
                    ) : (
                      "N/A"
                    )}
                  </td>

                  <td className="px-3 py-3 text-right sm:px-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onRowClick(stock)}
                      aria-label={`View details for ${stock.stockName}`}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// --------------------------------------------------
// Main Dashboard
// --------------------------------------------------

export function StocksDashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [sectors, setSectors] = useState<SectorSummaryType[]>([]);

  const [selectedStock, setSelectedStock] = useState<Portfolio | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadPortfolio = async () => {
    try {
      setError(null);

      const response = await fetchPortfolio();

      if (!response.success) {
        throw new Error("Portfolio request failed");
      }

      setPortfolio(response.data);
      setSectors(response.sector_summary);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Portfolio fetch error:", error);

      setError("Unable to load portfolio data.");
    } finally {
      setLoading(false);
    }
  };

  // Initial request + 15 second refresh
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);

        const response = await fetchPortfolio();

        if (!response.success) {
          throw new Error("Portfolio request failed");
        }

        if (cancelled) return;

        setPortfolio(response.data);
        setSectors(response.sector_summary);
        setLastUpdated(new Date());
      } catch (error) {
        if (cancelled) return;

        console.error("Portfolio fetch error:", error);
        setError("Unable to load portfolio data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    const interval = setInterval(load, 15_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleRowClick = (stock: Portfolio) => {
    setSelectedStock(stock);
    setIsDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Loading portfolio...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>

            <Button onClick={loadPortfolio}>
              <RefreshCw className="mr-2 size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-3 py-4 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}

        <div className="mb-6 flex flex-col gap-3 sm:mb-8">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Stock portfolio dashboard
              </h2>

              <p className="text-sm text-muted-foreground sm:text-base">
                Track your investments and monitor market performance.
              </p>
            </div>

            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Market data is sourced from external providers and may be delayed,
            unavailable, or subject to changes in data availability.
          </p>
        </div>

        {/* Overview */}

        <PortfolioOverview portfolio={portfolio} />

        {/* Sector Summary */}

        <SectorSummary sectors={sectors} />

        {/* Holdings */}

        <DataTable portfolio={portfolio} onRowClick={handleRowClick} />

        {/* Details */}

        <StockDetails
          stock={selectedStock}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />
      </div>
    </div>
  );
}
