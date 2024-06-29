import csvParser from 'csv-parser';

const parseCSV = async (csvData, separator: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results = [];
    csvData
      .pipe(csvParser({ separator }))
      .on('data', (data) => {
        // Trim the keys of each row
        const trimmedData = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key.trim(),
            (value as string).trim(),
          ]),
        );

        results.push(trimmedData);
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

export default parseCSV;
