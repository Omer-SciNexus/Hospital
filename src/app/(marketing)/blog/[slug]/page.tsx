import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Info } from "lucide-react";
import { blogPosts } from "@/data/content";
import { doctorsById } from "@/data/doctors";
import { departmentsBySlug } from "@/config/departments";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BlogCard } from "@/components/marketing/blog-card";
import { Breadcrumbs } from "@/components/marketing/page-hero";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();
  const author = doctorsById[post.author];
  const dept = author ? departmentsBySlug[author.department] : undefined;
  const more = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <article className="container-page max-w-4xl py-10">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.category }]} />
        <p className="mt-8 text-sm font-bold uppercase tracking-wider text-primary">{post.category}</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">{post.title}</h1>
        <p className="mt-4 text-xl text-muted-foreground">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          {author && (
            <Link href={`/doctors/${author.id}`} className="flex items-center gap-3 hover:underline">
              <Avatar name={author.name} src={author.photo} color={dept?.accent} size={40} />
              <span>
                <span className="block font-semibold">{author.name}</span>
                <span className="block text-muted-foreground">{author.title}</span>
              </span>
            </Link>
          )}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden /> {formatDate(post.date)} · {post.readMinutes} min read
          </span>
        </div>

        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl">
          <Image src={post.image} alt="" fill priority sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" />
        </div>

        <div className="mx-auto mt-12 max-w-2xl space-y-6 text-lg leading-relaxed">
          {post.body.map((b, i) => (
            <div key={i}>
              {b.heading && <h2 className="mb-3 mt-10 text-2xl font-extrabold">{b.heading}</h2>}
              <p className={i === 0 ? "text-xl text-foreground" : "text-muted-foreground"}>{b.text}</p>
            </div>
          ))}
          <p className="flex gap-3 rounded-2xl bg-brand-50 p-5 text-sm text-brand-900 dark:bg-brand-950 dark:text-brand-100">
            <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
            This article is general information, not medical advice. Talk to your doctor about your own health.
          </p>
          {author && dept && (
            <div className="flex flex-col items-start gap-4 rounded-3xl border border-border bg-surface p-6 shadow-soft sm:flex-row sm:items-center">
              <Avatar name={author.name} src={author.photo} color={dept.accent} size={64} />
              <div className="flex-1 text-base">
                <p className="font-bold">Have questions about this?</p>
                <p className="text-sm text-muted-foreground">Book a visit with {author.name} or the {dept.name} team.</p>
              </div>
              <Button asChild>
                <Link href={`/doctors/${author.id}#book`}>Book a visit</Link>
              </Button>
            </div>
          )}
        </div>
      </article>

      <section className="container-page border-t border-border py-16">
        <h2 className="text-2xl font-extrabold">Keep reading</h2>
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {more.map((p) => (
            <li key={p.slug}><BlogCard post={p} /></li>
          ))}
        </ul>
      </section>
    </>
  );
}
