import type { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

/**
 * Standard API Response wrapper as defined in Swagger
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * Common pagination request parameters
 */
export interface Pageable {
  page?: number;
  size?: number;
  sort?: string[];
}

/**
 * Standard paginated response wrapper
 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
