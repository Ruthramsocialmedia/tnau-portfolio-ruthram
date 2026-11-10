// campus-layouts.js - Stores GeoJSON polygons for internal campus mapping

// We use Anna University as a robust example for internal campus layers
const CAMPUS_LAYOUTS = {
    // We use the ID or exact name to match
    "Anna University": {
        center: [13.010236, 80.235469],
        zoom: 16,
        layers: {
            academicBlocks: [
                {
                    name: "Main Engineering Block",
                    type: "academic",
                    polygon: [[13.0112, 80.2351], [13.0118, 80.2351], [13.0118, 80.2360], [13.0112, 80.2360]]
                },
                {
                    name: "Computer Science Dept",
                    type: "academic",
                    polygon: [[13.0105, 80.2365], [13.0109, 80.2365], [13.0109, 80.2372], [13.0105, 80.2372]]
                }
            ],
            hostels: [
                {
                    name: "CEG Boys Hostel",
                    type: "hostel",
                    polygon: [[13.0125, 80.2340], [13.0130, 80.2340], [13.0130, 80.2348], [13.0125, 80.2348]]
                },
                {
                    name: "CEG Girls Hostel",
                    type: "hostel",
                    polygon: [[13.0085, 80.2335], [13.0090, 80.2335], [13.0090, 80.2342], [13.0085, 80.2342]]
                }
            ],
            admin: [
                {
                    name: "Vice Chancellor Office",
                    type: "admin",
                    polygon: [[13.0100, 80.2345], [13.0104, 80.2345], [13.0104, 80.2350], [13.0100, 80.2350]]
                }
            ],
            labs: [
                {
                    name: "Mechanical Workshops",
                    type: "lab",
                    polygon: [[13.0095, 80.2360], [13.0100, 80.2360], [13.0100, 80.2365], [13.0095, 80.2365]]
                }
            ],
            library: [
                {
                    name: "Central Library",
                    type: "library",
                    polygon: [[13.0105, 80.2352], [13.0108, 80.2352], [13.0108, 80.2358], [13.0105, 80.2358]]
                }
            ],
            sports: [
                {
                    name: "Main Sports Ground",
                    type: "sports",
                    polygon: [[13.0135, 80.2355], [13.0145, 80.2355], [13.0145, 80.2375], [13.0135, 80.2375]]
                }
            ],
            canteen: [
                {
                    name: "Student Cafeteria",
                    type: "canteen",
                    polygon: [[13.0092, 80.2355], [13.0095, 80.2355], [13.0095, 80.2358], [13.0092, 80.2358]]
                }
            ],
            safety: [
                {
                    name: "Main Security Gate",
                    type: "safety",
                    point: [13.0110, 80.2330] // Coordinate point instead of polygon
                },
                {
                    name: "Emergency Assembly Area",
                    type: "safety",
                    point: [13.0105, 80.2348]
                }
            ],
            accessibility: [
                {
                    name: "Wheelchair Accessible Route",
                    type: "route",
                    path: [[13.0110, 80.2330], [13.0105, 80.2348], [13.0105, 80.2352]] // Polyline
                }
            ],
            transport: [
                {
                    name: "Campus Bus Stop",
                    type: "transport",
                    point: [13.0115, 80.2350]
                }
            ],
            greenSpaces: [
                {
                    name: "Botanical Garden",
                    type: "greenSpace",
                    polygon: [[13.0120, 80.2360], [13.0125, 80.2360], [13.0125, 80.2365], [13.0120, 80.2365]]
                }
            ]
        }
    },

    "Agricultural College & Research Institute, Coimbatore": {
        center: [11.0123, 76.9356],
        zoom: 16,
        layers: {
            academicBlocks: [
                {
                    name: "Heritage Agriculture College Block (Est. 1906)",
                    type: "academic",
                    polygon: [[11.0125, 76.9350], [11.0135, 76.9350], [11.0135, 76.9365], [11.0125, 76.9365]]
                },
                {
                    name: "Agricultural Engineering College (AEC&RI)",
                    type: "academic",
                    polygon: [[11.0110, 76.9340], [11.0118, 76.9340], [11.0118, 76.9352], [11.0110, 76.9352]]
                },
                {
                    name: "Centre for Plant Molecular Biology (CPMB)",
                    type: "academic",
                    polygon: [[11.0140, 76.9360], [11.0148, 76.9360], [11.0148, 76.9372], [11.0140, 76.9372]]
                }
            ],
            hostels: [
                {
                    name: "Amaravathi & Bhavani Boys Hostel",
                    type: "hostel",
                    polygon: [[11.0150, 76.9335], [11.0160, 76.9335], [11.0160, 76.9348], [11.0150, 76.9348]]
                },
                {
                    name: "Cauvery & Vaigai Girls Hostel",
                    type: "hostel",
                    polygon: [[11.0095, 76.9330], [11.0105, 76.9330], [11.0105, 76.9342], [11.0095, 76.9342]]
                }
            ],
            admin: [
                {
                    name: "TNAU Vice-Chancellor Secretariat & Admin Tower",
                    type: "admin",
                    polygon: [[11.0120, 76.9368], [11.0128, 76.9368], [11.0128, 76.9378], [11.0120, 76.9378]]
                }
            ],
            labs: [
                {
                    name: "National Insect Museum & Taxonomy Center",
                    type: "lab",
                    polygon: [[11.0130, 76.9375], [11.0136, 76.9375], [11.0136, 76.9385], [11.0130, 76.9385]]
                },
                {
                    name: "Paddy Breeding Station & Genomic Facilities",
                    type: "lab",
                    polygon: [[11.0105, 76.9360], [11.0115, 76.9360], [11.0115, 76.9375], [11.0105, 76.9375]]
                }
            ],
            library: [
                {
                    name: "Centennial Agricultural Library & E-Resource Hub",
                    type: "library",
                    polygon: [[11.0126, 76.9342], [11.0132, 76.9342], [11.0132, 76.9349], [11.0126, 76.9349]]
                }
            ],
            sports: [
                {
                    name: "University Athletic Stadium & Sports Pavilion",
                    type: "sports",
                    polygon: [[11.0162, 76.9355], [11.0175, 76.9355], [11.0175, 76.9375], [11.0162, 76.9375]]
                }
            ],
            canteen: [
                {
                    name: "TNAU Farmers & Students Cafeteria",
                    type: "canteen",
                    polygon: [[11.0118, 76.9355], [11.0123, 76.9355], [11.0123, 76.9362], [11.0118, 76.9362]]
                }
            ],
            safety: [
                {
                    name: "Marudhamalai Road Main Entrance & Security Gate",
                    type: "safety",
                    point: [11.0120, 76.9388]
                },
                {
                    name: "TNAU Hospital & Health Centre",
                    type: "safety",
                    point: [11.0112, 76.9370]
                }
            ],
            accessibility: [
                {
                    name: "Heritage Accessible Walkway (Admin to Central Library)",
                    type: "route",
                    path: [[11.0120, 76.9388], [11.0124, 76.9368], [11.0128, 76.9348]]
                }
            ],
            transport: [
                {
                    name: "TNAU Main Campus Bus Terminal",
                    type: "transport",
                    point: [11.0118, 76.9385]
                }
            ],
            greenSpaces: [
                {
                    name: "TNAU Botanical Garden & Arboretum (300+ Rare Species)",
                    type: "greenSpace",
                    polygon: [[11.0138, 76.9320], [11.0155, 76.9320], [11.0155, 76.9338], [11.0138, 76.9338]]
                },
                {
                    name: "Instructional Crop Fields & Wetland Rice Farm",
                    type: "greenSpace",
                    polygon: [[11.0080, 76.9345], [11.0100, 76.9345], [11.0100, 76.9375], [11.0080, 76.9375]]
                }
            ]
        }
    }
};

CAMPUS_LAYOUTS["Tamil Nadu Agricultural University, Coimbatore"] = CAMPUS_LAYOUTS["Agricultural College & Research Institute, Coimbatore"];
