import prisma from "../src/lib/prisma";

async function clearDatabase() {
  console.log("🧹 Starting complete database wipe of Supabase tables...");

  const delAttendances = await prisma.attendance.deleteMany();
  console.log(`✅ Deleted ${delAttendances.count} Attendance records`);

  const delOds = await prisma.odRequest.deleteMany();
  console.log(`✅ Deleted ${delOds.count} On-Duty requests`);

  const delSessions = await prisma.session.deleteMany();
  console.log(`✅ Deleted ${delSessions.count} Class Sessions`);

  const delEnrollments = await prisma.enrollment.deleteMany();
  console.log(`✅ Deleted ${delEnrollments.count} Course Enrollments`);

  const delCourses = await prisma.course.deleteMany();
  console.log(`✅ Deleted ${delCourses.count} Courses`);

  const delUsers = await prisma.user.deleteMany();
  console.log(`✅ Deleted ${delUsers.count} Users`);

  console.log("✨ All tables are now completely empty and ready for fresh entries!");
}

clearDatabase()
  .catch((e) => {
    console.error("Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

