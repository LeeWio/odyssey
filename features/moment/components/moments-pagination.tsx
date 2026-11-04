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

export function MomentsPagination({
  page,
  pages,
  isDisabled = false,
  onPageChange,
}: {
  page: number;
  pages: number;
  isDisabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("Moments");
  if (pages <= 1) return null;

  return (
    <div className="w-full overflow-x-auto py-2">
      <Pagination aria-label={t("paginationLabel")} className="justify-center" size="sm">
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous
              aria-label={t("previousPage")}
              isDisabled={isDisabled || page === 1}
              onPress={() => onPageChange(page - 1)}
            >
              <Pagination.PreviousIcon />
              <span className="hidden sm:inline">{t("previousPage")}</span>
            </Pagination.Previous>
          </Pagination.Item>
          {pageNumbers(page, pages).map((item, index) =>
            item === "ellipsis" ? (
              <Pagination.Item key={`ellipsis-${index}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={item}>
                <Pagination.Link
                  aria-label={t("pageLabel", { page: item })}
                  isActive={item === page}
                  isDisabled={isDisabled}
                  onPress={() => onPageChange(item)}
                >
                  {item}
                </Pagination.Link>
              </Pagination.Item>
            )
          )}
          <Pagination.Item>
            <Pagination.Next
              aria-label={t("nextPage")}
              isDisabled={isDisabled || page === pages}
              onPress={() => onPageChange(page + 1)}
            >
              <span className="hidden sm:inline">{t("nextPage")}</span>
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </div>
  );
}
