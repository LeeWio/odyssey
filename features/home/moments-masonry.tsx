import { Avatar, Card, Chip, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import { MomentContent } from "@/features/moment/components/moment-content";
import { parseMomentContent } from "@/features/moment/utils/content-parser";
import { getMomentImagePreviews } from "@/features/moment/utils/image-previews";
import { useRelativeTime } from "@/lib/relative-time";
import type { MomentResponse } from "@/lib/features/moment";
import { MomentPreviewPhotos } from "./moment-preview-photos";

function MomentPreview({ moment }: { moment: MomentResponse }) {
  const t = useTranslations("Moments");
  const formatRelativeTime = useRelativeTime();
  const author = moment.authorName || "wei.li";
  const time = formatRelativeTime(moment.createdAt, { fallback: t("recently") });
  const images = getMomentImagePreviews(moment.images);

  return (
    <Card className="h-full">
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
        <MomentContent content={parseMomentContent(moment.content)} />
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
        {images.length ? <MomentPreviewPhotos images={images} /> : null}
      </Card.Content>
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
