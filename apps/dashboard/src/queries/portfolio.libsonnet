local getAllStocks() =
  local query = |||
    WITH LatestAssets AS (
        SELECT
            a."id" AS asset_id,
            a."isin",
            a."symbol",
            a."name",
            a."industry",
            a."sector"
        FROM
            assets a
        WHERE
            a."id" NOT IN (
                SELECT "previousAssetId" FROM assets WHERE "previousAssetId" IS NOT NULL
            )
    ),

    LatestDate AS (
        SELECT
            "ae"."assetId" AS asset_id,
            MAX(trading_data."date") AS latest_date
        FROM
            asset_exchange AS "ae"
        JOIN
            trading_data ON "ae"."id" = trading_data."assetExchangeId"
        WHERE
            trading_data."date" BETWEEN CAST($__timeFrom() AS DATE)
            AND CAST($__timeTo() AS DATE)
        GROUP BY
            "ae"."assetId"
    ),

    ExchangeInfo AS (
        SELECT
            "ae"."assetId" AS asset_id,
            CASE
                WHEN COUNT(DISTINCT exchange.abbreviation) > 1 THEN 'NSE/BSE'
                ELSE MAX(exchange.abbreviation)
            END AS exchange
        FROM
            asset_exchange AS "ae"
        JOIN
            exchange ON "ae"."exchangeId" = exchange.id
        GROUP BY
            "ae"."assetId"
    ),

    AggregatedData AS (
        SELECT
            "ae"."assetId" AS asset_id,
            SUM(trading_data."volume") / SUM(trading_data."totalTrades") AS avg_trade_size,
            AVG(trading_data.close) AS close,
            SUM(trading_data.volume) AS total_trading_volume,
            SUM(delivery_data."deliveryQuantity") AS total_delivery_quantity,
            SUM(trading_data.volume) - SUM(delivery_data."deliveryQuantity") AS intraday_volume,
            CASE 
                WHEN SUM(trading_data.volume) > 0 THEN
                    (SUM(delivery_data."deliveryQuantity") / SUM(trading_data.volume)) * 100
                ELSE 
                    0 
                END AS recalculated_delivery_percentage
        FROM
            asset_exchange AS "ae"
        JOIN
            trading_data ON "ae"."id" = trading_data."assetExchangeId"
        JOIN
            delivery_data ON "ae"."id" = delivery_data."assetExchangeId"
            AND trading_data."date" = delivery_data."date"
        JOIN 
            LatestDate ON "ae"."assetId" = LatestDate.asset_id 
            AND trading_data."date" = LatestDate.latest_date
        WHERE
            trading_data."date" BETWEEN CAST($__timeFrom() AS DATE)
            AND CAST($__timeTo() AS DATE)
        GROUP BY
            "ae"."assetId"
    )

    SELECT
        LA."isin",
        LA."symbol",
        LA."name",
        LA."industry",
        LA."sector",
        EI.exchange AS exchange,
        AD.close AS "Price",
        AD.avg_trade_size AS "Average Trade Size",
        AD.total_trading_volume AS "Total Volume (T+D)",
        AD.total_delivery_quantity AS "Delivery Volume",
        AD.intraday_volume AS "Trade Volume",
        AD.recalculated_delivery_percentage AS "Delivery Percentage"
    FROM
        AggregatedData AD
    JOIN
        ExchangeInfo EI ON AD.asset_id = EI.asset_id
    JOIN
        LatestAssets LA ON AD.asset_id = LA.asset_id
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
        AND a.id NOT IN (
            SELECT "previousAssetId" FROM assets WHERE "previousAssetId" IS NOT NULL
        )
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
