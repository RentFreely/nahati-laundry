/** Must stay in sync with app expectations; DB stores free-text `entry_code` on `ledger_entries`. */

export const EXPENSE_ENTRY_CODES = [
  { code: 'exp.water', label: 'Water bills' },
  { code: 'exp.electricity', label: 'Electricity bills' },
  { code: 'exp.detergent', label: 'Detergent' },
  { code: 'exp.softener', label: 'Fabric softener' },
  { code: 'exp.transport_pickup', label: 'Transport for pickup' },
  { code: 'exp.other', label: 'Other expense' },
]

export const INCOME_ENTRY_CODES = [
  { code: 'inc.service', label: 'Laundry / service income' },
  { code: 'inc.other', label: 'Other income' },
]

const all = [...EXPENSE_ENTRY_CODES, ...INCOME_ENTRY_CODES]

export function labelForEntryCode(code) {
  if (!code) return '—'
  return all.find((e) => e.code === code)?.label || code
}
