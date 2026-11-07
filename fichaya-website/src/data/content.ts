// Homepage copy and asset references, taken from the "Homepage" frame of the Fichaya Website Figma file.

export const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;

/** Responsive WebP set: each photo is exported at 800, 1400 and 2752px wide (`<name>-<width>.webp`). */
export const photo = (name: string) => ({
  src: asset(`${name}-1400.webp`),
  srcSet: [800, 1400, 2752].map((w) => `${asset(`${name}-${w}.webp`)} ${w}w`).join(', '),
});

export const navLinks = [
  { label: 'About Us', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact Us', href: '#contact' },
];

// Nav "Services" dropdown (Figma: Services dropdown).
export const serviceMenu = [
  { title: 'Property Operations', text: 'Keep your property clean, safe, and guest-ready.' },
  { title: 'Cleaning & Janitorial', text: 'Professional cleaning that keeps your spaces spotless.' },
  { title: 'Upholstery cleaning', text: 'Deep-clean your furniture and refresh your interiors.' },
  { title: 'Housekeeping', text: 'Reliable housekeeping for a consistently comfortable space.' },
  { title: 'AC Servicing', text: 'Keep your cooling systems efficient and running smoothly.' },
  { title: 'Deep Cleaning', text: 'Thorough cleaning for a healthier, fresher environment.' },
  { title: 'Fumigation', text: 'Protect your property from pests with effective treatment.' },
  { title: 'Workforce Recruitment', text: 'Find reliable, skilled staff for your property needs.' },
];

export const clientLogos = [
  { name: 'Flutterwave', src: asset('logo-flutterwave.png'), width: 150, height: 24 },
  { name: 'Moniepoint', src: asset('logo-moniepoint.png'), width: 150, height: 36 },
  { name: 'Piggyvest', src: asset('logo-piggyvest.png'), width: 150, height: 106 },
];

// Services showcase (Figma: "3 items bento grid" → Background component).
// The Figma file only has two background photos for this component; the rest alternate between them.
export const services = [
  {
    title: 'General Property Operations',
    text: 'Comprehensive day-to-day property support, covering essential operational, maintenance, and facility management needs.',
    image: 'services-bg-alt',
  },
  {
    title: 'Janitorial Management',
    text: 'Keep your property consistently clean, hygienic, and guest-ready with professionally managed janitorial services.',
    image: 'services-bg',
  },
  {
    title: 'Housekeeping Services',
    text: 'Reliable housekeeping for a consistently comfortable space.',
    image: 'services-bg-alt',
  },
  {
    title: 'AC Servicing & Maintenance',
    text: 'Keep your cooling systems efficient and running smoothly.',
    image: 'services-bg',
  },
  {
    // Copy not in the Figma file yet — placeholder.
    title: 'Generator & Power Management',
    text: 'Scheduled generator servicing and power monitoring so your building stays up when the grid goes down.',
    image: 'services-bg-alt',
  },
  {
    // Copy not in the Figma file yet — placeholder.
    title: 'Diesel Supply',
    text: 'Planned diesel deliveries and stock tracking, so your generators never run dry.',
    image: 'services-bg',
  },
  {
    title: 'Deep Cleaning',
    text: 'Thorough cleaning for a healthier, fresher environment.',
    image: 'services-bg-alt',
  },
  {
    title: 'Fumigation',
    text: 'Protect your property from pests with effective treatment.',
    image: 'services-bg',
  },
  {
    title: 'Workforce Recruitment',
    text: 'Find reliable, skilled staff for your property needs.',
    image: 'services-bg-alt',
  },
  {
    // Copy not in the Figma file yet — placeholder.
    title: 'Facility Consumables Supply',
    text: 'Restocking of cleaning supplies, toiletries, and everyday consumables, managed for you.',
    image: 'services-bg',
  },
];

export const outcomes = [
  { title: 'Fewer operational headaches', text: 'One team handles maintenance, staffing, cleaning, and power.' },
  {
    title: 'Facilities that stay ahead of problems',
    text: 'Scheduled maintenance and monitoring catch issues before they become downtime.',
  },
  { title: 'Staffing you can trust', text: "Vetted personnel, managed shifts, and backup coverage when someone's out." },
  {
    title: 'A cleaner, safer building, consistently',
    text: 'Standards set once and held to — not dependent on who shows up that day.',
  },
  { title: 'Complete on-site visibility', text: 'Reports on completed, pending tasks, and decisions needed.' },
  { title: 'One contact, not a list', text: 'For any issue, call one number — not multiple vendors.' },
];

// Positions/rotations of the photo stack above "Reliable Outcomes", relative to a 1440px-wide stage
// (each 229.5×222.8 photo is centred in its rotated Figma bounding box).
export const outcomePhotos = [
  { left: 272.97, top: 48.09, rotate: 8.97 },
  { left: 437.28, top: 129.45, rotate: -11.25 },
  { left: 634.9, top: 49.79, rotate: 0.81 },
  { left: 775.57, top: 141.17, rotate: -11 },
  { left: 935.16, top: 68.4, rotate: 10 },
];

export const metrics = [
  { value: '12 yrs', label: 'Operating across Lagos properties' },
  { value: '48 hrs', label: 'From site walk to costed plan' },
  { value: '100%', label: 'Vetted, payroll-managed crews' },
];

export const partners = [
  { name: 'Lagos State Employment Trust Fund', src: asset('partner-lsetf.png'), width: 150, height: 47 },
  { name: 'Strategic partner', src: asset('partner-2.png'), width: 64, height: 64 },
];

export const testimonials = [
  {
    quote:
      'Fichaya has successfully maintained a consistent track record of reliability, good customer service and professionalism',
    name: 'Renee',
    role: 'HR, Moniepoint',
    logo: asset('testimonial-logo.svg'),
  },
];

export const footerColumns = [
  {
    title: 'Quick Links',
    links: [
      { label: 'Home', href: '#top' },
      { label: 'About Us', href: '#about' },
      { label: 'Contacts', href: '#contact' },
      { label: 'FAQs', href: '#faqs' },
      { label: 'Blog', href: '#blog' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Book a Service', href: '#book' },
      { label: 'Customer Policy', href: '#policy' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Contact Info',
    links: [
      { label: 'Lekki Phase 1, Lekki, Lagos 101245, NG' },
      { label: '+234 (0) 817 360 2446', href: 'tel:+2348173602446' },
    ],
  },
];

export const socials = [
  { name: 'X', src: asset('social-1.svg'), href: '#' },
  { name: 'Facebook', src: asset('social-2.svg'), href: '#' },
  { name: 'Instagram', src: asset('social-3.svg'), href: '#' },
  { name: 'LinkedIn', src: asset('social-4.svg'), href: '#' },
];
