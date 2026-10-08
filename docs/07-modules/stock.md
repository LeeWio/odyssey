# Stock

Stock is a quote card attached to a moment. It is not a portfolio, a ledger, or its own route.

## Data

- Search: `GET /api/v1/public/market/stocks/search`
- Trend: `GET /api/v1/public/market/stocks/{symbol}/trend?period=1M`
- Client: `lib/features/stock` (`useSearchStocksQuery`, `useGetStockTrendQuery`)
- A moment stores `stockSymbol`. The card always requests the one-month trend.

## Surfaces

| Surface         | Path       | Notes                                                      |
| --------------- | ---------- | ---------------------------------------------------------- |
| Moment card     | `/moments` | `StockTrendCard` renders only when the moment has a symbol |
| Moment composer | publisher  | `stock-selector.tsx` searches, then previews the same card |

Loading uses a skeleton. A failed quote shows an empty state. There is no watchlist and no persisted holding.

## Not this module

Homepage and cockpit market widgets that use local fixtures are separate. Do not describe them as this quote API.
