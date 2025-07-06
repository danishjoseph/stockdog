local getAllStocks() =
  local query = |||
    WITH ExchangeInfo AS (
      SELECT
        assets.id AS asset_id,
        CASE
          WHEN COUNT(DISTINCT exchange.abbreviation) > 1 THEN 'NSE/BSE'
          ELSE MAX(exchange.abbreviation)
        END AS exchange
      FROM
        asset_exchange AS AE
      JOIN
        assets ON AE."assetId" = assets.id
      JOIN
        exchange ON AE."exchangeId" = exchange.id
      GROUP BY
        assets.id
    )

    SELECT
      assets.*,
      EI.exchange AS exchange
    FROM
      ExchangeInfo EI
    JOIN
      asset_exchange AS AE ON EI.asset_id = AE."assetId"
    JOIN
      assets ON AE."assetId" = assets.id
    JOIN
      exchange ON AE."exchangeId" = exchange.id
  |||;
  query;

local tradingData(stocks, columns) =
  local stockList = std.join(', ', std.map(function(item) "'" + item + "'", stocks));
  local generateAvgExpressions(columns) =
    std.join(', ', std.map(
      function(item)
        local parts = std.split(item, '.');
        if std.length(parts) != 2 then
          error "Each column must be in the form 'alias.column' (e.g., 'td.volume')"
        else
          'AVG(%s) as %s' % [item, parts[1]]
      ,
      columns
    ));

  local query = |||
    SELECT
        a.isin,
        STRING_AGG(DISTINCT e.abbreviation, '/') AS exchanges,
        a.symbol,
        a.name,
        a.industry,
        a.sector,
        td.date AS time,
        %s -- Placeholder for avgExpressions
    FROM
        assets a
        JOIN asset_exchange ae ON ae."assetId" = a.id
        JOIN exchange e ON e.id = ae."exchangeId" 
        JOIN trading_data td ON td."assetExchangeId" = ae.id
        JOIN delivery_data dd ON dd."assetExchangeId" = ae.id
    WHERE
        a.symbol IN (%s)
        AND $__timeFilter(td.date)
        AND $__timeFilter(dd.date)
    GROUP BY
        a.isin,
        a.symbol,
        a.name,
        a.industry,
        a.sector,
        td.date
    ORDER BY
        td.date ASC
  ||| % [generateAvgExpressions(columns), stockList];  // Corrected string formatting with array
  query;

{
  stockList:: ['TATATECH', 'NHCFOODS', 'RAJRATAN', 'SUNSHIEL', 'SASTASUNDR', 'MAHLOG', 'BPLPHARMA', 'AHLADA'],
  getAllStocks: getAllStocks(),
  tradingClose: tradingData(self.stockList, ['td.close']),
  deliveryVolume: tradingData(self.stockList, ['td.volume']),
}
