const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;
const hash = (pwd) => bcrypt.hashSync(pwd, SALT_ROUNDS);

// 3 Real/Active Animal Rescue NGOs in Nagpur, Maharashtra
const initialNgos = [
  {
    id: "NGO-01",
    name: "Save Speechless Animals Foundation (SSAF Nagpur)",
    regId: "MH/NGP/2018/00341",
    ownerName: "Smita Mire",
    email: "ssaf@nagpurrescue.org",
    phone: "+91 98230 45671",
    address: "Near Besa-Pipla Road, South Nagpur, Maharashtra - 440037",
    latitude: 21.0872,
    longitude: 79.0915,
    operatingHours: "24/7 Emergency Animal Ambulance",
    capacity: 50,
    activeRescues: 3,
    description: "Dedicated animal rescue trust in South Nagpur with 24-hour critical ambulance, trauma surgery unit, and recovery shelter."
  },
  {
    id: "NGO-02",
    name: "People For Animals (PFA) Nagpur",
    regId: "MH/NGP/2012/00189",
    ownerName: "Karishma Galani",
    email: "pfa@nagpurrescue.org",
    phone: "+91 98222 12345",
    address: "Wardha Road, Dhantoli / Congress Nagar, Central Nagpur, Maharashtra - 440012",
    latitude: 21.1315,
    longitude: 79.0805,
    operatingHours: "08:00 AM - 10:00 PM (Emergency unit on-call)",
    capacity: 65,
    activeRescues: 3,
    description: "Multi-species rescue shelter providing emergency inpatient care, veterinary surgery, and rehabilitation in Central Nagpur."
  },
  {
    id: "NGO-03",
    name: "Nagpur Paws Animal Rescue & Care Shelter",
    regId: "MH/NGP/2020/00512",
    ownerName: "Tanmay Sharma",
    email: "paws@nagpurrescue.org",
    phone: "+91 98901 88992",
    address: "Near Futala Lake Road, Dharampeth / West Nagpur, Maharashtra - 440010",
    latitude: 21.1558,
    longitude: 79.0532,
    operatingHours: "07:00 AM - 11:00 PM",
    capacity: 40,
    activeRescues: 2,
    description: "Community animal welfare foundation focusing on emergency street dog rescue, cat treatment, and ABC sterilization in West Nagpur."
  }
];

// Nagpur Field Volunteers
const initialVolunteers = [
  {
    id: "VOL-01",
    name: "Sagar Wankhede",
    email: "sagar@volunteer.org",
    phone: "+91 98230 11221",
    ngoId: "NGO-01",
    ngoName: "Save Speechless Animals Foundation (SSAF Nagpur)",
    role: "Senior First Responder",
    status: "On Field",
    vehicleType: "Rescue Ambulance Van",
    currentActiveCases: 2,
    creditPoints: 450,
    rescuesCompleted: 6,
    badge: "Silver Guardian 🥈"
  },
  {
    id: "VOL-02",
    name: "Riya Deshmukh",
    email: "riya@volunteer.org",
    phone: "+91 98230 11222",
    ngoId: "NGO-01",
    ngoName: "Save Speechless Animals Foundation (SSAF Nagpur)",
    role: "Veterinary Assistant",
    status: "Available",
    vehicleType: "Scooter with First Aid Kit",
    currentActiveCases: 0,
    creditPoints: 150,
    rescuesCompleted: 2,
    badge: "Bronze Rescuer 🥉"
  },
  {
    id: "VOL-03",
    name: "Amit Meshram",
    email: "amit@volunteer.org",
    phone: "+91 98222 33441",
    ngoId: "NGO-02",
    ngoName: "People For Animals (PFA) Nagpur",
    role: "Large Animal & Wildlife Handler",
    status: "On Field",
    vehicleType: "Hydraulic Animal Ambulance",
    currentActiveCases: 2,
    creditPoints: 720,
    rescuesCompleted: 9,
    badge: "Gold Life Saver 🥇"
  },
  {
    id: "VOL-04",
    name: "Pooja Kulkarni",
    email: "pooja@volunteer.org",
    phone: "+91 98222 33442",
    ngoId: "NGO-02",
    ngoName: "People For Animals (PFA) Nagpur",
    role: "Feline & Avian Specialist",
    status: "Available",
    vehicleType: "Car with Secure Carrier",
    currentActiveCases: 1,
    creditPoints: 280,
    rescuesCompleted: 3,
    badge: "Silver Guardian 🥈"
  },
  {
    id: "VOL-05",
    name: "Chetan Raut",
    email: "chetan@volunteer.org",
    phone: "+91 98901 55661",
    ngoId: "NGO-03",
    ngoName: "Nagpur Paws Animal Rescue & Care Shelter",
    role: "Community Field Responder",
    status: "On Field",
    vehicleType: "Motorcycle with Medical Pouch",
    currentActiveCases: 1,
    creditPoints: 390,
    rescuesCompleted: 5,
    badge: "Silver Guardian 🥈"
  }
];

// Registered Accounts
const initialUsers = [
  {
    id: "USR-01",
    name: "System Administrator",
    email: "admin@rescue.org",
    phone: "+91 98230 00000",
    passwordHash: hash("admin123"),
    role: "admin",
    ngoId: null,
    createdAt: "2026-09-01T10:00:00.000Z"
  },
  {
    id: "USR-02",
    name: "Smita Mire (SSAF Nagpur)",
    email: "ssaf@nagpurrescue.org",
    phone: "+91 98230 45671",
    passwordHash: hash("ngo123"),
    role: "ngo",
    ngoId: "NGO-01",
    createdAt: "2026-09-02T11:00:00.000Z"
  },
  {
    id: "USR-03",
    name: "Karishma Galani (PFA Nagpur)",
    email: "pfa@nagpurrescue.org",
    phone: "+91 98222 12345",
    passwordHash: hash("ngo123"),
    role: "ngo",
    ngoId: "NGO-02",
    createdAt: "2026-09-03T09:30:00.000Z"
  },
  {
    id: "USR-04",
    name: "Tanmay Sharma (Nagpur Paws)",
    email: "paws@nagpurrescue.org",
    phone: "+91 98901 88992",
    passwordHash: hash("ngo123"),
    role: "ngo",
    ngoId: "NGO-03",
    createdAt: "2026-09-04T10:15:00.000Z"
  },
  {
    id: "USR-05",
    name: "Sagar Wankhede",
    email: "sagar@volunteer.org",
    phone: "+91 98230 11221",
    passwordHash: hash("volunteer123"),
    role: "volunteer",
    volunteerId: "VOL-01",
    ngoId: "NGO-01",
    createdAt: "2026-09-05T14:15:00.000Z"
  },
  {
    id: "USR-06",
    name: "Amit Meshram",
    email: "amit@volunteer.org",
    phone: "+91 98222 33441",
    passwordHash: hash("volunteer123"),
    role: "volunteer",
    volunteerId: "VOL-03",
    ngoId: "NGO-02",
    createdAt: "2026-09-06T15:20:00.000Z"
  },
  {
    id: "USR-07",
    name: "Priya Sharma",
    email: "priya@nagpur.org",
    phone: "+91 98224 55667",
    passwordHash: hash("citizen123"),
    role: "citizen",
    ngoId: null,
    createdAt: "2026-09-10T12:00:00.000Z"
  }
];

// 10 Rescue Cases located across Nagpur landmarks with precise Nagpur GPS coordinates
const initialReports = [
  {
    id: 1021,
    caseId: "ARC-1021",
    animalType: "Dog",
    animalCondition: "Hit and Run",
    priority: "Critical",
    description: "Hit by speeding four-wheeler near Sitabuldi flyover pillar 12. Hind leg bleeding and fracture, unable to stand, sheltered near road divider.",
    locationText: "Near Sitabuldi Metro Station & Flyover Pillar 12, Nagpur",
    latitude: 21.1448,
    longitude: 79.0835,
    photoUrl: "/public/images/cases/case-1021.jpg",
    reporterName: "Priya Sharma",
    reporterPhone: "+91 98224 55667",
    status: "On the Way",
    assignedNgoId: "NGO-02",
    assignedNgoName: "People For Animals (PFA) Nagpur",
    assignedVolunteerId: "VOL-03",
    assignedVolunteerName: "Amit Meshram",
    createdAt: "2026-10-08T07:15:00.000Z",
    updatedAt: "2026-10-08T07:35:00.000Z",
    timeline: [
      { status: "Reported", timestamp: "2026-10-08T07:15:00.000Z", note: "Incident reported by citizen Priya Sharma with live GPS coordinates at Sitabuldi." },
      { status: "Assigned", timestamp: "2026-10-08T07:22:00.000Z", note: "Assigned to PFA Nagpur; field responder Amit Meshram dispatched." },
      { status: "On the Way", timestamp: "2026-10-08T07:35:00.000Z", note: "Ambulance van en route with splint kit and stretcher." }
    ]
  },
  {
    id: 1022,
    caseId: "ARC-1022",
    animalType: "Cat",
    animalCondition: "Deep Wound & Dehydration",
    priority: "Urgent",
    description: "Young feline trapped in market alley behind medical stores near GMC, visible deep puncture wound on flank, unable to walk properly.",
    locationText: "Behind Medical Square Market, Near GMC Hospital Gate, Nagpur",
    latitude: 21.1275,
    longitude: 79.0980,
    photoUrl: "/public/images/cases/case-1022.jpg",
    reporterName: "Gaurav Joshi",
    reporterPhone: "+91 98231 44552",
    status: "Treatment",
    assignedNgoId: "NGO-02",
    assignedNgoName: "People For Animals (PFA) Nagpur",
    assignedVolunteerId: "VOL-04",
    assignedVolunteerName: "Pooja Kulkarni",
    createdAt: "2026-10-07T14:10:00.000Z",
    updatedAt: "2026-10-08T09:00:00.000Z",
    timeline: [
      { status: "Reported", timestamp: "2026-10-07T14:10:00.000Z", note: "Reported by shopkeeper Gaurav near Medical Square." },
      { status: "Assigned", timestamp: "2026-10-07T14:20:00.000Z", note: "Assigned to PFA Nagpur shelter clinic." },
      { status: "On the Way", timestamp: "2026-10-07T14:40:00.000Z", note: "Pooja Kulkarni dispatched with cat rescue carrier." },
      { status: "Rescued", timestamp: "2026-10-07T15:25:00.000Z", note: "Cat safely secured in carrier and transported to veterinary center." },
      { status: "Treatment", timestamp: "2026-10-07T16:30:00.000Z", note: "Wound dressed with antiseptic, antibiotics administered, IV fluids running." }
    ]
  },
  {
    id: 1023,
    caseId: "ARC-1023",
    animalType: "Cow",
    animalCondition: "Open Trauma / Ingestion Issue",
    priority: "Critical",
    description: "Calf collapsed on main carriageway near Ajni Square during morning rush hour, bleeding near shoulder, heavy traffic danger.",
    locationText: "Near Ajni Square Flyover, Wardha Road, Nagpur",
    latitude: 21.1180,
    longitude: 79.0760,
    photoUrl: "/public/images/cases/case-1023.jpg",
    reporterName: "Nitin Raut",
    reporterPhone: "+91 98223 99881",
    status: "Rescued",
    assignedNgoId: "NGO-02",
    assignedNgoName: "People For Animals (PFA) Nagpur",
    assignedVolunteerId: "VOL-03",
    assignedVolunteerName: "Amit Meshram",
    createdAt: "2026-10-07T18:00:00.000Z",
    updatedAt: "2026-10-07T20:15:00.000Z",
    timeline: [
      { status: "Reported", timestamp: "2026-10-07T18:00:00.000Z", note: "Road safety hazard reported with collapsed calf on Wardha Road." },
      { status: "Assigned", timestamp: "2026-10-07T18:05:00.000Z", note: "Hydraulic animal ambulance dispatched from PFA Nagpur." },
      { status: "On the Way", timestamp: "2026-10-07T18:20:00.000Z", note: "Ambulance team en route with vet assistant." },
      { status: "Rescued", timestamp: "2026-10-07T20:15:00.000Z", note: "Calf safely loaded via hydraulic ramp; shifted to sanctuary trauma ward." }
    ]
  },
  {
    id: 1024,
    caseId: "ARC-1024",
    animalType: "Bird (Pigeon)",
    animalCondition: "Manja / Thread Entanglement",
    priority: "Urgent",
    description: "Pigeon hung upside down from branch due to kite thread (manja) tangled around wings near Shukrawari lake. Weak wing flapping.",
    locationText: "Banyan Tree near Gandhi Sagar Lake (Shukrawari Talao), Mahal, Nagpur",
    latitude: 21.1450,
    longitude: 79.1020,
    photoUrl: "/public/images/cases/case-1024.jpg",
    reporterName: "Rohan Agrawal",
    reporterPhone: "+91 98235 77112",
    status: "Completed",
    assignedNgoId: "NGO-01",
    assignedNgoName: "Save Speechless Animals Foundation (SSAF Nagpur)",
    assignedVolunteerId: "VOL-01",
    assignedVolunteerName: "Sagar Wankhede",
    createdAt: "2026-10-06T11:00:00.000Z",
    updatedAt: "2026-10-06T14:40:00.000Z",
    timeline: [
      { status: "Reported", timestamp: "2026-10-06T11:00:00.000Z", note: "Report received from citizen near Gandhi Sagar." },
      { status: "Assigned", timestamp: "2026-10-06T11:15:00.000Z", note: "Assigned to SSAF Nagpur responder Sagar Wankhede with ladder." },
      { status: "On the Way", timestamp: "2026-10-06T11:30:00.000Z", note: "Volunteer reached Gandhi Sagar area." },
      { status: "Rescued", timestamp: "2026-10-06T12:10:00.000Z", note: "Pigeon safely freed from sharp manja." },
      { status: "Treatment", timestamp: "2026-10-06T12:45:00.000Z", note: "Wing wound cleaned with betadine, resting in aviary." },
      { status: "Completed", timestamp: "2026-10-06T14:40:00.000Z", note: "Bird fully recovered flight capability and successfully released." }
    ]
  },
  {
    id: 1025,
    caseId: "ARC-1025",
    animalType: "Dog",
    animalCondition: "Severe Skin Disease (Mange)",
    priority: "Moderate",
    description: "Community indie dog suffering from extreme mange, hair loss, and shivering under a parked bus near Pratap Nagar garden.",
    locationText: "Near Pratap Nagar Ring Road Garden, Nagpur",
    latitude: 21.1155,
    longitude: 79.0550,
    photoUrl: "/public/images/cases/case-1025.jpg",
    reporterName: "Kavita Sen",
    reporterPhone: "+91 98229 33118",
    status: "Assigned",
    assignedNgoId: "NGO-03",
    assignedNgoName: "Nagpur Paws Animal Rescue & Care Shelter",
    assignedVolunteerId: "VOL-05",
    assignedVolunteerName: "Chetan Raut",
    createdAt: "2026-10-08T08:30:00.000Z",
    updatedAt: "2026-10-08T09:15:00.000Z",
    timeline: [
      { status: "Reported", timestamp: "2026-10-08T08:30:00.000Z", note: "Reported with photos of skin infection." },
      { status: "Assigned", timestamp: "2026-10-08T09:15:00.000Z", note: "Assigned to Nagpur Paws. Medicated bath and on-site treatment scheduled." }
    ]
  },
  {
    id: 1026,
    caseId: "ARC-1026",
    animalType: "Dog",
    animalCondition: "Suspected Limb Fracture",
    priority: "Critical",
    description: "Brown stray dog limping severely, unable to put any weight on front right paw after getting struck by auto rickshaw near Mount Road.",
    locationText: "Near Sadar Residency Road, Mount Road Junction, Nagpur",
    latitude: 21.1630,
    longitude: 79.0810,
    photoUrl: "/public/images/cases/case-1026.jpg",
    reporterName: "Deepak Chawla",
    reporterPhone: "+91 98233 44110",
    status: "Reported",
    assignedNgoId: "NGO-03",
    assignedNgoName: "Nagpur Paws Animal Rescue & Care Shelter",
    assignedVolunteerId: null,
    assignedVolunteerName: null,
    createdAt: "2026-10-08T11:45:00.000Z",
    updatedAt: "2026-10-08T11:45:00.000Z",
    timeline: [
      { status: "Reported", timestamp: "2026-10-08T11:45:00.000Z", note: "Case logged by citizen in Sadar. Nearest NGO automatically matched." }
    ]
  },
  {
    id: 1027,
    caseId: "ARC-1027",
    animalType: "Cat",
    animalCondition: "Abandoned Kittens",
    priority: "Low / Shelter Care",
    description: "Litter of 3 newborn kittens found inside a cardboard box near public park gate. Mother nowhere in sight.",
    locationText: "Children Traffic Park Lane, Dharampeth, West Nagpur",
    latitude: 21.1420,
    longitude: 79.0620,
    photoUrl: "/public/images/cases/case-1027.jpg",
    reporterName: "Simran Kaur",
    reporterPhone: "+91 98226 12098",
    status: "Treatment",
    assignedNgoId: "NGO-03",
    assignedNgoName: "Nagpur Paws Animal Rescue & Care Shelter",
    assignedVolunteerId: "VOL-05",
    assignedVolunteerName: "Chetan Raut",
    createdAt: "2026-10-05T09:00:00.000Z",
    updatedAt: "2026-10-06T11:00:00.000Z",
    timeline: [
      { status: "Reported", timestamp: "2026-10-05T09:00:00.000Z", note: "Abandoned kittens reported in Dharampeth." },
      { status: "Assigned", timestamp: "2026-10-05T09:20:00.000Z", note: "Nagpur Paws field responder Chetan Raut assigned." },
      { status: "On the Way", timestamp: "2026-10-05T09:40:00.000Z", note: "Responder en route." },
      { status: "Rescued", timestamp: "2026-10-05T10:30:00.000Z", note: "Kittens collected safely and placed in warm incubator." },
      { status: "Treatment", timestamp: "2026-10-06T11:00:00.000Z", note: "Bottle feeding and neonatal observation active." }
    ]
  },
  {
    id: 1028,
    caseId: "ARC-1028",
    animalType: "Dog",
    animalCondition: "Puppy Trapped in Drain",
    priority: "Urgent",
    description: "Two-month-old indie puppy fell into uncovered stormwater drain, yelping loudly. Drain depth ~3 feet.",
    locationText: "Manish Nagar Railway Crossing Underpass, South Nagpur",
    latitude: 21.0960,
    longitude: 79.0820,
    photoUrl: "/public/images/cases/case-1028.jpg",
    reporterName: "Vikas Mehra",
    reporterPhone: "+91 98234 66778",
    status: "Completed",
    assignedNgoId: "NGO-01",
    assignedNgoName: "Save Speechless Animals Foundation (SSAF Nagpur)",
    assignedVolunteerId: "VOL-01",
    assignedVolunteerName: "Sagar Wankhede",
    createdAt: "2026-10-04T16:00:00.000Z",
    updatedAt: "2026-10-04T18:30:00.000Z",
    timeline: [
      { status: "Reported", timestamp: "2026-10-04T16:00:00.000Z", note: "Reported with exact location at Manish Nagar." },
      { status: "Assigned", timestamp: "2026-10-04T16:10:00.000Z", note: "Assigned to SSAF Nagpur responder Sagar." },
      { status: "On the Way", timestamp: "2026-10-04T16:25:00.000Z", note: "Volunteer reached underpass." },
      { status: "Rescued", timestamp: "2026-10-04T17:10:00.000Z", note: "Puppy safely lifted using rescue net." },
      { status: "Treatment", timestamp: "2026-10-04T17:45:00.000Z", note: "Cleaned, fed, and checked for internal injuries. Healthy." },
      { status: "Completed", timestamp: "2026-10-04T18:30:00.000Z", note: "Reunited with mother dog in neighborhood." }
    ]
  },
  {
    id: 1029,
    caseId: "ARC-1029",
    animalType: "Monkey",
    animalCondition: "Electric Shock Burn",
    priority: "Critical",
    description: "Rhesus macaque suffered electric shock on overhead transformer near walking track, burns on hand, resting on boundary wall.",
    locationText: "Near Seminary Hills Walking Track / Japanese Garden, Nagpur",
    latitude: 21.1680,
    longitude: 79.0610,
    photoUrl: "/public/images/cases/case-1029.jpg",
    reporterName: "Tanya Sen",
    reporterPhone: "+91 98221 88990",
    status: "On the Way",
    assignedNgoId: "NGO-02",
    assignedNgoName: "People For Animals (PFA) Nagpur",
    assignedVolunteerId: "VOL-03",
    assignedVolunteerName: "Amit Meshram",
    createdAt: "2026-10-08T10:00:00.000Z",
    updatedAt: "2026-10-08T10:45:00.000Z",
    timeline: [
      { status: "Reported", timestamp: "2026-10-08T10:00:00.000Z", note: "Wildlife injury reported near Seminary Hills." },
      { status: "Assigned", timestamp: "2026-10-08T10:15:00.000Z", note: "PFA Nagpur wildlife ambulance unit dispatched." },
      { status: "On the Way", timestamp: "2026-10-08T10:45:00.000Z", note: "Rescue team en route with specialized net and burn kit." }
    ]
  },
  {
    id: 1030,
    caseId: "ARC-1030",
    animalType: "Dog",
    animalCondition: "Mild Limp & Starvation",
    priority: "Moderate",
    description: "Old indie dog very weak and malnourished, moving slowly with mild limp near college entrance.",
    locationText: "Outside VNIT Main Gate, Abhyankar Nagar / Bajaj Nagar, Nagpur",
    latitude: 21.1240,
    longitude: 79.0510,
    photoUrl: "/public/images/cases/case-1030.jpg",
    reporterName: "Abhishek Patil",
    reporterPhone: "+91 98236 11223",
    status: "Reported",
    assignedNgoId: "NGO-02",
    assignedNgoName: "People For Animals (PFA) Nagpur",
    assignedVolunteerId: null,
    assignedVolunteerName: null,
    createdAt: "2026-10-08T12:30:00.000Z",
    updatedAt: "2026-10-08T12:30:00.000Z",
    timeline: [
      { status: "Reported", timestamp: "2026-10-08T12:30:00.000Z", note: "Citizen reported geriatric street dog near VNIT Nagpur gate." }
    ]
  }
];

module.exports = {
  initialNgos,
  initialVolunteers,
  initialUsers,
  initialReports
};
