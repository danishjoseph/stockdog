local g = import '../g.libsonnet';
local var = import '../variables/main.libsonnet';

local table = g.panel.table;
local standardOptions = table.standardOptions;
local override = standardOptions.override;
local datasourceOptions = var.common.postgres;

{
  currentPortfolio(title, targets):
    local targetsArray = if std.type(targets) == 'string' then [targets] else targets;
    table.new(title)
    + table.queryOptions.withDatasource(datasourceOptions.datasource, datasourceOptions.uid)
    + table.queryOptions.withTargets([
      {
        format: if std.type(targets) != 'string' then 'time_series' else 'table',
        editorMode: 'code',
        rawQuery: true,
        rawSql: target,
      }
      for target in targetsArray
    ])
    + table.queryOptions.withTransformations([
      {
        id: 'timeSeriesTable',
        options: {},
      },
      {
        id: 'merge',
        options: {},
      },
      {
        id: 'organize',
        options: {
          indexByName: {
            isin: 0,
            symbol: 1,
            name: 2,
            exchanges: 3,
            'Trend #A': 4,
            'Trend #B': 5,
            industry: 6,
            sector: 7,
          },
          renameByName: {
            isin: 'ISIN',
            symbol: 'Symbol',
            name: 'Name',
            exchanges: 'Exchanges',
            'Trend #A': 'Stock Price',
            'Trend #B': 'Delivery Volume',
            industry: 'Industry',
            sector: 'Sector',
          },
        },
      },
    ])
    + table.fieldConfig.defaults.custom.withFilterable()
    + table.options.footer.withEnablePagination()
    + table.fieldConfig.defaults.custom.withDisplayMode('gauge')
    + table.fieldConfig.defaults.custom.cellOptions.TableBarGaugeCellOptions.withMode('gradient')
    + standardOptions.withOverrides([
      // Override 1
      override.byName.new('symbol')
      + override.byName.withProperty('custom.cellOptions', { type: 'color-text' })
      + override.byName.withProperty('links', [{
        title: 'daily-data',
        url: 'd/' + var.common.candlestick.uid + '/daily-data?orgId=1&from=${__from}&to=${__to}&timezone=utc' + '&var-isin=${__data.fields.ISIN}' + '&var-exchange=${__data.fields.exchange}',
        targetBlank: true,
      }]),
    ])
    + table.gridPos.withH(16)
    + table.gridPos.withW(24),

  allStocks(title, targets):
    table.new(title)
    + table.queryOptions.withDatasource(datasourceOptions.datasource, datasourceOptions.uid)
    + table.queryOptions.withTargets([{
      format: 'table',
      editorMode: 'code',
      rawQuery: true,
      rawSql: targets,
    }])
    + table.fieldConfig.defaults.custom.withFilterable()
    + table.options.footer.withEnablePagination()
    + table.fieldConfig.defaults.custom.withDisplayMode('gauge')
    + table.fieldConfig.defaults.custom.cellOptions.TableBarGaugeCellOptions.withMode('gradient')
    + standardOptions.withOverrides([
      // Override 1
      override.byName.new('symbol')
      + override.byName.withProperty('custom.cellOptions', { type: 'color-text' })
      + override.byName.withProperty('links', [{
        title: 'daily-data',
        url: 'd/' + var.common.candlestick.uid + '/daily-data?orgId=1&from=${__from}&to=${__to}&timezone=utc' + '&var-isin=${__data.fields.isin}' + '&var-exchange=${__data.fields.exchange}',
        targetBlank: true,
      }]),
    ])
    + table.gridPos.withH(16)
    + table.gridPos.withW(24),
}
