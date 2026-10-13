/**
 * Demonstration Properties Dataset
 * NOTE: These are demonstration listings for UI and design review only.
 * They are not verified listings and will be replaced by Firestore collections in production.
 */

export const DEMO_PROPERTIES = [
  {
    id: "prop-1",
    title: "The Celestia Sky Villa — Sea-Facing Penthouse",
    description: "Perched high above the Arabian Sea, this extraordinary duplex penthouse in Bandra West redefines coastal luxury. Featuring double-height ceilings, floor-to-ceiling soundproof glass facades, expansive wrap-around sundecks, and bespoke Italian marble finishes. Includes a private infinity plunge pool overlooking sunset horizons, a dedicated temperature-controlled wine cellar, and private elevator access directly into the foyer.",
    listingType: "Buy",
    propertyType: "Apartment",
    price: 385000000, // ₹38.5 Cr
    pricePeriod: null,
    location: "Pali Hill, Bandra West, Mumbai",
    city: "Mumbai",
    locality: "Bandra West",
    bedrooms: 5,
    bathrooms: 6,
    areaSqFt: 6200,
    amenities: [
      "Sea View",
      "Private Infinity Pool",
      "Direct Elevator Access",
      "Home Automation",
      "24/7 Concierge",
      "Italian Marble Flooring",
      "4 Covered Parking Slots",
      "Private Gymnasium",
      "Wine Cellar",
      "VRV Central Air Conditioning"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-1",
    createdAt: "2026-09-28T10:30:00Z",
    isFeatured: true,
    furnishing: "Fully Furnished",
    facing: "West",
    parkingSlots: 4,
    floor: "38th of 40 Floors",
    status: "Ready to Move"
  },
  {
    id: "prop-2",
    title: "Serenade Biophilic Villa with Private Zen Courtyard",
    description: "Nestled in an ultra-exclusive gated sanctuary in Indiranagar, this contemporary biophilic villa blends organic stone, reclaimed teak wood, and natural light. It features an open-concept central courtyard with koi pond, vertical gardens, expansive master suite with outdoor rain shower, and a solar-powered zero-carbon footprint design.",
    listingType: "Buy",
    propertyType: "Villa",
    price: 145000000, // ₹14.5 Cr
    pricePeriod: null,
    location: "Defense Colony, Indiranagar, Bengaluru",
    city: "Bengaluru",
    locality: "Indiranagar",
    bedrooms: 4,
    bathrooms: 5,
    areaSqFt: 4800,
    amenities: [
      "Private Zen Garden",
      "Koi Pond",
      "Solar Power Integration",
      "Smart Irrigation System",
      "Clubhouse Access",
      "Double-Glazed Windows",
      "3 Covered Parking Slots",
      "Private Terrace Lounge",
      "EV Charger Installed"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-2",
    createdAt: "2026-10-02T14:15:00Z",
    isFeatured: true,
    furnishing: "Semi-Furnished",
    facing: "East",
    parkingSlots: 3,
    floor: "G+2 Floors",
    status: "Ready to Move"
  },
  {
    id: "prop-3",
    title: "The Camellias Grand Residence — Golf Vista Suite",
    description: "An iconic luxury residence overlooking the prestigious DLF Golf Course. Boasting panoramic golf fairway views, expansive 11-foot finished ceilings, sound-insulated acoustics, and five-star club amenities including an Olympic swimming pool, private spa, and cigar room. Designed for leaders who demand uncompromising quality.",
    listingType: "Buy",
    propertyType: "Apartment",
    price: 260000000, // ₹26 Cr
    pricePeriod: null,
    location: "Golf Course Road, DLF Phase 5, Gurugram",
    city: "Delhi NCR",
    locality: "Golf Course Road",
    bedrooms: 4,
    bathrooms: 5,
    areaSqFt: 5400,
    amenities: [
      "Golf Course Panoramic Views",
      "Full Clubhouse Membership",
      "Heated Indoor Pool",
      "Concierge & Valet",
      "Multi-tier 24/7 Security",
      "High-speed Private Elevators",
      "Spa & Wellness Center",
      "Helipad Access"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-3",
    createdAt: "2026-10-05T09:00:00Z",
    isFeatured: true,
    furnishing: "Bare Shell with Designer Finishes",
    facing: "North-East",
    parkingSlots: 3,
    floor: "22nd of 34 Floors",
    status: "Ready to Move"
  },
  {
    id: "prop-4",
    title: "Casa da Palmeira — Restored Heritage Manor",
    description: "A meticulously restored 120-year-old Portuguese-Goan estate in Assagao surrounded by swaying coconut palms and fragrant frangipani trees. High vaulted wooden rafters, hand-poured patterned IPS flooring, broad verandas, private turquoise pool with sun deck, and a detached guest cottage.",
    listingType: "Buy",
    propertyType: "Villa",
    price: 185000000, // ₹18.5 Cr
    pricePeriod: null,
    location: "Badem Road, Assagao, North Goa",
    city: "Goa",
    locality: "Assagao",
    bedrooms: 5,
    bathrooms: 5,
    areaSqFt: 5800,
    amenities: [
      "Private Swimming Pool",
      "Restored Heritage Architecture",
      "Landscaped Tropical Garden",
      "Independent Guest Cottage",
      "Outdoor Dining Pavilion",
      "Artesian Well & Water Filtration",
      "Staff Quarters"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-5",
    createdAt: "2026-09-15T11:20:00Z",
    isFeatured: true,
    furnishing: "Fully Furnished with Antiques",
    facing: "East",
    parkingSlots: 4,
    floor: "G+1 Floors",
    status: "Ready to Move"
  },
  {
    id: "prop-5",
    title: "Skyline Glass Duplex — Modern Rental with Panoramic Views",
    description: "An elegant urban lease in Worli's premier high-rise tower. Features uninterrupted vistas of the Bandra-Worli Sea Link, custom German kitchen with Miele appliances, minimalist mood lighting, motorized sheer curtains, and full access to club amenities.",
    listingType: "Rent",
    propertyType: "Apartment",
    price: 450000, // ₹4.5 L/month
    pricePeriod: "/month",
    location: "Dr. Annie Besant Road, Worli, Mumbai",
    city: "Mumbai",
    locality: "Worli",
    bedrooms: 3,
    bathrooms: 4,
    areaSqFt: 2950,
    amenities: [
      "Sea Link Views",
      "Designer Modular Kitchen",
      "Smart Home Automation",
      "Infinity Lap Pool",
      "Squash & Tennis Courts",
      "2 Reserved Parking Slots",
      "24/7 Security & Concierge"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-1",
    createdAt: "2026-10-06T16:00:00Z",
    isFeatured: true,
    furnishing: "Fully Furnished",
    facing: "North-West",
    parkingSlots: 2,
    floor: "29th of 45 Floors",
    status: "Available for Rent"
  },
  {
    id: "prop-6",
    title: "The Magnolia Court — Modern Bungalow in Koregaon Park",
    description: "A rare freehold independent bungalow in leafy Lane 5, Koregaon Park. Surrounded by mature rain trees, this home offers soaring timber ceilings, open plan entertaining spaces, a tranquil private courtyard, and serene privacy in the heart of Pune.",
    listingType: "Buy",
    propertyType: "Independent House",
    price: 98000000, // ₹9.8 Cr
    pricePeriod: null,
    location: "Lane 5, Koregaon Park, Pune",
    city: "Pune",
    locality: "Koregaon Park",
    bedrooms: 4,
    bathrooms: 4,
    areaSqFt: 4100,
    amenities: [
      "Private Front & Rear Lawns",
      "Perimeter Security & CCTV",
      "Outdoor Barbecue Deck",
      "Solar Water Heating",
      "Dedicated Servant Quarters",
      "3 Covered Parking Slots"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-4",
    createdAt: "2026-09-20T08:45:00Z",
    isFeatured: false,
    furnishing: "Semi-Furnished",
    facing: "North",
    parkingSlots: 3,
    floor: "Independent G+1",
    status: "Ready to Move"
  },
  {
    id: "prop-7",
    title: "Jubilee Crown Sky Mansion with Hillside Views",
    description: "An imposing architectural masterpiece overlooking the Jubilee Hills ridges. Features monolithic grey basalt stone facades, double-volume living pavilions, climate-controlled walk-in wardrobes, private lift, and 24-meter terrace pool.",
    listingType: "Buy",
    propertyType: "Villa",
    price: 215000000, // ₹21.5 Cr
    pricePeriod: null,
    location: "Road No. 36, Jubilee Hills, Hyderabad",
    city: "Hyderabad",
    locality: "Jubilee Hills",
    bedrooms: 5,
    bathrooms: 6,
    areaSqFt: 7200,
    amenities: [
      "Hilltop City View",
      "Private Heated Pool",
      "Home Theater with Dolby Atmos",
      "Basement Parking for 5 Cars",
      "Separate Staff Accommodation",
      "Solar Power Backup"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-6",
    createdAt: "2026-10-04T12:00:00Z",
    isFeatured: true,
    furnishing: "Fully Furnished",
    facing: "East",
    parkingSlots: 5,
    floor: "G+3 Levels",
    status: "Ready to Move"
  },
  {
    id: "prop-8",
    title: "Prime Commercial Grade-A Corporate Office Floor",
    description: "An expansive, fully fitted commercial office space situated inside an IGBC Platinum-certified corporate tower in Whitefield's primary technology corridor. Features 120 ergonomic workstations, 4 executive director suites, 3 boardrooms with video conferencing, cafeteria, and 100% DG power backup.",
    listingType: "Rent",
    propertyType: "Commercial",
    price: 750000, // ₹7.5 L/month
    pricePeriod: "/month",
    location: "EPIP Zone, Whitefield, Bengaluru",
    city: "Bengaluru",
    locality: "Whitefield",
    bedrooms: 0,
    bathrooms: 4,
    areaSqFt: 6500,
    amenities: [
      "IGBC Platinum Green Building",
      "100% Dual Power Backup",
      "High-speed Fiber Backbone",
      "Visitor Valet Parking",
      "Central HVAC & Air Scrubbers",
      "Multi-tier Access Control",
      "Cafeteria & Breakout Lounges"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-2",
    createdAt: "2026-09-18T15:00:00Z",
    isFeatured: false,
    furnishing: "Fully Furnished Commercial",
    facing: "North",
    parkingSlots: 8,
    floor: "7th of 18 Floors",
    status: "Available for Lease"
  },
  {
    id: "prop-9",
    title: "Ridgeview Luxury Residential Plot in Gated Township",
    description: "A pristine corner plot with clear freehold title and approved building sanctions situated in North Goa's most scenic gated villa enclave. Complete with wide tarred access avenues, underground electrical cabling, piped water, and lush hillside valley views.",
    listingType: "Buy",
    propertyType: "Plot",
    price: 32000000, // ₹3.2 Cr
    pricePeriod: null,
    location: "Siolim Hillside, North Goa",
    city: "Goa",
    locality: "Siolim",
    bedrooms: 0,
    bathrooms: 0,
    areaSqFt: 8400,
    amenities: [
      "Clear Title & Sanctioned FAR",
      "Underground Power & Fiber Cabling",
      "24/7 Gated Community Security",
      "Hillside Valley Panoramic Views",
      "Paved Internal Roads",
      "Clubhouse Access"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-5",
    createdAt: "2026-09-29T11:00:00Z",
    isFeatured: false,
    furnishing: "Unfurnished Plot",
    facing: "East",
    parkingSlots: 0,
    floor: "Ground Plot",
    status: "Ready for Construction"
  },
  {
    id: "prop-10",
    title: "Vasant Vihar Embassy Enclave Townhouse",
    description: "An ultra-refined 4-bedroom diplomatic townhouse in South Delhi's most elite neighborhood. Private driveway, landscaped terrace with pergola, Italian marble fireplaces, imported Poggenpohl kitchen, and round-the-clock armed neighborhood patrol.",
    listingType: "Rent",
    propertyType: "Independent House",
    price: 380000, // ₹3.8 L/month
    pricePeriod: "/month",
    location: "Block C, Vasant Vihar, South Delhi",
    city: "Delhi NCR",
    locality: "Vasant Vihar",
    bedrooms: 4,
    bathrooms: 5,
    areaSqFt: 3800,
    amenities: [
      "Diplomatic Zone Security",
      "Private Roof Garden & Gazebo",
      "Imported Designer Kitchen",
      "Staff Quarters & Driver Restroom",
      "Full Power Backup",
      "Private Driveway"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-3",
    createdAt: "2026-10-01T10:00:00Z",
    isFeatured: false,
    furnishing: "Semi-Furnished",
    facing: "South-East",
    parkingSlots: 2,
    floor: "G+2 Floors",
    status: "Available for Rent"
  },
  {
    id: "prop-11",
    title: "The Glass Pavilion — Lakefront Luxury Villa",
    description: "An extraordinary modern architectural triumph directly overlooking the calm waters of Sarjapur lake. Cantilevered glass viewing decks, bespoke teakwood louvers, negative-edge pool, private tennis court, and serene botanical gardens.",
    listingType: "Buy",
    propertyType: "Villa",
    price: 118000000, // ₹11.8 Cr
    pricePeriod: null,
    location: "Sarjapur-Outer Ring Road, Bengaluru",
    city: "Bengaluru",
    locality: "Sarjapur",
    bedrooms: 4,
    bathrooms: 5,
    areaSqFt: 5100,
    amenities: [
      "Lakefront Waterfront Location",
      "Negative Edge Swimming Pool",
      "Tennis & Pickleball Court",
      "Organic Kitchen Garden",
      "Bespoke Italian Kitchen",
      "Smart Energy & Solar Grid",
      "3 Covered Parking Slots"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-2",
    createdAt: "2026-10-07T08:00:00Z",
    isFeatured: true,
    furnishing: "Fully Furnished",
    facing: "East",
    parkingSlots: 3,
    floor: "G+2 Floors",
    status: "Ready to Move"
  },
  {
    id: "prop-12",
    title: "Kalyani Nagar Sunlit Garden Penthouse",
    description: "Spacious dual-level penthouse with sprawling wrap-around botanical terrace, floor-to-ceiling glass dining conservatory, and state-of-the-art chef's kitchen. Located in a boutique gated enclave walking distance from Jogger's Park.",
    listingType: "Rent",
    propertyType: "Apartment",
    price: 220000, // ₹2.2 L/month
    pricePeriod: "/month",
    location: "Central Avenue, Kalyani Nagar, Pune",
    city: "Pune",
    locality: "Kalyani Nagar",
    bedrooms: 3,
    bathrooms: 4,
    areaSqFt: 3100,
    amenities: [
      "Wrap-around Terrace Garden",
      "Glass Conservatory Dining Area",
      "Jacuzzi on Private Terrace",
      "Clubhouse & Gym",
      "2 Covered Parking Spaces",
      "24/7 Power Backup"
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80"
    ],
    agentId: "agent-4",
    createdAt: "2026-09-25T14:30:00Z",
    isFeatured: false,
    furnishing: "Fully Furnished",
    facing: "North-West",
    parkingSlots: 2,
    floor: "11th of 12 Floors",
    status: "Available for Rent"
  }
];

export const PROPERTY_TYPES = [
  { id: "Apartment", name: "Apartment", description: "Penthouses, high-rise luxury flats, and duplexes", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80" },
  { id: "Villa", name: "Villa", description: "Standalone luxury villas with private gardens & pools", image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80" },
  { id: "Independent House", name: "Independent House", description: "Bespoke townhouses, bungalows, and family homes", image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80" },
  { id: "Plot", name: "Plot or Land", description: "Freehold residential plots and estate parcels", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80" },
  { id: "Commercial", name: "Commercial Property", description: "Grade-A office suites, retail spaces, and studios", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80" },
];

export const POPULAR_LOCATIONS = [
  {
    city: "Mumbai",
    state: "Maharashtra",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
    tagline: "The Coastal Financial Capital",
    popularLocalities: ["Bandra West", "Worli", "Juhu", "Pali Hill"],
  },
  {
    city: "Bengaluru",
    state: "Karnataka",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80",
    tagline: "India's Tech & Garden Metropolis",
    popularLocalities: ["Indiranagar", "Whitefield", "Sarjapur", "Koramangala"],
  },
  {
    city: "Delhi NCR",
    state: "National Capital Region",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80",
    tagline: "Grand Avenues & Corporate Enclaves",
    popularLocalities: ["Golf Course Road", "Vasant Vihar", "DLF Phase 5"],
  },
  {
    city: "Goa",
    state: "Goa",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80",
    tagline: "Serene Tropical Escapes & Heritage Living",
    popularLocalities: ["Assagao", "Siolim", "Anjuna", "Candolim"],
  },
  {
    city: "Pune",
    state: "Maharashtra",
    image: "./image/pune.jpg",
    tagline: "Cultural Sophistication & Green Enclaves",
    popularLocalities: ["Koregaon Park", "Kalyani Nagar", "Baner"],
  },
  {
    city: "Hyderabad",
    state: "Telangana",
    image: "./image/hyderabad.jpg",
    tagline: "Royal Heritage Meets Modern Skyline",
    popularLocalities: ["Jubilee Hills", "Banjara Hills", "HITEC City"],
  }
];
