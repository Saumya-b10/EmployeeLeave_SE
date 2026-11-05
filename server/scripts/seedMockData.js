const dotenv = require("dotenv");
dotenv.config();

const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Leave = require("../models/Leave");
const Reimbursement = require("../models/Reimbursement");

const seedMockData = async () => {
  try {
    if (!process.env.MONGO_DB_URL) {
      console.error("Error: MONGO_DB_URL is not defined in environment variables.");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("Connected to MongoDB for mock data seeding.");

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash("123456", salt);

    // 1. Ensure Arya is manager
    let arya = await User.findOne({ email: "arya12@gmail.com" });
    if (arya) {
      arya.role = "manager";
      arya.department = "Engineering";
      arya.password = defaultPasswordHash;
      await arya.save();
      console.log("Verified Arya as Manager (Engineering) with password: 123456.");
    } else {
      arya = await User.create({
        name: "Arya (Manager)",
        email: "arya12@gmail.com",
        password: defaultPasswordHash,
        role: "manager",
        department: "Engineering",
        totalLeaveDays: 20,
      });
      console.log("Created Arya as Manager (Engineering).");
    }

    // 2. Ensure Test Employee is employee
    let testEmp = await User.findOne({ email: "employee_test@example.com" });
    if (testEmp) {
      testEmp.role = "employee";
      testEmp.department = "Engineering";
      testEmp.password = defaultPasswordHash;
      await testEmp.save();
      console.log("Verified Test Employee as Employee (Engineering) with password: 123456.");
    } else {
      testEmp = await User.create({
        name: "Vikram Malhotra (Test Employee)",
        email: "employee_test@example.com",
        password: defaultPasswordHash,
        role: "employee",
        department: "Engineering",
        totalLeaveDays: 20,
      });
      console.log("Created Vikram Malhotra as Employee (Engineering).");
    }

    // 3. Create 2 Indian employees: Rohan Sharma & Priya Patel
    let rohan = await User.findOne({ email: "rohan.sharma@swiftly.in" });
    if (!rohan) {
      rohan = await User.create({
        name: "Rohan Sharma",
        email: "rohan.sharma@swiftly.in",
        password: defaultPasswordHash,
        role: "employee",
        department: "Engineering",
        totalLeaveDays: 20,
      });
      console.log("Created Employee: Rohan Sharma (Engineering).");
    } else {
      rohan.role = "employee";
      rohan.password = defaultPasswordHash;
      await rohan.save();
      console.log("Updated Employee: Rohan Sharma with password: 123456.");
    }

    let priya = await User.findOne({ email: "priya.patel@swiftly.in" });
    if (!priya) {
      priya = await User.create({
        name: "Priya Patel",
        email: "priya.patel@swiftly.in",
        password: defaultPasswordHash,
        role: "employee",
        department: "Finance",
        totalLeaveDays: 20,
      });
      console.log("Created Employee: Priya Patel (Finance).");
    } else {
      priya.role = "employee";
      priya.password = defaultPasswordHash;
      await priya.save();
      console.log("Updated Employee: Priya Patel with password: 123456.");
    }

    // Clear existing leaves and reimbursements to seed fresh clean data
    await Leave.deleteMany({});
    await Reimbursement.deleteMany({});
    console.log("Cleared old mock leaves and reimbursements.");

    // Accurate, high-quality, local vector bill receipts (zero 404 errors)
    const bills = {
      olaCab: "/bills/ola-cab-receipt.svg",
      airtelFiber: "/bills/airtel-fiber-invoice.svg",
      barbequeNation: "/bills/barbeque-nation-bill.svg",
      logitechCroma: "/bills/logitech-croma-invoice.svg",
      featherliteChair: "/bills/featherlite-chair-invoice.svg",
      indigoFlight: "/bills/indigo-flight-ticket.svg",
      uberCab: "/bills/uber-cab-receipt.svg",
      theOberoi: "/bills/the-oberoi-dining-bill.svg",
      scrumCert: "/bills/scrum-certification-receipt.svg",
    };

    // 4. Seed Leaves
    const leavesData = [
      // Rohan Sharma (Engineering)
      {
        user: rohan._id,
        fromDate: new Date("2026-10-28T00:00:00.000Z"),
        toDate: new Date("2026-11-02T00:00:00.000Z"),
        reason: "Diwali festival celebrations with family in Varanasi",
        status: "approved",
      },
      {
        user: rohan._id,
        fromDate: new Date("2026-11-20T00:00:00.000Z"),
        toDate: new Date("2026-11-24T00:00:00.000Z"),
        reason: "Attending sister's wedding ceremony in Jaipur",
        status: "pending",
      },

      // Priya Patel (Finance)
      {
        user: priya._id,
        fromDate: new Date("2026-09-14T00:00:00.000Z"),
        toDate: new Date("2026-09-16T00:00:00.000Z"),
        reason: "Medical rest following viral fever and doctor consultation",
        status: "approved",
      },
      {
        user: priya._id,
        fromDate: new Date("2026-12-10T00:00:00.000Z"),
        toDate: new Date("2026-12-15T00:00:00.000Z"),
        reason: "Annual family vacation to Munnar & Kochi (Kerala)",
        status: "pending",
      },
      {
        user: priya._id,
        fromDate: new Date("2026-08-05T00:00:00.000Z"),
        toDate: new Date("2026-08-06T00:00:00.000Z"),
        reason: "Home shifting and personal banking work (Rejected due to month-end audit)",
        status: "rejected",
      },

      // Test Employee (Engineering)
      {
        user: testEmp._id,
        fromDate: new Date("2026-10-01T00:00:00.000Z"),
        toDate: new Date("2026-10-04T00:00:00.000Z"),
        reason: "Quarterly wellness break & road trip to Manali",
        status: "approved",
      },
      {
        user: testEmp._id,
        fromDate: new Date("2026-11-12T00:00:00.000Z"),
        toDate: new Date("2026-11-13T00:00:00.000Z"),
        reason: "Parent-Teacher meeting and family function in Delhi",
        status: "pending",
      },

      // Arya (Manager, Engineering)
      {
        user: arya._id,
        fromDate: new Date("2026-09-07T00:00:00.000Z"),
        toDate: new Date("2026-09-09T00:00:00.000Z"),
        reason: "Ganesh Chaturthi festivities with family at hometown",
        status: "approved",
      },
      {
        user: arya._id,
        fromDate: new Date("2026-11-16T00:00:00.000Z"),
        toDate: new Date("2026-11-18T00:00:00.000Z"),
        reason: "Attending AWS Community Day & Tech Leadership Summit in Bengaluru",
        status: "pending",
      },
    ];

    await Leave.insertMany(leavesData);
    console.log(`Successfully seeded ${leavesData.length} leave requests.`);

    // 5. Seed Reimbursements with accurate matching bills
    const reimbursementData = [
      // Rohan Sharma
      {
        user: rohan._id,
        amount: 850,
        expenseDate: new Date("2026-11-02"),
        description: "Ola cab fare for client meeting at Cyber City, Gurugram",
        billUrl: bills.olaCab,
        billFileId: "local_bill_ola_rohan",
        status: "pending",
      },
      {
        user: rohan._id,
        amount: 1499,
        expenseDate: new Date("2026-10-15"),
        description: "Quarterly broadband internet bill (Airtel Xstream Fiber - Work from Home)",
        billUrl: bills.airtelFiber,
        billFileId: "local_bill_airtel_rohan",
        status: "approved",
      },

      // Priya Patel
      {
        user: priya._id,
        amount: 3200,
        expenseDate: new Date("2026-10-22"),
        description: "Team celebration dinner at Barbeque Nation after Q3 financial closing",
        billUrl: bills.barbequeNation,
        billFileId: "local_bill_bbq_priya",
        status: "approved",
      },
      {
        user: priya._id,
        amount: 2450,
        expenseDate: new Date("2026-11-03"),
        description: "Logitech wireless ergonomic mouse and keyboard set for finance desk",
        billUrl: bills.logitechCroma,
        billFileId: "local_bill_croma_priya",
        status: "pending",
      },
      {
        user: priya._id,
        amount: 12500,
        expenseDate: new Date("2026-09-18"),
        description: "Executive office ergonomic chair upgrade (Exceeded single-claim budget limit)",
        billUrl: bills.featherliteChair,
        billFileId: "local_bill_chair_priya",
        status: "rejected",
      },

      // Test Employee
      {
        user: testEmp._id,
        amount: 6800,
        expenseDate: new Date("2026-11-01"),
        description: "IndiGo flight tickets (Delhi to Mumbai) for client project kick-off",
        billUrl: bills.indigoFlight,
        billFileId: "local_bill_flight_test",
        status: "pending",
      },
      {
        user: testEmp._id,
        amount: 650,
        expenseDate: new Date("2026-10-28"),
        description: "Uber ride from office to Terminal 3 (Indira Gandhi International Airport)",
        billUrl: bills.uberCab,
        billFileId: "local_bill_uber_test",
        status: "approved",
      },

      // Arya (Manager)
      {
        user: arya._id,
        amount: 4500,
        expenseDate: new Date("2026-11-02"),
        description: "Client business lunch meeting with Enterprise stakeholders at The Oberoi",
        billUrl: bills.theOberoi,
        billFileId: "local_bill_oberoi_arya",
        status: "pending",
      },
      {
        user: arya._id,
        amount: 1800,
        expenseDate: new Date("2026-09-25"),
        description: "Professional Agile/Scrum Master certification renewal exam fee",
        billUrl: bills.scrumCert,
        billFileId: "local_bill_scrum_arya",
        status: "approved",
      },
    ];

    await Reimbursement.insertMany(reimbursementData);
    console.log(`Successfully seeded ${reimbursementData.length} reimbursement claims with accurate bills.`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding mock data failed:", error);
    process.exit(1);
  }
};

seedMockData();
