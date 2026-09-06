/**
 * Shared hero / card images for public services.
 * Keep paths in sync with `public/images/services/`.
 */
export const SERVICE_IMAGES = {
  packersMovers: {
    src: "/images/services/packers-movers.png",
    alt: "Moving truck parked for a residential home shift",
  },
  paintingCleaning: {
    src: "/images/services/painting-cleaning.png",
    alt: "Fresh paint roller on a newly painted wall",
  },
  homeServices: {
    src: "/images/services/home-services.png",
    alt: "Home maintenance and cleaning in a modern space",
  },
  eventManagement: {
    src: "/images/services/event-management.png",
    alt: "Elegant event table setup with soft lighting",
  },
  itServices: {
    src: "/images/services/it-services.png",
    alt: "Circuit board and technology hardware close-up",
  },
  generalServices: {
    src: "/images/services/general-services.png",
    alt: "Tools laid out for general handyman work",
  },
  loans: {
    src: "/images/services/loans.png",
    alt: "Financial documents and calculator for loan planning",
  },
  jobConsultancy: {
    src: "/images/services/job-consultancy.png",
    alt: "Professionals collaborating in a modern office",
  },
} as const;

export type ServiceImageKey = keyof typeof SERVICE_IMAGES;
