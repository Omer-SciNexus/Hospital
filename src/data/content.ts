export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readMinutes: number;
  body: { heading?: string; text: string }[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "small-habits-big-heart",
    title: "Small habits, big heart: 7 changes your heart will thank you for",
    excerpt: "You don't need a gym membership to protect your heart. Start with these everyday changes.",
    image: "/images/blog/heart-health.png",
    category: "Heart health",
    author: "layla-haddad",
    date: "2026-10-21",
    readMinutes: 6,
    body: [
      { text: "Heart disease is still the leading cause of death worldwide, but most of the risk comes from things we can change. The good news is that small, steady habits make a real difference." },
      { heading: "Move a little, often", text: "Aim for 150 minutes of brisk walking a week. Three 10-minute walks count just as much as one long one." },
      { heading: "Know your numbers", text: "Blood pressure, cholesterol and blood sugar often have no symptoms. A yearly check is the simplest way to catch problems early." },
      { heading: "Sleep and stress", text: "Short sleep and constant stress raise blood pressure. A regular bedtime and a few minutes of slow breathing each day help more than you might think." },
      { text: "If you have chest pain, shortness of breath or sudden weakness, don't wait. Call emergency services straight away." },
    ],
  },
  {
    slug: "build-a-better-plate",
    title: "Build a better plate without counting calories",
    excerpt: "Our dietitians share the simple plate method they use with patients every day.",
    image: "/images/blog/nutrition.png",
    category: "Nutrition",
    author: "maria-santos",
    date: "2026-10-14",
    readMinutes: 5,
    body: [
      { text: "The plate method is a simple way to eat well without apps or scales. Fill half your plate with vegetables, a quarter with protein and a quarter with whole grains." },
      { heading: "Color is a cheat code", text: "Different colors mean different nutrients. Try to eat three colors at every meal." },
      { heading: "Drinks matter", text: "Sugary drinks are the biggest source of added sugar for most adults. Water, sparkling water and unsweetened tea are your friends." },
    ],
  },
  {
    slug: "five-minute-reset",
    title: "The five-minute reset for anxious days",
    excerpt: "A short, practical routine for when your mind won't slow down.",
    image: "/images/blog/mental-health.png",
    category: "Mental health",
    author: "ananya-rao",
    date: "2026-10-02",
    readMinutes: 4,
    body: [
      { text: "Anxiety is a normal response to stress, but when it sticks around it can wear you down. This simple reset can help in the moment." },
      { heading: "Breathe in fours", text: "Breathe in for four counts, hold for four, out for four, hold for four. Repeat four times." },
      { heading: "Name five things", text: "Look around and name five things you can see. It brings your attention back to the present." },
      { text: "If anxiety is affecting your daily life, talk to us. Help works, and you don't have to wait until it gets worse." },
    ],
  },
  {
    slug: "sleep-is-medicine",
    title: "Sleep is medicine: how to get more of the good kind",
    excerpt: "Why deep sleep matters and what actually helps you get it.",
    image: "/images/blog/sleep.png",
    category: "Wellbeing",
    author: "sofia-rossi",
    date: "2026-09-25",
    readMinutes: 5,
    body: [
      { text: "Adults need 7 to 9 hours of sleep. During deep sleep the body repairs itself and the brain clears waste." },
      { heading: "Keep it regular", text: "Going to bed and waking at the same time, even on weekends, is the single most effective habit for better sleep." },
      { heading: "Snoring is not always harmless", text: "Loud snoring with pauses in breathing can be sleep apnea. A sleep study can tell you for sure." },
    ],
  },
  {
    slug: "vaccines-without-tears",
    title: "Vaccines without tears: a parent's guide",
    excerpt: "How to prepare your child for vaccines, and what to expect afterwards.",
    image: "/images/blog/child-vaccine.png",
    category: "Children",
    author: "mei-lin-chen",
    date: "2026-09-12",
    readMinutes: 4,
    body: [
      { text: "Vaccines are one of the safest ways to protect children from serious illness. A little preparation makes the visit easier for everyone." },
      { heading: "Be honest and calm", text: "Tell your child it will pinch for a moment. Children take their cues from you." },
      { heading: "Afterwards", text: "Mild fever or a sore arm for a day or two is normal. Call us if your child seems very unwell." },
    ],
  },
  {
    slug: "living-well-with-diabetes",
    title: "Living well with type 2 diabetes",
    excerpt: "New tools make managing blood sugar easier than ever. Here's where to start.",
    image: "/images/blog/diabetes.png",
    category: "Diabetes",
    author: "ethan-brooks",
    date: "2026-08-30",
    readMinutes: 6,
    body: [
      { text: "Type 2 diabetes can often be managed with food, movement and the right medicines. Continuous glucose monitors now show you how your body responds in real time." },
      { heading: "Check your feet and eyes", text: "Diabetes can affect nerves and eyes quietly. A yearly foot and eye check catches problems early." },
      { heading: "You're not alone", text: "Our diabetes educators and the Community space are there for questions between visits." },
    ],
  },
];

export const testimonials = [
  { name: "Rachel M.", role: "Cardiology patient", avatar: "/images/dashboard/avatar-02.png", quote: "I booked online on Sunday, saw Dr. Haddad on Tuesday and had my echo the same day. I've never had care move this smoothly." },
  { name: "Jonas K.", role: "Knee surgery", avatar: "/images/dashboard/avatar-07.png", quote: "From the first scan to physio, everything was explained. I was walking without crutches in three weeks." },
  { name: "Amina S.", role: "New mother", avatar: "/images/dashboard/avatar-08.png", quote: "The midwives and the NICU team were incredible. We stayed in a family room right next to our son." },
  { name: "Luis P.", role: "Marketplace customer", avatar: "/images/dashboard/avatar-01.png", quote: "Uploaded my prescription at lunch and the medicines were at my door by dinner. Insurance was applied automatically." },
];

export const homeFaqs = [
  { q: "Do I need a referral to see a specialist?", a: "No. You can book most specialists directly online. Some insurance plans ask for a referral, and we'll tell you at booking if yours does." },
  { q: "Which insurance do you accept?", a: "We work with most major plans. See the accepted insurance page, or add your card in the patient portal and we'll check your coverage for you." },
  { q: "Can I see a doctor online?", a: "Yes. Many of our doctors offer video visits. Look for the video badge on a doctor's profile or choose 'Video visit' when booking." },
  { q: "How do I get my test results?", a: "Results appear in your patient portal as soon as they're ready, usually within 24 hours. Your doctor will add notes and contact you if anything needs follow-up." },
  { q: "What should I bring to my first visit?", a: "Your ID, insurance card, a list of the medicines you take and any recent test results or scans." },
];
