local g = import '../g.libsonnet';
local query = import '../queries/main.libsonnet';
local common = import '../variables/common.libsonnet';
local var = g.dashboard.variable;


local isin =
  var.query.new('isin', query.candlestick.asset_name_with_isin)
  + var.query.withDatasource(common.postgres.datasource, common.postgres.uid);

local industrySector =
  var.query.new('industry_sector', query.assetTable.INDUSTRY_SECTOR)
  + var.query.generalOptions.withLabel('Industry/Sector')
  + var.query.withDatasource(common.postgres.datasource, common.postgres.uid)
  + var.query.selectionOptions.withIncludeAll();

local exchange = var.custom.new(
  'exchange',
  values=[
    { key: 'NSE', value: 'NSE' },
    { key: 'BSE', value: 'BSE' },
    { key: 'NSE/BSE', value: 'NSE/BSE' },
  ]
);

{
  isin: isin,
  industrySector: industrySector,
  exchange: exchange,
}
