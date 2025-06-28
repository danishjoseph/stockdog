// dashboard.jsonnet
local grafonnet = import 'github.com/grafana/grafonnet/gen/grafonnet-latest/main.libsonnet';
local var = grafonnet.dashboard.variable;
local table = grafonnet.panel.table;
local queries = import '../queries/main.libsonnet';

local table_panel =
  table.new('Stock')
  + table.queryOptions.withDatasource('grafana-postgresql-datasource', 'edjh8vws68hdse')
  + table.queryOptions.withTargets({
    editorMode: 'code',
    format: 'table',
    rawQuery: true,
    rawSql: queries.asset_table.ASSET_TABLE,
    datasource: 'grafana-postgresql-datasource',
    sql: {
      columns: [
        {
          parameters: [
            {
              name: 'id',
              type: 'functionParameter',
            },
          ],
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
    table: 'asset_exchange',
  })
  + table.gridPos.withW(24)
  + table.gridPos.withH(8)
  + table.gridPos.withW(24);

local isin =
  var.query.new('isin', 'SELECT isin FROM assets')
  + var.query.withDatasource('grafana-postgresql-datasource', 'edjh8vws68hdse');

local industry_sector =
  var.query.new('industry_sector', queries.asset_table.INDUSTRY_SECTOR)
  + var.query.withDatasource('grafana-postgresql-datasource', 'edjh8vws68hdse');


grafonnet.dashboard.new('Stocks available for trading')
+ grafonnet.dashboard.withTags('templated')
+ grafonnet.dashboard.withVariables([isin, industry_sector])
+ grafonnet.dashboard.withPanels(table_panel)


