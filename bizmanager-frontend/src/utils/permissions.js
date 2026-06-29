// Must match com.bizmanager.common.Permission on the backend exactly.
export const Permission = {
  MANAGE_ADMINS: 'MANAGE_ADMINS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_STAFF_ACCOUNTS: 'MANAGE_STAFF_ACCOUNTS',
  MANAGE_TICKETS: 'MANAGE_TICKETS',
  MANAGE_RIBBONS: 'MANAGE_RIBBONS',
  ENTER_TICKET_SALES: 'ENTER_TICKET_SALES',
  MANAGE_EXPENSE_ITEMS: 'MANAGE_EXPENSE_ITEMS',
  ENTER_DAILY_EXPENSE: 'ENTER_DAILY_EXPENSE',
  MANAGE_STAFF_HR: 'MANAGE_STAFF_HR',
  MARK_ATTENDANCE: 'MARK_ATTENDANCE',
  MANAGE_SALARY: 'MANAGE_SALARY',
  MANAGE_STOCK_ITEMS: 'MANAGE_STOCK_ITEMS',
  ENTER_STOCK_SALE: 'ENTER_STOCK_SALE',
  VIEW_REPORTS: 'VIEW_REPORTS',
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG',
}

export const ALL_PERMISSIONS = Object.values(Permission)

export const PERMISSION_LABELS = {
  MANAGE_ADMINS: 'Add/remove Admins',
  MANAGE_ROLES: 'Create custom roles',
  MANAGE_STAFF_ACCOUNTS: 'Create staff/StockManager accounts',
  MANAGE_TICKETS: 'Manage ticket prices',
  MANAGE_RIBBONS: 'Restock ribbons',
  ENTER_TICKET_SALES: "Log today's ticket sales",
  MANAGE_EXPENSE_ITEMS: 'Manage expense categories',
  ENTER_DAILY_EXPENSE: 'Log daily expenses',
  MANAGE_STAFF_HR: 'Add staff & set salaries',
  MARK_ATTENDANCE: 'Mark attendance',
  MANAGE_SALARY: 'Mark salary as paid',
  MANAGE_STOCK_ITEMS: 'Manage stock catalogue',
  ENTER_STOCK_SALE: 'Log stock sold',
  VIEW_REPORTS: 'View dashboard & reports',
  VIEW_AUDIT_LOG: 'View audit log',
}
