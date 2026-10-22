import { isService, type Product } from "@/data/products";

export interface Review {
  name: string;
  avatar: string;
  rating: number;
  date: string;
  title: string;
  text: string;
  verified: boolean;
}

const people = [
  ["Grace Holloway", "/images/dashboard/avatar-02.png"],
  ["Daniel Osei", "/images/dashboard/avatar-07.png"],
  ["Priya Raman", "/images/dashboard/avatar-08.png"],
  ["Tom Becker", "/images/dashboard/avatar-03.png"],
  ["Lucia Fernandes", "/images/dashboard/avatar-01.png"],
  ["Marcus Lee", "/images/dashboard/avatar-04.png"],
] as const;

const goodsReviews = [
  ["Does exactly what it says", "Arrived the same day and was easy to set up. The instructions are short and clear."],
  ["Great value", "Cheaper than the pharmacy down the road, and my insurance paid part of it at checkout."],
  ["My doctor recommended it", "My specialist suggested this one at my last visit. Very happy with the quality."],
  ["Solid, well made", "Feels sturdy and looks good. Customer support answered my question in minutes."],
  ["Good, small wish", "Works well. I would like a carry case in the box, but it is a small thing."],
] as const;

const serviceReviews = [
  ["Fast and friendly", "The nurse arrived on time and was very gentle. Results were in my portal the next morning."],
  ["So easy to book", "Picked a slot, paid my share after insurance, done. No waiting room."],
  ["Clear explanations", "The doctor explained every result in plain words and answered all my questions."],
  ["Worth it", "Much simpler than going to the hospital. I will book the yearly check-up here."],
  ["Good, one delay", "The visit started ten minutes late, but the care itself was excellent."],
] as const;

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Five made-up reviews, stable per product. */
export function reviewsFor(p: Product): Review[] {
  const pool = isService(p) ? serviceReviews : goodsReviews;
  const h = hash(p.id);
  return Array.from({ length: 4 }).map((_, i) => {
    const [title, text] = pool[(h + i) % pool.length];
    const [name, avatar] = people[(h + i * 2) % people.length];
    const rating = i === 3 && p.rating < 4.8 ? 4 : 5;
    return { name, avatar, rating, title, text, verified: i !== 2, date: `${(h % 20) + i * 9 + 3} days ago` };
  });
}

/** Share of reviews per star (5 → 1), shaped by the average rating. */
export function ratingBreakdown(rating: number) {
  const five = Math.round(Math.max(40, Math.min(90, (rating - 3.9) * 85)));
  const four = Math.round((100 - five) * 0.65);
  const three = Math.round((100 - five - four) * 0.6);
  const two = Math.round((100 - five - four - three) * 0.6);
  return [five, four, three, two, Math.max(0, 100 - five - four - three - two)];
}

export function faqsFor(p: Product): [q: string, a: string][] {
  const list: [string, string][] = [];
  if (p.category === "lab-tests" || p.category === "health-packages") {
    list.push(["How does home collection work?", "Pick a time slot at checkout. A trained nurse comes to your home, takes the sample and brings it to our lab."]);
    list.push(["When do I get my results?", "Results appear in your patient portal, usually within 24 hours. A doctor reviews every report."]);
  } else if (p.category === "consultations") {
    list.push(["How do I join the video visit?", "You get a link in your patient portal and by email. Join from your phone or computer, no app needed."]);
    list.push(["Can I get a prescription?", "Yes. If the doctor prescribes a medicine, it is sent straight to our pharmacy."]);
  } else {
    list.push(["How fast is delivery?", `${p.delivery}. Delivery is free on orders over $50, otherwise $4.99.`]);
    list.push(["Can I return it?", "Unopened items can be returned within 30 days. Medicines cannot be returned for safety reasons."]);
  }
  if (p.rx) list.push(["Why do I need a prescription?", "This medicine needs a doctor's prescription by law. Upload a photo at checkout, or choose \"my doctor already sent it\" if your hospital doctor prescribed it."]);
  if (p.rent) list.push(["How does renting work?", `You pay $${p.rent.weekly} a week plus a $${p.rent.deposit} deposit. We deliver and set it up, and the deposit comes back when we collect it.`]);
  list.push([
    "Will my insurance pay?",
    p.coverage > 0
      ? `Most plans pay part of this item, up to about ${p.coverage}%. Add your card at checkout to see your exact share.`
      : "Most plans do not cover this item, but you can use a health savings card.",
  ]);
  return list;
}
