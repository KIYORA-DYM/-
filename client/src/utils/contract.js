// contract_month is stored as "YYYY-MM". Returns how many months into the
// contract we are, counting the contract month itself as month 1.
export function contractMonthsElapsed(contractMonth) {
  if (!contractMonth) return null;
  const [y, m] = contractMonth.split("-").map(Number);
  if (!y || !m) return null;

  const now = new Date();
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) + 1;
  return months < 1 ? 1 : months;
}
