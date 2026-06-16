export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export const nowStr = (): string => {
  const d = new Date();
  return `${todayStr()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

export const formatDateFull = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

export const getDayLabel = (dateStr: string): string => {
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return days[new Date(dateStr).getDay()];
};

export const getWeekDates = (): string[] => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    );
  }
  return dates;
};

export const getLast7DaysDates = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    );
  }
  return dates;
};

export const getMonthDates = (year?: number, month?: number): string[] => {
  const today = new Date();
  const y = year ?? today.getFullYear();
  const m = month ?? today.getMonth() + 1;
  const daysInMonth = new Date(y, m, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  return dates;
};

export const getPrevMonth = (year: number, month: number): { year: number; month: number } => {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
};

export const getNextMonth = (year: number, month: number): { year: number; month: number } => {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
};
