package com.bizmanager.staff;

import com.bizmanager.common.AttendanceStatus;
import com.bizmanager.common.AuditService;
import com.bizmanager.common.BadRequestException;
import com.bizmanager.common.Permission;
import com.bizmanager.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.bizmanager.staff.StaffDtos.*;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final SalaryPaymentRepository salaryPaymentRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final StaffService staffService;
    private final AuditService auditService;
    private final AuthContext authContext;

    @Transactional
    public Attendance markAttendance(Long staffProfileId, LocalDate date, AttendanceStatus status) {
        authContext.require(Permission.MARK_ATTENDANCE);
        if (date.isAfter(LocalDate.now())) {
            throw new BadRequestException("Attendance cannot be marked for a future date.");
        }
        Long businessId = authContext.businessId();
        StaffProfile profile = staffService.getOwned(staffProfileId, businessId);

        BigDecimal perDaySalary = perDaySalary(profile.getMonthlySalary(), date);
        var existing = attendanceRepository.findByBusinessIdAndStaffProfileIdAndAttendanceDate(businessId, staffProfileId, date);

        Attendance saved;
        if (existing.isPresent()) {
            Attendance a = existing.get();
            AttendanceStatus old = a.getStatus();
            a.setStatus(status);
            a.setPerDaySalarySnapshot(perDaySalary);
            a.setMarkedByUserId(authContext.userId());
            a.setMarkedByName(authContext.currentUser().getName());
            a.setMarkedAt(LocalDateTime.now());
            saved = attendanceRepository.save(a);
            auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                    "ATTENDANCE_CORRECTED", "Attendance", saved.getId(), old, status,
                    profile.getUser().getName() + " / " + date);
        } else {
            saved = attendanceRepository.save(Attendance.builder()
                    .businessId(businessId)
                    .staffProfile(profile)
                    .attendanceDate(date)
                    .status(status)
                    .perDaySalarySnapshot(perDaySalary)
                    .markedByUserId(authContext.userId())
                    .markedByName(authContext.currentUser().getName())
                    .markedAt(LocalDateTime.now())
                    .build());
            auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                    "ATTENDANCE_MARKED", "Attendance", saved.getId(), null, status,
                    profile.getUser().getName() + " / " + date);
        }
        return saved;
    }

    public MonthlyAttendanceSummary getMonthlyAttendance(Long staffProfileId, int year, int month) {
        Long businessId = authContext.businessId();
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());

        List<Attendance> records = attendanceRepository
                .findByBusinessIdAndStaffProfileIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(
                        businessId, staffProfileId, from, to);

        int present = (int) records.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        int absent = (int) records.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        int marked = records.size();
        double pct = marked == 0 ? 0.0 : Math.round((present * 10000.0 / marked)) / 100.0;

        return new MonthlyAttendanceSummary(year, month, present, absent, marked, pct,
                records.stream().map(AttendanceResponse::from).toList());
    }

    public Optional<AttendanceResponse> getTodayAttendance(Long staffProfileId) {
        Long businessId = authContext.businessId();
        return attendanceRepository
                .findByBusinessIdAndStaffProfileIdAndAttendanceDate(businessId, staffProfileId, LocalDate.now())
                .map(AttendanceResponse::from);
    }

    public SalarySummaryResponse getSalarySummary(Long staffProfileId) {
        Long businessId = authContext.businessId();
        StaffProfile profile = staffService.getOwned(staffProfileId, businessId);
        LocalDateTime since = staffService.accrualStartFor(profile);

        List<Attendance> records = attendanceRepository
                .findByBusinessIdAndStaffProfileIdAndAttendanceDateAfterOrderByAttendanceDateAsc(
                        businessId, staffProfileId, since.toLocalDate());

        BigDecimal cumulative = records.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT)
                .map(Attendance::getPerDaySalarySnapshot)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int presentCount = (int) records.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        int absentCount = (int) records.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();

        return new SalarySummaryResponse(profile.getMonthlySalary(), since, presentCount, absentCount,
                cumulative, profile.getLastPaidAt());
    }

    @Transactional
    public SalaryPayment markSalaryPaid(Long staffProfileId, String notes) {
        authContext.require(Permission.MANAGE_SALARY);
        Long businessId = authContext.businessId();
        StaffProfile profile = staffService.getOwned(staffProfileId, businessId);

        SalarySummaryResponse summary = getSalarySummary(staffProfileId);
        LocalDateTime now = LocalDateTime.now();

        SalaryPayment payment = salaryPaymentRepository.save(SalaryPayment.builder()
                .businessId(businessId)
                .staffProfile(profile)
                .periodStart(summary.accruingSince())
                .periodEnd(now)
                .amountPaid(summary.cumulativeSalary())
                .paidByUserId(authContext.userId())
                .paidByName(authContext.currentUser().getName())
                .notes(notes)
                .build());

        // This single field reset IS the "cumulative becomes 0 and starts fresh" behaviour -
        // getSalarySummary always computes from lastPaidAt forward, so there's nothing else to zero out.
        profile.setLastPaidAt(now);
        staffProfileRepository.save(profile);

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "SALARY_PAID", "StaffProfile", staffProfileId, null, summary.cumulativeSalary(),
                profile.getUser().getName());

        return payment;
    }

    public List<SalaryPaymentResponse> listPayments(Long staffProfileId) {
        Long businessId = authContext.businessId();
        return salaryPaymentRepository.findByBusinessIdAndStaffProfileIdOrderByPeriodEndDesc(businessId, staffProfileId)
                .stream().map(SalaryPaymentResponse::from).toList();
    }

    private BigDecimal perDaySalary(BigDecimal monthlySalary, LocalDate date) {
        return monthlySalary.divide(BigDecimal.valueOf(date.lengthOfMonth()), 2, RoundingMode.HALF_UP);
    }
}
