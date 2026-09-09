local g = import '../g.libsonnet';
local row = g.panel.row;
local panel = import '../panels/main.libsonnet';
local queries = import '../queries/main.libsonnet';
local var = import '../variables/main.libsonnet';

g.dashboard.new(var.common.candlestick.dashboardName)
+ g.dashboard.withUid(var.common.candlestick.uid)
+ g.dashboard.withTags(['candlesticks', 'templated'])
+ g.dashboard.withAnnotations(panel.candlestick.corporate_action_annotations)
+ g.dashboard.time.withFrom('now-30d')
+ g.dashboard.withVariables([var.candlestick.isin, var.candlestick.industrySector, var.candlestick.exchange])
+ g.dashboard.withPanels(
  [
    panel.candlestick.candlesticks_chart('Daily chart', [queries.candlestick.trading_data, queries.candlestick.simple_moving_average_5d]),
    panel.timeseries.delivery_insights('Delivery Insights', [queries.candlestick.delivery_insights]),
  ]
)
