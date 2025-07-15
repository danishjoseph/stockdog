export const tradingHolidays = [
  '2025-02-26', // Mahashivratri
  '2025-03-14', // Holi
  '2025-03-31', // Id-Ul-Fitr (Ramadan Eid)
  '2025-04-10', // Shri Mahavir Jayanti
  '2025-04-14', // Dr. Baba Saheb Ambedkar Jayanti
  '2025-04-18', // Good Friday
  '2025-05-01', // Maharashtra Day
  '2025-08-15', // Independence Day / Parsi New Year
  '2025-08-27', // Shri Ganesh Chaturthi
  '2025-10-02', // Mahatma Gandhi Jayanti/Dussehra
  '2025-10-21', // Diwali Laxmi Pujan
  '2025-10-22', // Balipratipada
  '2025-11-05', // Prakash Gurpurb Sri Guru Nanak Dev
  '2025-12-25', // Christmas
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
