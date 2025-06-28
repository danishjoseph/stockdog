local grafana = import 'grafonnet/grafana.libsonnet';
local table = import 'grafonnet/table_panel.libsonnet';
local template = import 'grafonnet/template.libsonnet';

local INDUSTRY_SECTOR_QUERY = |||
  SELECT industry ||  ' - '  || sector  AS __text , industry || ' - ' || sector as __value
  FROM assets
  WHERE industry ILIKE '%$__searchFilter%' OR sector ILIKE '%$__searchFilter%'
|||;

local isin = template.new(
  name='isin',
  query='SELECT isin FROM assets',
  datasource='grafana-postgresql-datasource'
);

local industry_sector = template.new(
  name='industry_sector',
  label='Industry/Sector',
  query=INDUSTRY_SECTOR_QUERY,
  datasource='grafana-postgresql-datasource'
);

grafana.dashboard.new(
  timezone='utc',
  title='Stock Dashey',
  uid='payment-gateway',
  time_from='now-24h',
)
.addTemplates(
  [
    isin,
    industry_sector,
  ]
)
.addPanel(
  grafana.text.new(
    content='Yippie',
    mode='markdown',
  ),
  gridPos={
    x: 0,
    y: 0,
    w: 24,
    h: 2,
  },
)
.addPanel(
  table.new(
    title='Stocks',
    sort={
      col: 0,
      desc: true,
    },
  ).addTarget(
    {
      editorMode: 'code',
      format: 'table',
      rawQuery: true,
      rawSql: 'SELECT\n  assets.isin,\n  assets.symbol,\n  assets.name,\n  CASE \n    WHEN COUNT(DISTINCT exchange.abbreviation) > 1 THEN \'NSE/BSE\'\n    ELSE MAX(exchange.abbreviation)\n  END as exchange,\n  assets.industry,\n  assets.sector\nFROM\n  asset_exchange as "ae"\n  JOIN assets ON "ae"."assetId" = assets.id\n  JOIN exchange ON "ae"."exchangeId" = exchange.id\nWHERE\n  (assets.industry = SPLIT_PART(\'$industry_sector\', \' - \', 1) OR assets.industry IS NULL)\n  AND (assets.sector = SPLIT_PART(\'$industry_sector\', \' - \', 2) OR assets.sector IS NULL)\nGROUP BY\n  assets.isin,\n  assets.symbol,\n  assets.name,\n  assets.industry,\n  assets.sector;',
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
    }
  ),
  gridPos={
    x: 0,
    y: 2,
    w: 24,
    h: 8,
  },
)
