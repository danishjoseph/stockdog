export const tradingHolidays = [
  '2024-01-22', // Special Holiday
  '2024-01-26', // Republic Day
  '2024-03-08', // Mahashivratri
  '2024-03-25', // Holi
  '2024-03-29', // Good Friday
  '2024-04-11', // Id-Ul-Fitr (Ramadan Eid)
  '2024-04-17', // Shri Ram Navmi
  '2024-05-01', // Maharashtra Day
  '2024-05-20', // General Parliamentary Elections
  '2024-06-17', // Bakri Id
  '2024-07-17', // Moharram
  '2024-08-15', // Independence Day
  '2024-10-02', // Mahatma Gandhi Jayanti
  '2024-11-01', // Diwali Laxmi Pujan*
  '2024-11-15', // Gurunanak Jayanti
  '2024-12-25', // Christmas
];
export const getUtcTradeDays = (startDate: Date, endDate: Date): Date[] => {
  const workdays: Date[] = [];
  const currentDate = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    ),
  ); // clone the date and ignore time
  const excludeDates = tradingHolidays;

  // convert the excludeDates strings to Date objects and ignore the time part
  const excludeDateObjects = excludeDates.map((dateStr) => {
    const d = new Date(dateStr);
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );
  });

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 (Sunday) or 6 (Saturday)

    // check if the current date is in the excludeDates array
    const isExcluded = excludeDateObjects.some(
      (d) => d.getTime() === currentDate.getTime(),
    );

    if (!isWeekend && !isExcluded) {
      // it's a workday and it's not excluded
      workdays.push(new Date(currentDate.getTime())); // push a clone of the date
    }

    // go to the next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return workdays;
};

export const getCurrentDate = (days?: number): Date => {
  const date = new Date();

  if (days) {
    date.setDate(date.getDate() + days);
  }

  // Convert the date to 'YYYY-MM-DD' format in UTC
  const dateStr = date.toISOString().split('T')[0];

  // Create a new Date object from the date string
  return new Date(dateStr);
};
