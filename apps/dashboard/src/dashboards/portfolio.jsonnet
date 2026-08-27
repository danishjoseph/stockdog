local g = import '../g.libsonnet';
local row = g.panel.row;
local panel = import '../panels/portfolio.libsonnet';
local queries = import '../queries/portfolio.libsonnet';

g.dashboard.new('Portfolio Management')
+ g.dashboard.withTags(['portfolio', 'templated'])
+ g.dashboard.time.withFrom('now-30d')
+ g.dashboard.withPanels(
  [
    panel.currentPortfolio('Current Portfolio', [queries.tradingClose, queries.deliveryVolume]),
    panel.allStocks('All Stocks', queries.getAllStocks),
  ]
)
