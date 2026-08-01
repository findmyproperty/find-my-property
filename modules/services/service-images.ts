/**
 * Shared hero / card images for public services.
 * Keep paths in sync with `public/images/services/`.
 */
export const SERVICE_IMAGES = {
  packersMovers: {
    src: "/images/services/packers-movers.jpg",
    alt: "Moving truck parked for a residential home shift",
  },
  paintingCleaning: {
    src: "/images/services/painting-cleaning.jpg",
    alt: "Fresh paint roller on a newly painted wall",
  },
  homeServices: {
    src: "/images/services/home-services.jpg",
    alt: "Home maintenance and cleaning in a modern space",
  },
  eventManagement: {
    src: "/images/services/event-management.jpg",
    alt: "Elegant event table setup with soft lighting",
  },
  itServices: {
    src: "/images/services/it-services.jpg",
    alt: "Circuit board and technology hardware close-up",
  },
  generalServices: {
    src: "/images/services/general-services.jpg",
    alt: "Tools laid out for general handyman work",
  },
  loans: {
    src: "/images/services/loans.jpg",
    alt: "Financial documents and calculator for loan planning",
  },
  jobConsultancy: {
    src: "/images/services/job-consultancy.jpg",
    alt: "Professionals collaborating in a modern office",
  },
} as const;

export type ServiceImageKey = keyof typeof SERVICE_IMAGES;
