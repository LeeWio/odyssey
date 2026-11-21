import { Avatar, Card, Chip, Link, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import { RemoteMedia } from "@/components/ui/remote-media";
import { MomentContent } from "@/features/moment/components/moment-content";
import { parseMomentContent } from "@/features/moment/utils/content-parser";
import { getMomentImagePreviews } from "@/features/moment/utils/image-previews";
import { useRelativeTime } from "@/lib/relative-time";
import type { MomentResponse } from "@/lib/features/moment";

function MomentPreview({ moment }: { moment: MomentResponse }) {
  const t = useTranslations("Moments");
  const formatRelativeTime = useRelativeTime();
  const author = moment.authorName || "wei.li";
  const time = formatRelativeTime(moment.createdAt, { fallback: t("recently") });
  const images = getMomentImagePreviews(moment.images);

  return (
    <Card className="relative h-full">
      <Card.Header className="flex-row items-center gap-2">
        <Avatar>
          {moment.authorAvatar ? <Avatar.Image alt="" src={moment.authorAvatar} /> : null}
          <Avatar.Fallback>{author.slice(0, 2).toUpperCase()}</Avatar.Fallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <Typography type="body" weight="bold" truncate>
            {author}
          </Typography>
          <Typography type="body-xs" color="muted">
            {time}
          </Typography>
        </div>
      </Card.Header>
      <Card.Content>
        <MomentContent
          content={parseMomentContent(moment.content)}
          className="[&_a]:relative [&_a]:z-10"
        />
        {moment.topics.length || moment.stockSymbol ? (
          <div className="flex flex-wrap gap-1.5">
            {moment.topics.map((topic) => (
              <Chip key={topic.id} size="sm" variant="soft">
                {topic.slug}
              </Chip>
            ))}
            {moment.stockSymbol ? (
              <Chip size="sm" variant="soft">
                {moment.stockSymbol}
              </Chip>
            ) : null}
          </div>
        ) : null}
        {images.length ? (
          <div className={images.length >= 4 ? "grid grid-cols-2 items-start gap-3" : "grid gap-3"}>
            {images.map((image, index) => (
              <RemoteMedia
                key={`${image.url}-${index}`}
                alt={image.alt || t("imageAlt")}
                className={
                  images.length === 1
                    ? "mx-auto h-auto max-h-[min(55svh,420px)] w-auto max-w-full rounded-lg object-contain"
                    : "h-auto w-full rounded-lg"
                }
                height={image.height}
                src={image.url}
                width={image.width}
              />
            ))}
          </div>
        ) : null}
      </Card.Content>
      <Link
        aria-label={t("openMoment", { author, time })}
        className="absolute inset-0"
        href={`/moments#moment-${moment.id}`}
      />
    </Card>
  );
}

export function MomentsMasonry({ moments }: { moments: MomentResponse[] }) {
  return (
    <div data-testid="moments-masonry" className="columns-1 gap-5 sm:[columns:20rem]">
      {moments.map((moment) => (
        <div key={moment.id} className="mb-5 w-full break-inside-avoid">
          <MomentPreview moment={moment} />
        </div>
      ))}
    </div>
  );
}
