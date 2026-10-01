"use client";

import { useEffect, useState } from "react";
import { Portfolio } from "../../types/portfolio";
import { fetchPortfolio } from "../../services/portfolio";
import { StocksDashboard } from "@/components/Dashboard";

export default function Home() {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const response = await fetchPortfolio();

        setPortfolio(response.data);
      } catch (error) {
        setError("Failed to load portfolio");
        console.log(error)
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, []);

  if (loading) {
    return <div>Loading portfolio...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
    <StocksDashboard/>
    </>
  );
}