package com.bizmanager.staff;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.bizmanager.staff.StaffDtos.*;

@RestController
@RequestMapping("/api/staff/me")
@RequiredArgsConstructor
public class StaffSelfController {

    private final StaffService staffService;
    private final AttendanceService attendanceService;

    @GetMapping
    public StaffProfileResponse myProfile() {
        return StaffProfileResponse.from(staffService.getOwnProfile());
    }

    @GetMapping("/attendance/monthly")
    public MonthlyAttendanceSummary myMonthlyAttendance(@RequestParam int year, @RequestParam int month) {
        return attendanceService.getMonthlyAttendance(staffService.getOwnProfile().getId(), year, month);
    }

    @GetMapping("/attendance/today")
    public ResponseEntity<AttendanceResponse> myTodayAttendance() {
        return attendanceService.getTodayAttendance(staffService.getOwnProfile().getId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/salary/summary")
    public SalarySummaryResponse mySalarySummary() {
        return attendanceService.getSalarySummary(staffService.getOwnProfile().getId());
    }
}
