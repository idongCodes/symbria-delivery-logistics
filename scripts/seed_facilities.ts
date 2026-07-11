import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ROUTE_DATA = [
  {
    id: "001",
    region: "North East (NE)",
    stops: [
      { name: "Beaumont at Northborough", address: "238 W Main St, Northborough, MA 01532", phone: "508-393-2368" },
      { name: "Beaumont at Westborough", address: "3 Lyman St, Westborough, MA 01581", phone: "508-366-9933" },
      { name: "Whitney Place at Natick", address: "3 Vision Dr, Natick, MA 01760", phone: "508-655-5000" },
      { name: "Lasell Village", address: "120 Seminary Ave, Auburndale, MA 02466", phone: "617-663-7100" },
      { name: "Campion", address: "319 Concord Rd, Weston, MA 02493", phone: "781-788-6800" },
      { name: "Newbury Court", address: "100 Newbury Ct, Concord, MA 01742", phone: "978-402-8261" },
      { name: "Edgewood at the Meadows", address: "575 Osgood St, North Andover, MA 01845", phone: "978-725-4121" },
      { name: "Sherrill House", address: "135 S Huntington Ave, Boston, MA 02130", phone: "617-731-2400" },
      { name: "South Cove", address: "288 Washington St, Quincy, MA 02169", phone: "617-423-0590" },
      { name: "Dwyer Home", address: "25 Stonehaven Dr, Weymouth, MA 02190", phone: "781-660-5050" },
    ]
  },
  {
    id: "002",
    region: "South West (SW)",
    stops: [
      { name: "The Overlook", address: "88 Masonic Home rd, Charlton, MA 01507", phone: "508-202-4090" },
      { name: "Livewell", address: "1261 S Main St, Plantsville, CT 06479", phone: "508-628-9000" },
      { name: "Health Center at the Willows", address: "101 Barry Rd, Worcester, MA 01609", phone: "508-755-0088" },
      { name: "Holy Trinity", address: "300 Barber Ave, Worcester, MA 01606", phone: "508-852-1000" },
      { name: "Dodge Park", address: "101 Randolph Rd, Worcester, MA 01606", phone: "508-853-8180" },
      { name: "Oasis at Dodge Park", address: "102 Randolph Rd, Worcester, MA 01606", phone: "508-853-8180" },
      { name: "Knollwood", address: "87 Briarwood Cir, Worcester, MA 01606", phone: "508-853-6910" },
    ]
  },
  {
    id: "003",
    region: "South East (SE)",
    stops: [
      { name: "Madonna Manor", address: "85 N Washington St, North Attleboro, MA 02760", phone: "617-731-2400" },
      { name: "Marian Manor", address: "33 Summer St, Taunton, MA 02780", phone: "508-822-4885" },
    ]
  }
];

async function main() {
  const allStops = ROUTE_DATA.flatMap(r => r.stops);
  let createdCount = 0;
  
  for (const stop of allStops) {
    try {
      await prisma.facility.upsert({
        where: { name: stop.name },
        update: {
          address: stop.address,
          phone: stop.phone,
        },
        create: {
          name: stop.name,
          address: stop.address,
          phone: stop.phone,
        },
      });
      createdCount++;
    } catch (e) {
      console.error('Error with stop:', stop.name, e);
    }
  }
  
  console.log("Finished upserting " + createdCount + " facilities.");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
