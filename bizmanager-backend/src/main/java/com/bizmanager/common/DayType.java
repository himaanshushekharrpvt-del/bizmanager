package com.bizmanager.common;

import java.time.DayOfWeek;
import java.time.LocalDate;

public enum DayType {
    WEEKDAY,
    WEEKEND;

    /** Saturday/Sunday = weekend. Swap this out if a business needs a custom/holiday calendar later. */
    public static DayType forDate(LocalDate date) {
        DayOfWeek d = date.getDayOfWeek();
        return (d == DayOfWeek.SATURDAY || d == DayOfWeek.SUNDAY) ? WEEKEND : WEEKDAY;
    }
}
