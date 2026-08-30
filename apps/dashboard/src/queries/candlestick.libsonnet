{
  trading_data: |||
    WITH RECURSIVE family AS (
      SELECT "id", "isin", "previousAssetId" FROM assets WHERE "isin" = '${isin}'
      UNION ALL
      SELECT a."id", a."isin", a."previousAssetId"
      FROM assets a
      JOIN family f ON a."id" = f."previousAssetId"
    )
    SELECT
      trading_data."date",
      COALESCE(AVG(trading_data."open"), 0) as "open",
      COALESCE(AVG(trading_data."high"), 0) as "high",
      COALESCE(AVG(trading_data."low"), 0) as "low",
      COALESCE(AVG(trading_data."close"), 0) as "close",
      COALESCE(SUM(trading_data."volume"), 0) as "volume",
      COALESCE((SUM(delivery_data."deliveryQuantity")::numeric / SUM(trading_data."volume")) * 100, 0) as "deliveryPercentage"
    FROM
        asset_exchange AS "ae"
    JOIN
        assets ON "ae"."assetId" = assets.id
    JOIN
        family ON family.id = assets.id
    JOIN
        trading_data ON "ae"."id" = trading_data."assetExchangeId"
    JOIN
        delivery_data ON "ae".id = delivery_data."assetExchangeId"
        AND trading_data."date" = delivery_data."date"
    JOIN
        exchange ON "ae"."exchangeId" = exchange.id
    WHERE
        (
            ('${exchange}' = 'NSE/BSE' AND (exchange."abbreviation" = 'NSE' OR exchange."abbreviation" = 'BSE'))
            OR exchange."abbreviation" = '${exchange}'
        )
        AND $__timeFilter(trading_data."date")
    GROUP BY
        trading_data."date";
  |||,
  delivery_insights: |||
    WITH RECURSIVE family AS (
      SELECT "id", "isin", "previousAssetId" FROM assets WHERE "isin" = '${isin}'
      UNION ALL
      SELECT a."id", a."isin", a."previousAssetId"
      FROM assets a
      JOIN family f ON a."id" = f."previousAssetId"
    )
    SELECT
      exchange."abbreviation",
      trading_data."date",
      (trading_data."volume" - delivery_data."deliveryQuantity") as "tradingVolume",
      delivery_data."deliveryQuantity" as "deliveryVolume"
    FROM
      asset_exchange AS "ae"
      JOIN assets ON "ae"."assetId" = assets.id
      JOIN family ON family.id = assets.id
      JOIN trading_data ON "ae"."id" = trading_data."assetExchangeId"
      JOIN delivery_data ON "ae".id = delivery_data."assetExchangeId"
        AND trading_data."date" = delivery_data."date"
      JOIN exchange ON "ae"."exchangeId" = exchange.id
    WHERE
      exchange."abbreviation" = '${exchange}'
  |||,
  trading_data_combined: |||
    WITH RECURSIVE family AS (
      SELECT "id", "isin", "previousAssetId" FROM assets WHERE "isin" = '${isin}'
      UNION ALL
      SELECT a."id", a."isin", a."previousAssetId"
      FROM assets a
      JOIN family f ON a."id" = f."previousAssetId"
    )
    SELECT
      trading_data."date",
      COALESCE(AVG(trading_data."open"), 0) as "open",
      COALESCE(AVG(trading_data."high"), 0) as "high",
      COALESCE(AVG(trading_data."low"), 0) as "low",
      COALESCE(AVG(trading_data."close"), 0) as "close",
      COALESCE(SUM(trading_data."volume"), 0) as "volume",
      COALESCE((SUM(delivery_data."deliveryQuantity")::numeric / SUM(trading_data."volume")) * 100, 0) as "deliveryPercentage"
    FROM
      asset_exchange AS "ae"
      JOIN assets ON "ae"."assetId" = assets.id
      JOIN family ON family.id = assets.id
      JOIN trading_data ON "ae"."id" = trading_data."assetExchangeId"
      JOIN delivery_data ON "ae".id = delivery_data."assetExchangeId"
        AND trading_data."date" = delivery_data."date"
      JOIN exchange ON "ae"."exchangeId" = exchange.id
    WHERE
      $__timeFilter(trading_data."date")
    GROUP BY
      trading_data."date";
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
    WHERE
      assets.id NOT IN (
        SELECT a."previousAssetId" FROM assets a WHERE a."previousAssetId" IS NOT NULL
      )
  |||,
  simple_moving_average_5d: |||
    WITH RECURSIVE family AS (
      SELECT "id", "isin", "previousAssetId" FROM assets WHERE "isin" = '${isin}'
      UNION ALL
      SELECT a."id", a."isin", a."previousAssetId"
      FROM assets a
      JOIN family f ON a."id" = f."previousAssetId"
    ),
    exchange_filtered_data AS (
      SELECT
        DATE(trading_data."date") AS time,
        trading_data."close" AS close_price
      FROM
        asset_exchange AS "ae"
        JOIN assets ON "ae"."assetId" = assets.id
        JOIN family ON family.id = assets.id
        JOIN trading_data ON "ae"."id" = trading_data."assetExchangeId"
        JOIN exchange ON "ae"."exchangeId" = exchange.id
      WHERE
        (
          ('${exchange}' = 'NSE/BSE' AND (exchange."abbreviation" = 'NSE' OR exchange."abbreviation" = 'BSE'))
          OR exchange."abbreviation" = '${exchange}'
        )
        AND $__timeFilter(trading_data."date")
    ),

    combined_daily_closes AS (
      SELECT
        time,
        AVG(close_price) AS total_close
      FROM
        exchange_filtered_data
      GROUP BY
        time
    )

    SELECT
      time,
      AVG(total_close) OVER (
        ORDER BY
          time ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
      ) AS "5_ma"
    FROM
      combined_daily_closes
    ORDER BY
      time ASC;
  |||,
  average_volume: |||
    WITH RECURSIVE family AS (
      SELECT "id", "isin", "previousAssetId" FROM assets WHERE "isin" = '${isin}'
      UNION ALL
      SELECT a."id", a."isin", a."previousAssetId"
      FROM assets a
      JOIN family f ON a."id" = f."previousAssetId"
    ),
    daily_averages AS (
      SELECT
        DATE(trading_data."date") AS time,
        AVG(trading_data."close") AS daily_avg
      FROM
        asset_exchange AS "ae"
        JOIN assets ON "ae"."assetId" = assets.id
        JOIN family ON family.id = assets.id
        JOIN trading_data ON "ae"."id" = trading_data."assetExchangeId"
        JOIN exchange ON "ae"."exchangeId" = exchange.id
      WHERE
        exchange."abbreviation" = '${exchange}'
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
  corporate_actions: |||
    WITH RECURSIVE family AS (
      SELECT "id", "isin", "previousAssetId" FROM assets WHERE "isin" = '${isin}'
      UNION ALL
      SELECT a."id", a."isin", a."previousAssetId"
      FROM assets a
      JOIN family f ON a."id" = f."previousAssetId"
    )
    SELECT
      ca."effectiveDate" AS time,
      COALESCE(ca.description, '') AS text,
      ca.type AS tags
    FROM corporate_action ca
    JOIN family f ON f."id" = ca."assetId"
    WHERE $__timeFilter(ca."effectiveDate")
    ORDER BY time
  |||,
  corporate_actions_by_type(type): |||
    WITH RECURSIVE family AS (
      SELECT "id", "isin", "previousAssetId" FROM assets WHERE "isin" = '${isin}'
      UNION ALL
      SELECT a."id", a."isin", a."previousAssetId"
      FROM assets a
      JOIN family f ON a."id" = f."previousAssetId"
    )
    SELECT
      ca."effectiveDate" AS time,
      COALESCE(ca.description, '') AS text,
      ca.type AS tags
    FROM corporate_action ca
    JOIN family f ON f."id" = ca."assetId"
    WHERE ca.type = '%s'
      AND $__timeFilter(ca."effectiveDate")
    ORDER BY time
  ||| % type,
}
