package com.bizmanager.staff;

import com.bizmanager.common.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByBusinessIdAndStaffProfileIdAndAttendanceDate(
            Long businessId, Long staffProfileId, LocalDate attendanceDate);

    List<Attendance> findByBusinessIdAndStaffProfileIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(
            Long businessId, Long staffProfileId, LocalDate from, LocalDate to);

    List<Attendance> findByBusinessIdAndStaffProfileIdAndStatusAndAttendanceDateAfterOrderByAttendanceDateAsc(
            Long businessId, Long staffProfileId, AttendanceStatus status, LocalDate after);

    List<Attendance> findByBusinessIdAndStaffProfileIdAndAttendanceDateAfterOrderByAttendanceDateAsc(
            Long businessId, Long staffProfileId, LocalDate after);

    List<Attendance> findByBusinessIdAndAttendanceDateOrderByStaffProfileIdAsc(Long businessId, LocalDate date);

    @Query("select coalesce(sum(a.perDaySalarySnapshot), 0) from Attendance a " +
           "where a.businessId = :businessId and a.status = 'PRESENT' and a.attendanceDate between :from and :to")
    BigDecimal sumStaffCostInRange(Long businessId, LocalDate from, LocalDate to);
}
