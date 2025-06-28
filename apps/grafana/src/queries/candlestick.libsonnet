{
  trading_data: |||
    SELECT
      exchange."abbreviation",
      trading_data."date",
      assets."isin",
      trading_data."open" as "open",
      trading_data."high" as "high",
      trading_data."low" as "low",
      trading_data."close" as "close",
      trading_data."volume" as "volume"
    FROM
      asset_exchange AS "ae"
      JOIN assets ON "ae"."assetId" = assets.id
      JOIN trading_data ON "ae"."id" = trading_data."assetExchangeId"
      JOIN delivery_data ON "ae".id = delivery_data."assetExchangeId"
        AND trading_data."date" = delivery_data."date"
      JOIN exchange ON "ae"."exchangeId" = exchange.id
    WHERE
      assets."isin" = '${isin}'
      AND exchange."abbreviation" = '${exchange}'
  |||,
  delivery_insights: |||
    SELECT
      exchange."abbreviation",
      trading_data."date",
      assets."isin",
      (trading_data."volume"::numeric / trading_data."totalTrades") as "avgTradeSize",
      trading_data."volume" as "tradingVolume",
      delivery_data."deliveryQuantity" as "deliveryVolume",
      (delivery_data."deliveryQuantity"::numeric / trading_data."volume") * 100 as "deliveryPercentage"
    FROM
      asset_exchange AS "ae"
      JOIN assets ON "ae"."assetId" = assets.id
      JOIN trading_data ON "ae"."id" = trading_data."assetExchangeId"
      JOIN delivery_data ON "ae".id = delivery_data."assetExchangeId"
        AND trading_data."date" = delivery_data."date"
      JOIN exchange ON "ae"."exchangeId" = exchange.id
    WHERE
      assets."isin" = '${isin}'
      AND exchange."abbreviation" = '${exchange}'
  |||,
  trading_data_combined: |||
    SELECT
      trading_data."date",
      assets."isin",
      COALESCE(AVG(trading_data."open"), 0) as "open",
      COALESCE(AVG(trading_data."high"), 0) as "high",
      COALESCE(AVG(trading_data."low"), 0) as "low",
      COALESCE(AVG(trading_data."close"), 0) as "close",
      COALESCE(AVG(trading_data."volume"), 0) as "volume",
      COALESCE((SUM(delivery_data."deliveryQuantity")::numeric / SUM(trading_data."volume")) * 100, 0) as "deliveryPercentage"
    FROM
      asset_exchange AS "ae"
      JOIN assets ON "ae"."assetId" = assets.id
      JOIN trading_data ON "ae"."id" = trading_data."assetExchangeId"
      JOIN delivery_data ON "ae".id = delivery_data."assetExchangeId"
        AND trading_data."date" = delivery_data."date"
      JOIN exchange ON "ae"."exchangeId" = exchange.id
    WHERE
      assets."isin" = '${isin}'
    GROUP BY
      trading_data."date",
      assets."isin";
  |||,
  asset_name_with_isin: |||
    SELECT
      CONCAT(
        assets."name",
        ' (',
        assets."symbol",
        ' / ',
        assets.isin,
        ')'
      ) as __text,
      assets.isin as __value
    FROM
      assets
  |||,
  simple_moving_average_5d: |||
    WITH daily_averages AS (
      SELECT
        DATE(trading_data."date") AS time,
        AVG(trading_data."close") AS daily_avg
      FROM
        asset_exchange AS "ae"
        JOIN assets ON "ae"."assetId" = assets.id
        JOIN trading_data ON "ae"."id" = trading_data."assetExchangeId"
        JOIN exchange ON "ae"."exchangeId" = exchange.id
      WHERE
        assets."isin" = '${isin}'
        AND exchange."abbreviation" = '${exchange}'
      GROUP BY
        DATE(trading_data."date")
    )
    SELECT
      time,
      AVG(daily_avg) OVER(
        ORDER BY
          time ROWS BETWEEN 4 PRECEDING
          AND CURRENT ROW
      ) AS "5_ma"
    FROM
      daily_averages
    ORDER BY
      time ASC;
  |||,
}
