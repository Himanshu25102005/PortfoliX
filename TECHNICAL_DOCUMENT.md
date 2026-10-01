# PortfoliX
## Technical Documentation

Dynamic Portfolio Dashboard — Technical Overview & Implementation

---

## 1. Project Overview

PortfoliX is a full-stack investment portfolio dashboard engineered to track, evaluate, and visualize a static basket of 29 predefined Indian equity holdings across multiple market sectors. The project fulfills a full-stack engineering assignment designed to demonstrate:

- Multi-source financial market data ingestion (Yahoo Finance and Google Finance).
- Backend aggregation, normalization, and mathematical modeling of portfolio performance.
- In-memory time-to-live (TTL) caching to manage upstream rate limits and minimize latency.
- Periodic client-side polling with dynamic animated state synchronization.
- Resilient user interface rendering in the presence of incomplete or delayed external data.

The primary user flow is streamlined: when a user accesses the dashboard, the frontend issues a single unified request to the backend. The backend resolves live market metrics, applies portfolio valuation logic, computes sector summaries, and returns a consolidated dataset. The client displays top-level portfolio totals, sector allocations, and granular holding tables, updating automatically every 15 seconds.

---

## 2. System Architecture

The application adopts a decoupled client-server architecture with clear separation of concerns across presentation, routing, orchestration, market data extraction, and calculation layers.

```
┌────────────────────────────────────────────────────────┐
│                     Client Tier                        │
│         Next.js 16 (React 19, Tailwind CSS v4)         │
│  - StocksDashboard Component                           │
│  - 15-Second Polling Loop (setInterval)                │
│  - Tabular View, Sector Cards, Details Dialog          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP GET /api/portfolio
                            ▼
┌────────────────────────────────────────────────────────┐
│                     API Tier                           │
│               Node.js & Express 5                      │
│  - bin/www.ts (HTTP Listener on Port 5000)             │
│  - src/app.ts (CORS, JSON Parser)                      │
│  - routes/portfolio.routes.ts                          │
│  - controllers/portfolio.controller.ts                 │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Portfolio Processing Layer                  │
│               (services/portfolio.service.ts)          │
│  - Reads Static Holdings (29 Stocks)                   │
│  - Calls External Services Concurrently                │
│  - Applies Calculation Engine (utils/calculations.ts)  │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
                ▼                        ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│      Yahoo Service          │ │       Google Service        │
│ (services/yahoo.service.ts) │ │ (services/google.service.ts)│
│ - Batch Quote Request       │ │ - SerpApi Client            │
│ - In-Memory TTLCache (15s)  │ │ - In-Memory TTLCache (1 hr) │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│        Yahoo Finance        │ │       Google Finance        │
│    (via yahoo-finance2)     │ │        (via SerpApi)        │
└─────────────────────────────┘ └─────────────────────────────┘
```

### Component Responsibilities

- **Frontend (`frontend/`)**: Renders the user interface using Next.js App Router, handles UI state (loading, error, selected stock), orchestrates the 15-second polling interval, and triggers smooth visual transitions for financial updates.
- **Backend API (`Backend/src/app.ts`, `bin/www.ts`)**: Initializes the Express HTTP server, enables CORS middleware for local frontend-backend communication, and exposes health-check and portfolio endpoints.
- **Portfolio Orchestration Service (`portfolio.service.ts`)**: Coordinates parallel data retrieval from Yahoo Finance and SerpApi, feeds raw data into the calculation engine, and stitches together static metadata with calculated results.
- **Market Data Services (`yahoo.service.ts`, `google.service.ts`)**: Encapsulates external API communication, query structuring, response parsing, and error containment.
- **Calculation Layer (`calculations.ts`)**: Pure mathematical functions responsible for calculating position values, portfolio percentages, gains/losses, and aggregated sector statistics.
- **Cache Layer (`utils/cache.ts`)**: A generic, in-memory `TTLCache<T>` that stores key-value pairs with absolute timestamps to prevent redundant external API requests.
- **External Data Providers**:
  - `yahoo-finance2`: Queries live Current Market Prices (CMP).
  - `SerpApi`: Queries Google Finance search results to extract P/E ratios and latest quarterly Earnings Per Share (EPS).

### Why the Frontend Does Not Query External APIs Directly

The frontend is intentionally isolated from external financial providers for several critical reasons:

1. **Credential Protection**: SerpApi requires an API key (`SERP_API_KEY`). Calling SerpApi directly from browser code would expose the secret key in client-side network bundles.
2. **CORS Restrictions**: Direct requests from browser environments to scraping endpoints or financial services are blocked by browser Same-Origin Policies.
3. **Data Normalization & Aggregation**: If the client fetched from Yahoo Finance and SerpApi independently, it would need to make 30+ separate network requests, handle raw HTML/JSON variations, and perform complex joins in client memory.
4. **Shared Caching**: Server-side caching ensures that multiple client instances or periodic refresh cycles share cached data, preserving API quotas.

---

## 3. Data Flow

The complete lifecycle of a portfolio data request proceeds through eleven discrete steps:

```
[User Browser]
      │
      │ 1. Mounts Dashboard & triggers loadPortfolio()
      ▼
[Frontend: services/portfolio.ts]
      │
      │ 2. HTTP GET http://localhost:5000/api/portfolio
      ▼
[Backend: routes/portfolio.routes.ts]
      │
      │ 3. Routes to portfolio.controller.ts -> getCalPortData()
      ▼
[Backend: services/portfolio.service.ts]
      │
      │ 4. Reads 29 static stock records from data/PortfolioInputData.ts
      │
      ├───► 5a. Calls fetchCMPYahoo() (services/yahoo.service.ts)
      │         ├── Check TTLCache (key: "portfolio-cmp")
      │         └── On cache miss: batch quotes via yahooFinance.quote(symbolArr)
      │
      └───► 5b. Calls MainGoogleService() (services/google.service.ts)
                ├── Converts ticker symbols from *.NS to *:NSE
                ├── Executes Promise.all() across 29 symbols
                ├── For each symbol: Check TTLCache (key: symbol)
                └── On cache miss: Query SerpApi engine="google_finance"
      │
      │ 6. Normalize external responses into structured types
      │    (unresolvable values mapped safely to null)
      │
      │ 7. Pass holdings & CMP to Calc_output() (utils/calculations.ts)
      │    (computes investment, present_val, gain_loss, portfolio_percentage)
      │
      │ 8. Merge static data, calculation output, and Google Finance metrics
      │
      │ 9. Pass merged portfolio to calSectorSummary()
      │    (aggregates total_investment, total_present_val, gain_loss by sector)
      ▼
[Backend: portfolio.controller.ts]
      │
      │ 10. Responds HTTP 200 with { success: true, data: [...], sector_summary: [...] }
      ▼
[Frontend: components/Dashboard.tsx]
      │
      │ 11. Stores data in React state, updates lastUpdated timestamp,
      │     and starts/resets 15-second setInterval() timer
```

---

## 4. Portfolio Data Model

The portfolio model consists of 29 predefined Indian equity holdings categorized into three distinct operational domains:

1. **Static Data**: Baseline attributes specified in `data/PortfolioInputData.ts`.
2. **External Data**: Real-time or fundamental market attributes retrieved over the network.
3. **Calculated Data**: Derived financial metrics calculated deterministically on the backend.

### Data Categorization Table

| Category | Field Name | Type | Description / Source |
| :--- | :--- | :--- | :--- |
| **Static** | `stockName` | `string` | Company display name (e.g., "HDFC Bank") |
| **Static** | `purchasePrice` | `number` | Buy price per share in INR (e.g., `1490`) |
| **Static** | `quantity` | `number` | Total shares held in portfolio (e.g., `50`) |
| **Static** | `exchange` | `string` | Exchange identifier / security code (e.g., `"HDFCBANK"`, `"532174"`) |
| **Static** | `sector` | `string \| null` | Business sector (e.g., `"Financial Sector"`, `"Tech Sector"`) |
| **Static** | `yahooSymbol` | `string` | National Stock Exchange ticker format (e.g., `"HDFCBANK.NS"`) |
| **External** | `CMP` | `number \| null` | Current Market Price retrieved from Yahoo Finance |
| **External** | `PE_ratio` | `number \| null` | Price-to-Earnings ratio retrieved from Google Finance via SerpApi |
| **External** | `latestEarnings` | `number \| null` | Latest quarterly Earnings Per Share (EPS) from Google Finance |
| **External** | `symbol` | `string` | Google Finance query identifier (e.g., `"HDFCBANK:NSE"`) |
| **Calculated** | `investment` | `number` | Total capital deployed for the holding (`purchasePrice × quantity`) |
| **Calculated** | `portfolio_percentage` | `number \| null` | Weight of holding relative to total portfolio capital |
| **Calculated** | `present_val` | `number \| null` | Current gross market valuation (`CMP × quantity`) |
| **Calculated** | `gain_loss` | `number \| null` | Absolute monetary return (`present_val − investment`) |

### Sector Summary Model

Sector summaries are generated dynamically via `calSectorSummary()` in `Backend/src/utils/calculations.ts`:

```typescript
export interface Sector_summ_type {
  sector: string;
  total_investment: number;
  total_present_val: number;
  gain_loss: number;
}
```

---

## 5. External Market Data Integration

### 5.1 Yahoo Finance (`yahoo.service.ts`)

- **Role**: Provides the Current Market Price (CMP) for all 29 portfolio assets.
- **Library**: `yahoo-finance2` package.
- **Request Strategy**: Instead of dispatching 29 sequential HTTP requests, the service aggregates all `yahooSymbol` strings (e.g., `["HDFCBANK.NS", "BAJFINANCE.NS", ...]`) into an array and performs a single batched query:
  ```typescript
  const quotes: Quote[] = await yahooFinance.quote(symbolArr);
  ```
- **Mapping & Normalization**: The resulting array is mapped into a `Map<string, Quote>` keyed by symbol. Each holding extracts `matchingQuote?.regularMarketPrice ?? null`.
- **Handling Unavailable Data**: If Yahoo Finance fails to find a quote or returns `undefined` for `regularMarketPrice`, the value defaults to `null`.
- **Operational Limitations**: `yahoo-finance2` relies on public endpoints. These endpoints do not carry official SLA guarantees and are subject to throttling or schema revisions without advance notice.

### 5.2 Google Finance via SerpApi (`google.service.ts`)

- **Role**: Retrieves valuation fundamentals—specifically P/E Ratio and Latest Quarterly Earnings (EPS)—as required by the assignment specification.
- **Access Method**: Google Finance does not provide an official public REST API. SerpApi is used as a structured scraping proxy (`engine: "google_finance"`).
- **Symbol Translation**: Yahoo Finance ticker symbols use the `.NS` suffix for National Stock Exchange listings. SerpApi's Google Finance engine expects `:NSE`. The service transforms symbols dynamically:
  ```typescript
  const parts = holding.yahooSymbol.split(".");
  const googleSymbol = parts[0] + ":NSE";
  ```
- **Field Extraction Logic**:
  - **P/E Ratio**: Located inside the Google Finance Knowledge Graph:
    ```typescript
    const peRatioData = json.knowledge_graph?.key_stats?.stats?.find(
      (item: any) => item.label === "P/E ratio"
    );
    const peRatio = peRatioData ? Number(peRatioData.value) : null;
    ```
  - **Latest Earnings (Quarterly EPS)**: Extracted from the quarterly financial statement tables:
    ```typescript
    const incomeStatement = json.financials?.find(
      (statement: any) => statement.title === "Income statement"
    );
    const quarterlyResults = incomeStatement?.results?.filter(
      (result: any) => result.period_type === "Quarterly"
    );
    const latestQuarter = quarterlyResults?.[0];
    const earningsPerShare = latestQuarter?.table?.find(
      (item: any) => item.title === "Earnings per share"
    );
    const latestEarnings = earningsPerShare ? Number(earningsPerShare.value) : null;
    ```
- **Error Isolation**: Individual symbol requests are wrapped in promises. If SerpApi throws an error or fails to parse a symbol, the error is caught so it does not terminate the rest of the application.

---

## 6. Data Normalization

External APIs expose disparate, heavily nested, and volatile payload formats. Direct transmission of these payloads to the frontend introduces high coupling and fragile client code.

```
Yahoo Quote Object                 Google Finance JSON (SerpApi)
  { regularMarketPrice: 1700.5 }      { knowledge_graph: { key_stats: { ... } }, financials: [...] }
               │                                      │
               └───────────────┬──────────────────────┘
                               │
                               ▼
               [Backend Normalization Boundary]
                               │
                               ▼
                 Internal Normalized Contract
                 {
                   stockName: "HDFC Bank",
                   CMP: 1700.5,
                   PE_ratio: 18.5,
                   latestEarnings: 16.2,
                   present_val: 85025.0,
                   gain_loss: 10525.0
                 }
```

### Architectural Benefits

1. **Frontend Decoupling**: The Next.js frontend depends only on stable TypeScript interfaces (`Portfolio` and `SectorSummaryType`). It is agnostic to whether market data originated from Yahoo Finance, SerpApi, or a future alternative provider.
2. **Predictable Data Types**: Raw numeric strings (e.g., `"18.50"` or `"₹16.20"`) are sanitized and cast to `number | null` on the backend, preventing client-side `NaN` calculation bugs.
3. **Graceful Degradation**: Incomplete upstream records are sanitized into consistent `null` values, enabling uniform fallback rendering (`"N/A"`).

---

## 7. Portfolio Calculations

All portfolio arithmetic is implemented in `Backend/src/utils/calculations.ts` to ensure consistent calculation logic across the application.

### Mathematical Formulas

#### 1. Total Portfolio Investment ($I_{total}$)
Sum of purchase costs across all $N$ holdings:
$$I_{total} = \sum_{i=1}^{N} (\text{purchasePrice}_i \times \text{quantity}_i)$$

#### 2. Individual Holding Investment ($I_i$)
Capital invested in holding $i$:
$$I_i = \text{purchasePrice}_i \times \text{quantity}_i$$

#### 3. Portfolio Percentage Weight ($W_i$)
Proportion of total portfolio capital allocated to holding $i$:
$$W_i = \left(\frac{I_i}{I_{total}}\right) \times 100$$

#### 4. Present Market Value ($V_i$)
Current market worth of holding $i$ based on live CMP:
$$V_i = \begin{cases} \text{CMP}_i \times \text{quantity}_i & \text{if } \text{CMP}_i \neq \text{null} \\ \text{null} & \text{if } \text{CMP}_i = \text{null} \end{cases}$$

#### 5. Holding Gain / Loss ($G_i$)
Net monetary profit or loss for holding $i$:
$$G_i = \begin{cases} V_i - I_i & \text{if } V_i \neq \text{null} \\ \text{null} & \text{if } V_i = \text{null} \end{cases}$$

### Sector-Level Aggregations

Sector metrics are computed by iterating over all holdings that possess a non-null `sector` attribute:
- $\text{Total Sector Investment} = \sum I_{holding}$
- $\text{Total Sector Present Value} = \sum (V_{holding} \text{ or } 0)$
- $\text{Total Sector Gain / Loss} = \sum (G_{holding} \text{ or } 0)$

---

## 8. Caching Strategy

Because financial market providers enforce rate limits and SerpApi bills per search query, PortfoliX implements an in-memory Time-To-Live (TTL) cache located in `Backend/src/utils/cache.ts`.

### Cache Architecture (`TTLCache<T>`)

```typescript
export class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  set(key: string, data: T, ttl: number): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
}
```

### Cache Configuration & Policy

| Service | Cache Key | TTL Value | TTL Duration | Invalidation Policy |
| :--- | :--- | :--- | :--- | :--- |
| **Yahoo Finance (CMP)** | `"portfolio-cmp"` | `15 * 1000` | 15 seconds | Timestamp expiry (`Date.now() > expiresAt`) |
| **Google Finance (SerpApi)** | Stock Symbol (e.g., `"INFY:NSE"`) | `60 * 60 * 1000` | 1 hour (3600s) | Timestamp expiry (`Date.now() > expiresAt`) |

### Engineering Rationale for Differential TTLs

1. **Yahoo CMP (15s TTL)**: Current Market Price fluctuates rapidly during active market hours. A 15-second TTL matches the frontend polling interval, providing near-real-time updates without flooding Yahoo Finance with redundant requests during concurrent client calls.
2. **SerpApi Google Finance (1 Hour TTL)**: P/E ratios and quarterly earnings are fundamental corporate metrics that change only on quarterly announcements or daily closes. Re-fetching fundamentals every 15 seconds would exhaust SerpApi query quotas within minutes without offering any user value. Caching these for 1 hour preserves API credits.

---

## 9. Automatic Data Refresh

The frontend employs a controlled polling mechanism inside `frontend/src/components/Dashboard.tsx` to keep portfolio data current.

### Polling Implementation

```typescript
useEffect(() => {
  let cancelled = false;

  const load = async () => {
    try {
      setError(null);
      const response = await fetchPortfolio();
      if (!response.success) throw new Error("Portfolio request failed");
      if (cancelled) return;

      setPortfolio(response.data);
      setSectors(response.sector_summary);
      setLastUpdated(new Date());
    } catch (error) {
      if (cancelled) return;
      console.error("Portfolio fetch error:", error);
      setError("Unable to load portfolio data.");
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  load(); // Initial invocation
  const interval = setInterval(load, 15_000); // 15-second recurring loop

  return () => {
    cancelled = true;
    clearInterval(interval); // Resource cleanup on component unmount
  };
}, []);
```

### UI Synchronization & Animation

When updated data arrives from the backend:
- Dynamic financial metrics (`CMP`, `present_val`, `gain_loss`, `totalPresentValue`, `totalGainLoss`) update in place.
- The `AnimatedNumber` component uses `framer-motion` springs (`useSpring`, `useTransform`) to animate the numeric transition from the previous value to the new value smoothly.
- The header updates the `lastUpdated` timestamp (`Updated HH:MM:SS`) to give the user immediate visual confirmation of the refresh cycle.

### Why Polling Was Chosen Over WebSockets

For this assignment, client-side HTTP polling at 15-second intervals was selected over WebSockets for specific technical reasons:
- **Upstream Bottleneck**: The backend does not possess a private streaming socket connection to the National Stock Exchange; it must query HTTP-based endpoints (Yahoo Finance / SerpApi). Establishing a WebSocket server would only tunnel periodic HTTP checks through a persistent socket, adding connection management overhead without true tick-by-tick streaming benefits.
- **Architectural Simplicity**: HTTP GET polling is stateless, cache-friendly, and reconnects automatically without custom socket heartbeat or reconnection logic.

---

## 10. Error Handling & Data Availability

The application adopts a defensive posture toward external API reliability. Market data endpoints can fail due to rate limits, network interruptions, or market closures.

### Error Handling Strategies

1. **Non-Fatal External API Failures**: If Yahoo Finance or SerpApi encounters an error, the backend does not crash or respond with a 500 status code for the entire portfolio. Instead, missing fields default to `null`.
2. **Frontend `N/A` Fallbacks**: All presentation components inspect numeric values before formatting:
   ```typescript
   const formatCurrency = (value: number | null) => {
     if (value === null) return "N/A";
     return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
   };
   ```
3. **Safe Metric Arithmetic**: Present value and gain/loss calculations explicitly verify that CMP is not `null` prior to multiplication:
   ```typescript
   const present_val = CMP !== null ? CMP * holding.quantity : null;
   const gain_loss = present_val !== null ? present_val - investment : null;
   ```
4. **User-Facing Retry UI**: If the backend server is unreachable (e.g., server offline or network failure), the dashboard suppresses broken empty tables and displays an informative error card equipped with a manual **Retry** button.

---

## 11. Performance Considerations

All performance optimizations in PortfoliX represent concrete implementations present in the codebase:

1. **Batching Yahoo Finance Quotes**: The backend gathers all 29 ticker symbols into a single array (`symbolArr`) and executes a single batched call (`yahooFinance.quote(symbolArr)`), reducing 29 potential HTTP round trips down to 1.
2. **Concurrent Google Finance Requests**: When the Google Finance cache misses, requests are dispatched concurrently using `Promise.all(GoogleCode.map(fetchGoogleFinance))` rather than sequentially, allowing network I/O to overlap.
3. **In-Memory TTL Caching**: The two-tier cache eliminates duplicate upstream calls during steady-state polling.
4. **Lightweight Normalized Payloads**: The backend transmits only the required scalar fields and aggregated totals, omitting extraneous HTML or metadata from third-party APIs.
5. **Component Unmount Safety**: The polling timer in `Dashboard.tsx` tracks a `cancelled` boolean and clears its interval handle upon unmounting, preventing memory leaks and state updates on unmounted components.

---

## 12. Frontend Design & Responsiveness

The user interface is built using Next.js 16, React 19, and Tailwind CSS v4, organized into four primary functional views:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Header: Title, Description, Refresh Disclaimer, "Updated HH:MM:SS"         │
├─────────────────┬──────────────────┬───────────────────┬───────────────────┤
│ Total Invest.   │ Current Value    │ Total Gain / Loss │ Total Holdings    │
│ ₹4,19,414.00    │ ₹4,85,120.50     │ +₹65,706.50 ▲     │ 29                │
├─────────────────┴──────────────────┴───────────────────┴───────────────────┤
│ Sector Performance Summary Table                                           │
│ (Financial Sector, Tech Sector, Consumer, Power, Pipe Sector, Others)      │
├────────────────────────────────────────────────────────────────────────────┤
│ Stock Holdings Table (13 Columns, Horizontal Overflow Support)             │
│ Stock | Buy Price | Qty | Invested | Weight | Exch | CMP | Value | P&L...  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Key UI Components

- **Portfolio Overview Cards**: Four summary cards presenting high-level capital health. Gain/Loss cards feature dynamic color tokens (emerald for profit, red for loss) and Lucide direction icons (`TrendingUp` / `TrendingDown`).
- **Sector Summary Card**: A structured table summarizing capital allocation and return performance across market sectors.
- **Holdings Data Table**: A comprehensive 13-column financial table. To ensure mobile and tablet usability, the table container is wrapped in a focusable `overflow-x-auto` region (`min-w-[1250px]`) allowing smooth horizontal scrolling without disrupting the outer viewport.
- **Stock Details Dialog**: Built on Base UI dialog primitives, clicking any stock row opens an accessible modal displaying an expanded view of the stock's metrics, exchange code, sector badge, and valuation multiples.

---

## 13. Challenges Faced & Solutions

| Challenge | Impact | Technical Solution | Remaining Trade-Off |
| :--- | :--- | :--- | :--- |
| **1. Unofficial Market APIs** | No official, free REST API exists for real-time NSE stock quotes and financial fundamentals. | Combined `yahoo-finance2` for CMP with SerpApi's Google Finance engine for P/E and EPS. | External schema changes or third-party downtime can cause temporary `null` / `N/A` values. |
| **2. Ticker Discrepancies** | Yahoo Finance expects `.NS` (e.g., `INFY.NS`) while Google Finance via SerpApi requires `:NSE` (e.g., `INFY:NSE`). | Implemented string normalization in `google.service.ts` that splits the ticker and appends `:NSE`. | Limited to National Stock Exchange listings; custom ticker mapping required for BSE-only securities. |
| **3. Deeply Nested Payloads** | SerpApi's Google Finance payload places quarterly EPS inside deeply nested statement tables. | Built defensive property access chains (`?.find()`, `?.filter()`) that safely extract targets. | If Google Finance changes its financial statement layout, parser logic must be updated. |
| **4. External Rate Limits** | Polling 29 stocks every 15 seconds would exhaust SerpApi's quota within minutes. | Designed differential TTL caching: 15 seconds for volatile CMP, 1 hour for slowly changing fundamentals. | In-memory cache is ephemeral and clears whenever the Node.js server process restarts. |
| **5. Partial Data Availability** | Missing CMP or fundamentals would cause `NaN` errors or client crashes if unhandled. | Built strict backend normalization mapping missing values to `null`, and frontend fallback rendering of `"N/A"`. | Financial totals and sector values exclude stocks with missing CMP from present-value sums. |
| **6. Responsive Financial Tables** | Displaying 13 columns of financial data breaks layouts on mobile viewports. | Styled the table with horizontal overflow scrolling (`overflow-x-auto`) and provided a focused modal dialog. | Mobile users must scroll horizontally to view all 13 columns simultaneously. |

---

## 14. Limitations

1. **Predefined Portfolio Scope**: The portfolio currently tracks a fixed dataset of 29 stocks hardcoded in `Backend/src/data/PortfolioInputData.ts`. It does not support user authentication or dynamic adding, updating, or deleting of holdings through the UI.
2. **Third-Party Dependency Risk**: The system relies on unofficial scraping and third-party wrappers. Rate limiting, IP blocks, or upstream structural changes can lead to temporary `N/A` values.
3. **In-Memory Cache Volatility**: The `TTLCache` is maintained in Node.js process memory. Restarting the backend server invalidates all cached entries.
4. **Client-Side Polling**: Updates are requested via HTTP polling rather than real-time server push, introducing a theoretical latency of up to 15 seconds between market ticks.
5. **Hardcoded Localhost Endpoint**: The client API utility in `frontend/services/portfolio.ts` points directly to `http://localhost:5000` rather than consuming an environment variable.

---

## 15. Future Improvements

- **WebSocket / Server-Sent Events (SSE)**: Replace client-side HTTP polling with an SSE or WebSocket stream to push updates only when prices change.
- **Distributed Persistent Caching**: Replace the in-memory `TTLCache` with a Redis instance to preserve cached market data across backend server restarts.
- **Database Persistence & User Portfolios**: Integrate PostgreSQL with Prisma ORM to allow users to create accounts, manage custom holdings, and track transaction history.
- **Configurable Environment Endpoints**: Refactor frontend service URLs to read from `NEXT_PUBLIC_API_URL`.
- **Historical Charting**: Ingest historical price series to render trend charts and technical indicators (e.g., 52-week high/low, moving averages).

---

## 16. Conclusion

PortfoliX demonstrates a practical, resilient full-stack architecture for aggregating and presenting live financial portfolio data. By isolating external provider complexities within dedicated backend services, enforcing two-tier in-memory TTL caching, and structuring data into a normalized contract, the application balances real-time responsiveness with upstream rate-limit conservation. The Next.js frontend delivers a clean, responsive interface equipped with automatic 15-second polling, smooth micro-animations, and resilient fallback handling, ensuring that market data volatility never disrupts the core user experience.
