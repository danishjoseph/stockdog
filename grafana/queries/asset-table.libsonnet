{
  ASSET_TABLE: |||
    SELECT 
      assets.isin, 
      assets.symbol,  
      assets.name, 
      CASE     
        WHEN COUNT(DISTINCT exchange.abbreviation) > 1 THEN 'NSE/BSE'
        ELSE MAX(exchange.abbreviation)
      END as exchange,
      assets.industry,
      assets.sector
    FROM
      asset_exchange as "ae"
      JOIN assets ON "ae"."assetId" = assets.id
      JOIN exchange ON "ae"."exchangeId" = exchange.id
    WHERE
      (assets.industry = SPLIT_PART('$industry_sector', ' - ', 1) OR assets.industry IS NULL)
      AND (assets.sector = SPLIT_PART('$industry_sector', ' - ', 2) OR assets.sector IS NULL)
    GROUP BY
      assets.isin,
      assets.symbol,
      assets.name,
      assets.industry,
      assets.sector;
  |||,
  INDUSTRY_SECTOR: |||
    SELECT industry ||  ' - '  || sector  AS __text , industry || ' - ' || sector as __value 
    FROM assets 
    WHERE industry ILIKE '%$__searchFilter%' OR sector ILIKE '%$__searchFilter%'
  |||,
  EXCHANGE: |||
    SELECT 
      exchange."abbreviation",
      trading_data."date",
      assets."name",
      trading_data."open",
      trading_data."high",
      trading_data."low",
      trading_data."close",
      trading_data."volume",
      delivery_data."deliveryPercentage"
    FROM 
      asset_exchange AS "ae"
    JOIN 
      assets ON "ae"."assetId" = assets.id
    JOIN 
      trading_data ON "ae"."id" = trading_data."assetExchangeId"
    JOIN 
      delivery_data ON "ae".id = delivery_data."assetExchangeId"
      AND trading_data."date" = delivery_data."date"
    JOIN 
      exchange ON "ae"."exchangeId" = exchange.id
    WHERE 
      assets."isin" = '${isin}'
      AND exchange."abbreviation" = '${exchange}'
  |||,

}
