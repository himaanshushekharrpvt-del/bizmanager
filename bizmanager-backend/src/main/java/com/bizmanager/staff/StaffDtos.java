package com.bizmanager.staff;

import com.bizmanager.common.AttendanceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class StaffDtos {

    public record CreateStaffRequest(
            @NotBlank String name,
            @NotBlank String phone,
            @NotBlank @Size(min = 6) String password,
            Long roleId,
            @NotNull @Min(0) BigDecimal monthlySalary,
            @NotNull LocalDate joiningDate
    ) {}

    public record UpdateSalaryRequest(@NotNull @Min(0) BigDecimal monthlySalary) {}

    public record MarkAttendanceRequest(@NotNull LocalDate date, @NotNull AttendanceStatus status) {}

    public record PaySalaryRequest(String notes) {}

    public record StaffProfileResponse(
            Long staffProfileId, Long userId, String name, String phone,
            String roleName, BigDecimal monthlySalary, LocalDate joiningDate, boolean active, LocalDateTime lastPaidAt
    ) {
        public static StaffProfileResponse from(StaffProfile p) {
            return new StaffProfileResponse(p.getId(), p.getUser().getId(), p.getUser().getName(),
                    p.getUser().getPhone(), p.getUser().getRole().getName(), p.getMonthlySalary(),
                    p.getJoiningDate(), p.isActive(), p.getLastPaidAt());
        }
    }

    public record AttendanceResponse(
            Long id, LocalDate date, AttendanceStatus status, BigDecimal perDaySalary,
            Long markedByUserId, String markedByName, LocalDateTime markedAt
    ) {
        public static AttendanceResponse from(Attendance a) {
            return new AttendanceResponse(a.getId(), a.getAttendanceDate(), a.getStatus(), a.getPerDaySalarySnapshot(),
                    a.getMarkedByUserId(), a.getMarkedByName(), a.getMarkedAt());
        }
    }

    public record MonthlyAttendanceSummary(
            int year, int month, int presentDays, int absentDays, int daysMarked, double attendancePercentage,
            List<AttendanceResponse> days
    ) {}

    public record SalarySummaryResponse(
            BigDecimal monthlySalary, LocalDateTime accruingSince, int presentDaysSincePaid,
            int absentDaysSincePaid, BigDecimal cumulativeSalary, LocalDateTime lastPaidAt
    ) {}

    public record SalaryPaymentResponse(
            Long id, LocalDateTime periodStart, LocalDateTime periodEnd, BigDecimal amountPaid,
            String paidByName, String notes
    ) {
        public static SalaryPaymentResponse from(SalaryPayment p) {
            return new SalaryPaymentResponse(p.getId(), p.getPeriodStart(), p.getPeriodEnd(),
                    p.getAmountPaid(), p.getPaidByName(), p.getNotes());
        }
    }
}
