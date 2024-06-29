import { getCurrentDate, getUtcTradeDays, tradingHolidays } from './trade-days';

describe('getUtcTradeDays', () => {
  it('should return an array of trade days between the start and end dates', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    const tradeDays = getUtcTradeDays(startDate, endDate);

    expect(tradeDays).toHaveLength(246); // Expected number of trade days in 2024

    // Ensure all trade days fall within the specified range
    tradeDays.forEach((tradeDay) => {
      expect(tradeDay >= startDate && tradeDay <= endDate).toBe(true);
    });
  });

  it('should exclude trading holidays from the result', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    const tradeDays = getUtcTradeDays(startDate, endDate);

    // Ensure no trading holidays are present in the trade days array
    tradingHolidays.forEach((holiday) => {
      const holidayDate = new Date(holiday);
      expect(tradeDays.includes(holidayDate)).toBe(false);
    });
  });

  it('should return single trade day if start and end dates are the same', () => {
    const date = getCurrentDate();
    const tradeDays = getUtcTradeDays(date, date);

    expect(tradeDays).toHaveLength(1);
    expect(tradeDays[0]).toEqual(date);
  });
});

describe('getCurrentDate', () => {
  it('should return the current date when no argument is passed', () => {
    const result = getCurrentDate();
    const expected = new Date(new Date().toISOString().split('T')[0]);
    expect(result).toEqual(expected);
  });

  it('should return the date 5 days in the future when 5 is passed', () => {
    const result = getCurrentDate(5);
    const expected = new Date(new Date().toISOString().split('T')[0]);
    expected.setDate(expected.getDate() + 5);
    expect(result).toEqual(expected);
  });

  it('should return the date 3 days in the past when -3 is passed', () => {
    const result = getCurrentDate(-3);
    const expected = new Date(new Date().toISOString().split('T')[0]);
    expected.setDate(expected.getDate() - 3);
    expect(result).toEqual(expected);
  });
});
