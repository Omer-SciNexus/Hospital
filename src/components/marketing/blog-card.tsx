import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/data/content";
import { doctorsById } from "@/data/doctors";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

export function BlogCard({ post, featured }: { post: BlogPost; featured?: boolean }) {
  const author = doctorsById[post.author];
  return (
    <article className="group relative flex h-full flex-col">
      <div className={featured ? "relative aspect-[16/10] overflow-hidden rounded-3xl" : "relative aspect-[3/2] overflow-hidden rounded-3xl"}>
        <Image
          src={post.image}
          alt=""
          fill
          sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-800 backdrop-blur">
          {post.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <p className="text-xs font-medium text-muted-foreground">
          {formatDate(post.date)} · {post.readMinutes} min read
        </p>
        <h3 className={featured ? "mt-2 text-2xl font-extrabold sm:text-3xl" : "mt-2 text-lg font-bold"}>
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        {author && (
          <div className="mt-auto flex items-center gap-2.5 pt-4 text-sm">
            <Avatar name={author.name} src={author.photo} size={32} />
            <span className="font-medium">{author.name}</span>
          </div>
        )}
      </div>
    </article>
  );
}
