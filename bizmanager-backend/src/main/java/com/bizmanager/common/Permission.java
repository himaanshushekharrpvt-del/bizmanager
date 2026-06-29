package com.bizmanager.common;

/**
 * Roles are dynamic (businesses can create new ones), but the underlying
 * capabilities they can be built from are fixed - that's what this enum is.
 * Every @PreAuthorize / AuthContext.require(...) check in the codebase
 * references one of these, never a role name directly (except the two
 * admin-tier checks that are intentionally hardcoded - see Role.isAdminLevel).
 */
public enum Permission {
    MANAGE_ADMINS,          // add/remove Admin accounts - MasterAdmin only
    MANAGE_ROLES,           // create/edit custom roles - MasterAdmin only
    MANAGE_STAFF_ACCOUNTS,  // create login accounts for Staff/StockManager/custom roles

    MANAGE_TICKETS,         // CRUD ticket prices
    MANAGE_RIBBONS,         // restock ribbons
    ENTER_TICKET_SALES,     // log today's tickets sold

    MANAGE_EXPENSE_ITEMS,   // define expense categories
    ENTER_DAILY_EXPENSE,    // log today's spend per category

    MANAGE_STAFF_HR,        // add staff, set/change salary
    MARK_ATTENDANCE,        // mark present/absent
    MANAGE_SALARY,          // mark salary as paid

    MANAGE_STOCK_ITEMS,     // CRUD stock catalogue (qty, cost/selling price)
    ENTER_STOCK_SALE,       // log units sold (StockManager)

    VIEW_REPORTS,           // analytics/dashboard
    VIEW_AUDIT_LOG
}
