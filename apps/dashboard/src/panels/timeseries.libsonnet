local g = import '../g.libsonnet';
local var = import '../variables/main.libsonnet';
local timeseries = g.panel.timeSeries;
local stat = g.panel.stat;


local targetsArray(targets) = if std.type(targets) == 'string' then [targets] else targets;

local hideAnnotationLines = { options+: { annotations: { lines: { width: 0 }, regions: { opacity: 0 } } } };

local timeseries_chart(title, targets) =
  timeseries.new(title)
  + timeseries.queryOptions.withDatasource(var.common.postgres.datasource, var.common.postgres.uid)
  + timeseries.queryOptions.withTargets([
    {
      format: 'table',
      editorMode: 'code',
      rawQuery: true,
      rawSql: target,
    }
    for target in targetsArray(targets)
  ])
  + timeseries.gridPos.withW(24)
  + timeseries.gridPos.withH(12)
  + timeseries.gridPos.withW(24)
  + timeseries.queryOptions.withTransformations([{
    id: 'joinByField',
    options: {},
  }])
  + hideAnnotationLines
;

{
  delivery_insights: timeseries_chart,
}
