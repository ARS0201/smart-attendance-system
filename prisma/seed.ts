import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Clearing old data...");
  await prisma.attendance.deleteMany();
  await prisma.odRequest.deleteMany();
  await prisma.session.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("🌱 Seeding Users...");
  const facultyAlan = await prisma.user.create({
    data: {
      email: "faculty@smartattend.edu",
      password: passwordHash,
      name: "Dr. Alan Turing",
      role: "FACULTY",
      department: "Computer Science & Engineering",
    },
  });

  const facultyAda = await prisma.user.create({
    data: {
      email: "ada@smartattend.edu",
      password: passwordHash,
      name: "Prof. Ada Lovelace",
      role: "FACULTY",
      department: "Computer Science & Engineering",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@smartattend.edu",
      password: passwordHash,
      name: "Dean of Academic Affairs",
      role: "ADMIN",
      department: "Academic Administration",
    },
  });

  const studentsData = [
    { name: "John Doe", email: "student@smartattend.edu", roll: "21CS001" },
    { name: "Jane Smith", email: "jane@smartattend.edu", roll: "21CS002" },
    { name: "Alex Rivera", email: "alex@smartattend.edu", roll: "21CS003" },
    { name: "Priya Sharma", email: "priya@smartattend.edu", roll: "21CS004" },
    { name: "Liam Chen", email: "liam@smartattend.edu", roll: "21CS005" },
    { name: "Maya Patel", email: "maya@smartattend.edu", roll: "21CS006" },
  ];

  const students = [];
  for (const s of studentsData) {
    const student = await prisma.user.create({
      data: {
        email: s.email,
        password: passwordHash,
        name: s.name,
        rollNumber: s.roll,
        role: "STUDENT",
        department: "Computer Science & Engineering",
      },
    });
    students.push(student);
  }

  console.log("🌱 Seeding Courses...");
  const courseCS301 = await prisma.course.create({
    data: {
      code: "CS301",
      name: "Database Management Systems",
      department: "Computer Science & Engineering",
      semester: 5,
      facultyId: facultyAlan.id,
    },
  });

  const courseCS302 = await prisma.course.create({
    data: {
      code: "CS302",
      name: "Operating Systems & Kernels",
      department: "Computer Science & Engineering",
      semester: 5,
      facultyId: facultyAda.id,
    },
  });

  const courseCS303 = await prisma.course.create({
    data: {
      code: "CS303",
      name: "Computer Networks & Security",
      department: "Computer Science & Engineering",
      semester: 5,
      facultyId: facultyAlan.id,
    },
  });

  console.log("🌱 Enrolling Students...");
  for (const student of students) {
    for (const course of [courseCS301, courseCS302, courseCS303]) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          courseId: course.id,
        },
      });
    }
  }

  console.log("🌱 Seeding Sessions and Past Attendances...");
  // Past completed session for CS301
  const pastSession = await prisma.session.create({
    data: {
      courseId: courseCS301.id,
      facultyId: facultyAlan.id,
      title: "Lecture 14: Relational Indexing & B-Trees",
      sessionDate: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2), // 2 days ago
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2),
      endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2 + 50 * 60 * 1000),
      status: "COMPLETED",
      classroomName: "Auditorium Hall 101",
    },
  });

  // Mark attendance for past session
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    // John, Jane, Alex present; Priya on duty; Liam absent; Maya present
    const status = i === 3 ? "ON_DUTY" : i === 4 ? "ABSENT" : "PRESENT";
    await prisma.attendance.create({
      data: {
        sessionId: pastSession.id,
        studentId: student.id,
        status: status,
        verificationMethod: status === "ON_DUTY" ? "OD_APPROVED" : "QR_SCAN",
        deviceInfo: "Chrome Mobile / Android 14",
        ipAddress: "192.168.1.10" + i,
      },
    });
  }

  // Active Session for CS301 (Today)
  const activeSession = await prisma.session.create({
    data: {
      courseId: courseCS301.id,
      facultyId: facultyAlan.id,
      title: "Lecture 15: Query Optimization & Execution Plans",
      sessionDate: new Date(),
      startTime: new Date(),
      status: "ACTIVE",
      classroomName: "Room 402, CS Block",
      qrSecret: "sec_" + Math.random().toString(36).substring(2, 9),
    },
  });

  // Mark John Doe already checked in into active session
  await prisma.attendance.create({
    data: {
      sessionId: activeSession.id,
      studentId: students[0].id,
      status: "PRESENT",
      verificationMethod: "QR_SCAN",
      deviceInfo: "Safari iOS 18 / iPhone 15 Pro",
      ipAddress: "192.168.1.45",
    },
  });

  console.log("🌱 Seeding On-Duty (OD) Requests...");
  // 1. Pending OD from Priya
  await prisma.odRequest.create({
    data: {
      studentId: students[3].id, // Priya
      title: "Smart India Hackathon 2026 Grand Finale",
      category: "ACADEMIC",
      fromDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      toDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      reason: "Selected as team leader representing college at national SIH finals in New Delhi.",
      documentUrl: "https://example.com/sih_invitation_letter.pdf",
      status: "PENDING",
    },
  });

  // 2. Approved OD from Alex
  await prisma.odRequest.create({
    data: {
      studentId: students[2].id, // Alex
      title: "State Level Inter-Collegiate Basketball Tournament",
      category: "SPORTS",
      fromDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      toDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reason: "Represented university varsity basketball squad as starting point guard.",
      documentUrl: "https://example.com/sports_certificate.pdf",
      status: "APPROVED",
      reviewedById: facultyAlan.id,
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      remarks: "Verified with Sports Director. Granted.",
    },
  });

  // 3. Rejected OD from Liam
  await prisma.odRequest.create({
    data: {
      studentId: students[4].id, // Liam
      title: "Local Meetup Attendance",
      category: "CULTURAL",
      fromDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      toDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reason: "Attended community tech meetup downtown.",
      documentUrl: "https://example.com/ticket.pdf",
      status: "REJECTED",
      reviewedById: facultyAlan.id,
      reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      remarks: "Informal event without prior HoD permission slip.",
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

