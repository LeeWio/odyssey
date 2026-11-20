"use client";

import { Pagination } from "@heroui/react";
import { useTranslations } from "next-intl";

function pageNumbers(page: number, totalPages: number) {
  const pages: Array<number | "ellipsis"> = [];
  if (totalPages <= 7) {
    for (let index = 1; index <= totalPages; index += 1) pages.push(index);
    return pages;
  }
  pages.push(1);
  if (page > 3) pages.push("ellipsis");
  for (let index = Math.max(2, page - 1); index <= Math.min(totalPages - 1, page + 1); index += 1) {
    pages.push(index);
  }
  if (page < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

export function EssayPagination({
  onPageChange,
  page,
  pages,
}: {
  onPageChange: (page: number) => void;
  page: number;
  pages: number;
}) {
  const t = useTranslations("Journal");
  if (pages <= 1) return null;

  return (
    <div className="w-full overflow-x-auto">
      <Pagination className="justify-center" size="sm">
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous isDisabled={page === 1} onPress={() => onPageChange(page - 1)}>
              <Pagination.PreviousIcon />
              <span>{t("previous")}</span>
            </Pagination.Previous>
          </Pagination.Item>
          {pageNumbers(page, pages).map((item, index) =>
            item === "ellipsis" ? (
              <Pagination.Item key={`ellipsis-${index}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={item}>
                <Pagination.Link isActive={item === page} onPress={() => onPageChange(item)}>
                  {item}
                </Pagination.Link>
              </Pagination.Item>
            )
          )}
          <Pagination.Item>
            <Pagination.Next isDisabled={page === pages} onPress={() => onPageChange(page + 1)}>
              <span>{t("next")}</span>
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </div>
  );
}
