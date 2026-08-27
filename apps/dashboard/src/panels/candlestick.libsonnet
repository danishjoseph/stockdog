local g = import '../g.libsonnet';
local var = import '../variables/main.libsonnet';
local candlestick = g.panel.candlestick;
local stat = g.panel.stat;
local standardOptions = candlestick.standardOptions;
local override = standardOptions.override;


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
  + standardOptions.withOverrides(
    [
      override.byName.new('deliveryPercentage')
      + override.byName.withProperty('custom.drawStyle', 'line')
      + override.byName.withProperty('unit', 'percent'),
    ]
  )
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

local stat(title, target) =
  stat.new(title)
  + stat.panelOptions.withTransparent()
  + stat.queryOptions.withDatasource(var.common.postgres.datasource, var.common.postgres.uid)
  + stat.queryOptions.withTargets(
    {
      format: 'table',
      editorMode: 'code',
      rawQuery: true,
      rawSql: target,
    }
  )
  + stat.options.withShowPercentChange(true)
  + stat.options.withGraphMode()
;

{
  candlesticks_chart: candlesticks_chart,
  delivery_insights: delivery_insights,
  candlesticks_chart_combined: candlesticks_chart_combined,
  stat: stat,
}
