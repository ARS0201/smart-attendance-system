import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function verifySupabase() {
  console.log("🔍 Testing Supabase Database Connection...");
  
  // 1. Count users
  const userCount = await prisma.user.count();
  console.log(`✅ Connected to Supabase! Total users: ${userCount}`);

  // 2. Test inserting a new registered student
  const testEmail = `newstudent_${Date.now()}@college.edu`;
  const hashedPassword = await bcrypt.hash("studentpass123", 10);

  const newUser = await prisma.user.create({
    data: {
      name: "Test Registration User",
      email: testEmail,
      password: hashedPassword,
      role: "STUDENT",
      rollNumber: `ROLL_${Math.floor(Math.random() * 9000 + 1000)}`,
      department: "Information Technology",
    },
  });
  console.log(`✅ Newly signed up user saved to Supabase: ID=${newUser.id}, Email=${newUser.email}`);

  // 3. Test logging in with that user
  const foundUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  const passwordMatches = await bcrypt.compare("studentpass123", foundUser!.password);
  
  if (passwordMatches) {
    console.log("✅ Verified: Registered user can authenticate & login successfully with password!");
  } else {
    throw new Error("Password verification failed");
  }

  // Clean up test user
  await prisma.user.delete({ where: { id: newUser.id } });
  console.log("🧹 Cleaned up temporary test user");
  console.log("🎉 All Supabase authentication tests passed with flying colors!");
}

verifySupabase()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

