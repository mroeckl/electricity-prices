#!/usr/bin/env node

const QueryPublication = require("entsoe-api-client").QueryPublication;
const Area = require("entsoe-api-client").Area;
const { parseArgs } = require("node:util");

queryEntsoe(getConfig()).then(function (entsoeResponse) {
  const options = {
    format: {
      type: "string",
      short: "f",
      default: "csv",
    },
  };
  const { values } = parseArgs({ options });

  const priceDocument = entsoeResponse[0];
  const timeSeries = priceDocument.timeseries;
  const pricesPerHour = extractPricesPerHour(timeSeries);
  print(pricesPerHour, values.format);
});

function getConfig() {
  const config = new Object();
  config.startDate = new Date("2023-01-01T00:00:00Z");
  config.endDate = new Date(new Date().setHours(0, 0, 0, 0));
  config.apiKey = process.env.API_KEY;
  config.docTypeDayAheadPrices = "A44"; // A44 - Day Ahead Prices
  config.domainGermany = Area("BZN|DE-LU"); // Germany
  return config;
}

function queryEntsoe(config) {
  return QueryPublication(config.apiKey, {
    documentType: config.docTypeactGenerationPerType,
    documentType: config.docTypeDayAheadPrices,
    inDomain: config.domainGermany,
    outDomain: config.domainGermany,
    startDateTime: config.startDate,
    endDateTime: config.endDate,
  });
}

function extractPricesPerHour(priceSeries) {
  const pricesPerHour = new Object();

  priceSeries.forEach((priceElement) => {
    const pricePoint = priceElement.periods[0].points;
    pricePoint.forEach((pricePoint) => {
      const startDate = pricePoint.startDate;
      if (isFullHour(startDate) && !isNaN(pricePoint.price)) {
        pricesPerHour[startDate] = { price: pricePoint.price };
      }
    });
  });

  return pricesPerHour;
}

function isFullHour(startDate) {
  return startDate.getMinutes() === 0;
}

function print(pricesPerHour, format) {
  if (format === "json") {
    console.log(
      JSON.stringify(
        Object.keys(pricesPerHour).map((key) => {
          return { dateTime: new Date(key), price: pricesPerHour[key].price };
        })
      )
    );
  } else {
    const sortedDateTimes = Object.keys(pricesPerHour).sort((date1, date2) => new Date(date1) - new Date(date2));
    sortedDateTimes.forEach((dateTime) => {
      console.log("%s;%d", new Date(dateTime).toISOString(), pricesPerHour[dateTime].price);
    });
  }
}
