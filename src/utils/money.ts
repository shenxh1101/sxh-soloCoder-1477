export const fmtMoney = (n: number): string => {
  return `¥${n.toFixed(2)}`;
};

export const round2 = (n: number): number => {
  return Math.round(n * 100) / 100;
};
