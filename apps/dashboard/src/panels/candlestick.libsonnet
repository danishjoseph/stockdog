local var = import '../variables/main.libsonnet';
local grafonnet = import 'github.com/grafana/grafonnet/gen/grafonnet-latest/main.libsonnet';
local candlestick = grafonnet.panel.candlestick;


local targetsArray(targets) = if std.type(targets) == 'string' then [targets] else targets;

local candlesticks_chart(title, targets) =
  candlestick.new(title)
  + candlestick.queryOptions.withDatasource(var.common.postgres.datasource, var.common.postgres.uid)
  + candlestick.queryOptions.withTargets([
    {
      format: 'table',
      editorMode: 'code',
      rawQuery: true,
      rawSql: target,
    }
    for target in targetsArray(targets)
  ])
  + candlestick.options.withMode('candles+volume')
  + candlestick.options.withCandleStyle('candles')
  + candlestick.options.withColorStrategy('open-close')
  + candlestick.options.colors.withUp('green')
  + candlestick.options.colors.withDown('red')
  + candlestick.gridPos.withW(24)
  + candlestick.gridPos.withH(12)
  + candlestick.gridPos.withW(24)
  + candlestick.queryOptions.withTransformations([{
    id: 'joinByField',
    options: {},
  }])
  + candlestick.options.withIncludeAllFields(true)
;

local candlesticks_chart_combined(title, targets) =
  candlestick.new(title)
  + candlestick.queryOptions.withDatasource(var.common.postgres.datasource, var.common.postgres.uid)
  + candlestick.queryOptions.withTargets([
    {
      format: 'table',
      editorMode: 'code',
      rawQuery: true,
      rawSql: target,
    }
    for target in targetsArray(targets)
  ])
  + candlestick.options.withMode('candles+volume')
  + candlestick.options.withCandleStyle('candles')
  + candlestick.options.withColorStrategy('open-close')
  + candlestick.options.colors.withUp('green')
  + candlestick.options.colors.withDown('red')
  + candlestick.gridPos.withW(24)
  + candlestick.gridPos.withH(12)
  + candlestick.gridPos.withW(24)
  + candlestick.queryOptions.withTransformations([{
    id: 'joinByField',
    options: {},
  }])
  + candlestick.options.withIncludeAllFields(true)
  + candlestick.standardOptions.withOverrides(
    [
      {
        matcher: {
          id: 'byName',
          options: 'deliveryPercentage',
        },
        properties: [
          {
            id: 'custom.drawStyle',
            value: 'line',
          },
          {
            id: 'unit',
            value: 'percent',
          },
        ],
      },
    ]
  )
;
local delivery_insights(title, targets) =
  candlestick.new(title)
  + candlestick.queryOptions.withDatasource(var.common.postgres.datasource, var.common.postgres.uid)
  + candlestick.queryOptions.withTargets([
    {
      format: 'table',
      editorMode: 'code',
      rawQuery: true,
      rawSql: target,
    }
    for target in targetsArray(targets)
  ])
  + candlestick.options.withMode('timeSeries')
  + candlestick.gridPos.withW(24)
  + candlestick.gridPos.withH(12)
  + candlestick.gridPos.withW(24)
  + candlestick.queryOptions.withTransformations([{
    id: 'joinByField',
    options: {},
  }])
  + candlestick.options.withIncludeAllFields(true);

{
  candlesticks_chart: candlesticks_chart,
  delivery_insights: delivery_insights,
  candlesticks_chart_combined: candlesticks_chart_combined,
}
