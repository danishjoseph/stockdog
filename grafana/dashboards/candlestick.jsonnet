local grafonnet = import 'github.com/grafana/grafonnet/gen/grafonnet-latest/main.libsonnet';
local var = grafonnet.dashboard.variable;
local candlestick = grafonnet.panel.candlestick;

local queries = import '../queries/main.libsonnet';

local isin =
  var.query.new('isin', queries.candlestick.asset_name_with_isin)
  + var.query.withDatasource('grafana-postgresql-datasource', 'edjh8vws68hdse');

local exchange =
  var.custom.new(
    'exchange',
    [
      { key: 'NSE', value: 'NSE' },
      { key: 'BSE', value: 'BSE' },
    ]
  );

local industry_sector =
  var.query.new('industry_sector', queries.asset_table.INDUSTRY_SECTOR)
  + var.query.withDatasource('grafana-postgresql-datasource', 'edjh8vws68hdse');

local candlesticks_chart =
  candlestick.new('Daily chart')
  + candlestick.queryOptions.withDatasource('grafana-postgresql-datasource', 'edjh8vws68hdse')
  + candlestick.options.withMode('candles+volume')
  + candlestick.options.withCandleStyle('candles')
  + candlestick.options.withColorStrategy('open-close')
  + candlestick.options.colors.withUp('green')
  + candlestick.options.colors.withDown('red')
  + candlestick.gridPos.withW(24)
  + candlestick.gridPos.withH(12)
  + candlestick.gridPos.withW(24)
  + candlestick.queryOptions.withTargets([
    {
      datasource: {
        type: 'grafana-postgresql-datasource',
        uid: 'edjh8vws68hdse',
      },
      editorMode: 'code',
      format: 'table',
      hide: false,
      rawQuery: true,
      rawSql: queries.candlestick.trading_data,
      refId: 'Trading data',
      sql: {
        columns: [
          {
            parameters: [],
            type: 'function',
          },
        ],
        groupBy: [
          {
            property: {
              type: 'string',
            },
            type: 'groupBy',
          },
        ],
        limit: 50,
      },
    },
    {
      datasource: {
        type: 'grafana-postgresql-datasource',
        uid: 'edjh8vws68hdse',
      },
      editorMode: 'code',
      format: 'table',
      hide: false,
      rawQuery: true,
      rawSql: queries.candlestick.simple_moving_average_5d,
      refId: '5 day Moving Average',
      sql: {
        columns: [
          {
            parameters: [],
            type: 'function',
          },
        ],
        groupBy: [
          {
            property: {
              type: 'string',
            },
            type: 'groupBy',
          },
        ],
        limit: 50,
      },
    },
  ])
  + candlestick.queryOptions.withTransformations([{
    id: 'joinByField',
    options: {},
  }])
  + candlestick.options.withIncludeAllFields(true)
;
local candlesticks_chart_combined =
  candlestick.new('Daily chart - Combined NSE/BSE')
  + candlestick.queryOptions.withDatasource('grafana-postgresql-datasource', 'edjh8vws68hdse')
  + candlestick.options.withMode('candles+volume')
  + candlestick.options.withCandleStyle('candles')
  + candlestick.options.withColorStrategy('open-close')
  + candlestick.options.colors.withUp('green')
  + candlestick.options.colors.withDown('red')
  + candlestick.gridPos.withW(24)
  + candlestick.gridPos.withH(12)
  + candlestick.gridPos.withW(24)
  + candlestick.queryOptions.withTargets([
    {
      datasource: {
        type: 'grafana-postgresql-datasource',
        uid: 'edjh8vws68hdse',
      },
      editorMode: 'code',
      format: 'table',
      hide: false,
      rawQuery: true,
      rawSql: queries.candlestick.trading_data_combined,
      refId: 'Trading data',
      sql: {
        columns: [
          {
            parameters: [],
            type: 'function',
          },
        ],
        groupBy: [
          {
            property: {
              type: 'string',
            },
            type: 'groupBy',
          },
        ],
        limit: 50,
      },
    },
    {
      datasource: {
        type: 'grafana-postgresql-datasource',
        uid: 'edjh8vws68hdse',
      },
      editorMode: 'code',
      format: 'table',
      hide: false,
      rawQuery: true,
      rawSql: queries.candlestick.simple_moving_average_5d,
      refId: '5 day Moving Average',
      sql: {
        columns: [
          {
            parameters: [],
            type: 'function',
          },
        ],
        groupBy: [
          {
            property: {
              type: 'string',
            },
            type: 'groupBy',
          },
        ],
        limit: 50,
      },
    },
  ])
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
local delivery_insights =
  candlestick.new('Delivery Insights')
  + candlestick.queryOptions.withDatasource('grafana-postgresql-datasource', 'edjh8vws68hdse')
  + candlestick.options.withMode('timeSeries')
  + candlestick.gridPos.withW(24)
  + candlestick.gridPos.withH(12)
  + candlestick.gridPos.withW(24)
  + candlestick.queryOptions.withTargets([
    {
      datasource: {
        type: 'grafana-postgresql-datasource',
        uid: 'edjh8vws68hdse',
      },
      editorMode: 'code',
      format: 'table',
      hide: false,
      rawQuery: true,
      rawSql: queries.candlestick.delivery_insights,
      refId: 'Delivery Insights',
    },
  ])
  + candlestick.queryOptions.withTransformations([{
    id: 'joinByField',
    options: {},
  }])
  + candlestick.options.withIncludeAllFields(true);

grafonnet.dashboard.new('Daily Data')
+ grafonnet.dashboard.withTags('templated')
+ grafonnet.dashboard.withVariables([isin, industry_sector, exchange])
+ grafonnet.dashboard.withPanels([candlesticks_chart, candlesticks_chart_combined, delivery_insights])
+ grafonnet.dashboard.time.withFrom('now-30d')
