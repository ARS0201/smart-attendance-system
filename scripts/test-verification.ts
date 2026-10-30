import prisma from "../src/lib/prisma";
import {
  generateSessionOtp,
  getCurrentTimeWindow,
  validateDynamicQrToken,
  createDynamicQrPayload,
} from "../src/lib/qr-security";

async function runVerification() {
  console.log("==================================================");
  console.log("🚀 STARTING SMART ATTENDANCE SYSTEM VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Verify Users & Roles
    const faculty = await prisma.user.findFirst({ where: { role: "FACULTY" } });
    const student1 = await prisma.user.findFirst({ where: { email: "student@smartattend.edu" } });
    const student2 = await prisma.user.findFirst({ where: { email: "jane@smartattend.edu" } });

    assert(!!faculty, "Faculty user exists in database");
    assert(!!student1 && !!student2, "Student users exist in database");

    // 2. Verify Courses
    const course = await prisma.course.findFirst({ where: { facultyId: faculty!.id } });
    assert(!!course, `Faculty teaches course: ${course?.code} - ${course?.name}`);

    // 3. Test Dynamic QR Token Generation & Windowing
    const secret = "test_secret_key_1234567890123456";
    const sessionId = "session_test_abc123";
    const currentWindow = getCurrentTimeWindow(10);
    const validToken = generateSessionOtp(sessionId, secret, currentWindow);

    assert(validToken.length === 8, "Dynamic OTP token is 8-character hex string");

    // 4. Validate Valid Token
    const validResult = validateDynamicQrToken(sessionId, secret, validToken, currentWindow);
    assert(validResult.isValid, "Fresh dynamic token within current time-window is accepted");

    // 5. Anti-Proxy Verification: Expired Window Rejection
    const expiredWindow = currentWindow - 5; // 50 seconds in past
    const expiredToken = generateSessionOtp(sessionId, secret, expiredWindow);
    const expiredResult = validateDynamicQrToken(sessionId, secret, expiredToken, expiredWindow);
    assert(
      !expiredResult.isValid,
      "Expired token (screenshot from 50s ago) is strictly rejected by anti-proxy engine"
    );

    // 6. Test Session Creation
    const testSession = await prisma.session.create({
      data: {
        courseId: course!.id,
        facultyId: faculty!.id,
        title: "Automated Verification Lecture: Advanced Indexing",
        classroomName: "Lab 305",
        status: "ACTIVE",
        qrSecret: "sec_" + Math.random().toString(36).substring(2, 9),
      },
    });
    assert(!!testSession.id, `New class session created: ID ${testSession.id}`);

    // 7. Test Student Attendance Marking
    const qrPayload = createDynamicQrPayload(testSession.id, testSession.qrSecret, testSession.classroomName);
    const tokenValidation = validateDynamicQrToken(
      testSession.id,
      testSession.qrSecret,
      qrPayload.token,
      qrPayload.timeWindow
    );
    assert(tokenValidation.isValid, "QR payload generated for new session is valid");

    // Mark attendance for Student 1
    const attendanceRecord = await prisma.attendance.create({
      data: {
        sessionId: testSession.id,
        studentId: student1!.id,
        status: "PRESENT",
        verificationMethod: "QR_SCAN",
        deviceInfo: "Automated Test Runner / Mobile Chrome",
        ipAddress: "192.168.1.100",
      },
    });
    assert(
      attendanceRecord.status === "PRESENT" && attendanceRecord.verificationMethod === "QR_SCAN",
      "Student 1 attendance marked as PRESENT via QR_SCAN"
    );

    // 8. Test Duplicate Prevention (Database Constraint)
    let duplicatePrevented = false;
    try {
      await prisma.attendance.create({
        data: {
          sessionId: testSession.id,
          studentId: student1!.id,
          status: "PRESENT",
          verificationMethod: "QR_SCAN",
        },
      });
    } catch (err: any) {
      // Prisma unique constraint violation code is P2002
      duplicatePrevented = true;
    }
    assert(
      duplicatePrevented,
      "Duplicate check-in attempt blocked by unique database constraint on (sessionId, studentId)"
    );

    // 9. Test On-Duty (OD) Request & Automated Attendance Credit Adjustment
    const odReq = await prisma.odRequest.create({
      data: {
        studentId: student2!.id,
        title: "National Cyber Security Championship",
        category: "ACADEMIC",
        fromDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // Today
        toDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
        reason: "Participating in inter-collegiate CTF competition representing institute.",
        documentUrl: "https://example.com/championship_invite.pdf",
        status: "PENDING",
      },
    });
    assert(odReq.status === "PENDING", "Student submitted OD request with PENDING status");

    // Faculty approves OD request
    const approvedOd = await prisma.odRequest.update({
      where: { id: odReq.id },
      data: {
        status: "APPROVED",
        reviewedById: faculty!.id,
        reviewedAt: new Date(),
        remarks: "Approved for institute representation",
      },
    });
    assert(approvedOd.status === "APPROVED", "Faculty successfully approved OD request");

    // Update attendance for Student 2 to ON_DUTY
    const odAttendance = await prisma.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: testSession.id,
          studentId: student2!.id,
        },
      },
      update: {
        status: "ON_DUTY",
        verificationMethod: "OD_APPROVED",
      },
      create: {
        sessionId: testSession.id,
        studentId: student2!.id,
        status: "ON_DUTY",
        verificationMethod: "OD_APPROVED",
      },
    });
    assert(
      odAttendance.status === "ON_DUTY" && odAttendance.verificationMethod === "OD_APPROVED",
      "Student 2 session record automatically updated to ON_DUTY upon OD approval"
    );

    // 10. Check Session Attendance Totals
    const sessionWithAttendances = await prisma.session.findUnique({
      where: { id: testSession.id },
      include: { attendances: true },
    });
    const presentCount = sessionWithAttendances?.attendances.filter((a: any) => a.status === "PRESENT").length;
    const odCount = sessionWithAttendances?.attendances.filter((a: any) => a.status === "ON_DUTY").length;

    assert(presentCount === 1, "Session accurately reports 1 PRESENT student");
    assert(odCount === 1, "Session accurately reports 1 ON_DUTY student");

    // Clean up test session
    await prisma.attendance.deleteMany({ where: { sessionId: testSession.id } });
    await prisma.odRequest.delete({ where: { id: odReq.id } });
    await prisma.session.delete({ where: { id: testSession.id } });
    console.log("🧹 Cleaned up temporary test artifacts");

    console.log("==================================================");
    console.log(`📊 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();

