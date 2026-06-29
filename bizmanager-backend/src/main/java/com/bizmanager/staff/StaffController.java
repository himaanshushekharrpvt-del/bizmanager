package com.bizmanager.staff;

import com.bizmanager.security.AuthContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.bizmanager.staff.StaffDtos.*;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;
    private final AttendanceService attendanceService;
    private final AuthContext authContext;

    @GetMapping
    public List<StaffProfileResponse> listStaff() {
        return staffService.listStaff(authContext.businessId()).stream().map(StaffProfileResponse::from).toList();
    }

    @GetMapping("/{staffId}")
    public StaffProfileResponse getStaff(@PathVariable Long staffId) {
        return StaffProfileResponse.from(staffService.getOwned(staffId, authContext.businessId()));
    }

    @PostMapping
    public StaffProfileResponse createStaff(@Valid @RequestBody CreateStaffRequest req) {
        return StaffProfileResponse.from(staffService.createStaff(req));
    }

    @PutMapping("/{staffId}/salary")
    public StaffProfileResponse updateSalary(@PathVariable Long staffId, @Valid @RequestBody UpdateSalaryRequest req) {
        return StaffProfileResponse.from(staffService.updateSalary(staffId, req.monthlySalary()));
    }

    @DeleteMapping("/{staffId}")
    public ResponseEntity<Void> deactivateStaff(@PathVariable Long staffId) {
        staffService.deactivateStaff(staffId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{staffId}/attendance")
    public AttendanceResponse markAttendance(@PathVariable Long staffId, @Valid @RequestBody MarkAttendanceRequest req) {
        return AttendanceResponse.from(attendanceService.markAttendance(staffId, req.date(), req.status()));
    }

    @GetMapping("/{staffId}/attendance/monthly")
    public MonthlyAttendanceSummary monthlyAttendance(@PathVariable Long staffId,
                                                        @RequestParam int year, @RequestParam int month) {
        return attendanceService.getMonthlyAttendance(staffId, year, month);
    }

    @GetMapping("/{staffId}/attendance/today")
    public ResponseEntity<AttendanceResponse> todayAttendance(@PathVariable Long staffId) {
        return attendanceService.getTodayAttendance(staffId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{staffId}/salary/summary")
    public SalarySummaryResponse salarySummary(@PathVariable Long staffId) {
        return attendanceService.getSalarySummary(staffId);
    }

    @PostMapping("/{staffId}/salary/pay")
    public SalaryPaymentResponse paySalary(@PathVariable Long staffId, @RequestBody(required = false) PaySalaryRequest req) {
        String notes = req == null ? null : req.notes();
        return SalaryPaymentResponse.from(attendanceService.markSalaryPaid(staffId, notes));
    }

    @GetMapping("/{staffId}/salary/payments")
    public List<SalaryPaymentResponse> salaryPayments(@PathVariable Long staffId) {
        return attendanceService.listPayments(staffId);
    }
}
