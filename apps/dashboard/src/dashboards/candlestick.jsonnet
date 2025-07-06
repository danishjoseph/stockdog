local g = import '../g.libsonnet';
local row = g.panel.row;
local panel = import '../panels/main.libsonnet';
local queries = import '../queries/main.libsonnet';
local var = import '../variables/main.libsonnet';

g.dashboard.new('Daily Data')
+ g.dashboard.withTags(['candlesticks', 'templated'])
+ g.dashboard.time.withFrom('now-30d')
+ g.dashboard.withVariables([var.candlestick.isin, var.candlestick.industrySector, var.candlestick.exchange])
+ g.dashboard.withPanels(
  [
    panel.candlestick.candlesticks_chart('Daily chart', [queries.candlestick.trading_data, queries.candlestick.simple_moving_average_5d]),
    panel.candlestick.candlesticks_chart_combined('Daily chart - Combined NSE/BSE', [queries.candlestick.trading_data_combined, queries.candlestick.simple_moving_average_5d]),
    panel.candlestick.delivery_insights('Delivery Insights', [queries.candlestick.delivery_insights]),
  ]
)
