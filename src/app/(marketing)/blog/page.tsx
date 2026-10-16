import type { Metadata } from "next";
import { blogPosts } from "@/data/content";
import { Reveal } from "@/components/ui/reveal";
import { BlogCard } from "@/components/marketing/blog-card";
import { Breadcrumbs } from "@/components/marketing/page-hero";

export const metadata: Metadata = {
  title: "Health blog",
  description: "Practical health advice from Aurelia Hospital specialists.",
};

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;
  return (
    <section className="container-page py-10">
      <Breadcrumbs items={[{ label: "Blog" }]} />
      <h1 className="mt-6 text-4xl font-extrabold sm:text-5xl">Health blog</h1>
      <p className="mt-3 max-w-xl text-lg text-muted-foreground">Practical, trustworthy advice from the doctors, nurses and dietitians who treat patients every day.</p>

      <div className="mt-12">
        <BlogCard post={featured} featured />
      </div>

      <ul className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i * 0.05}>
            <BlogCard post={p} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
