export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 20;

export type Pagination = {
  page: number;
  limit: number;
  offset: number;
};

export function parsePagination(
    pageValue: string | undefined,
    limitValue: string | undefined
): Pagination {
  const parsePositiveInteger = (
      value: string | undefined,
      fallback: number
  ): number => {
    if (!value || !/^[1-9]\d*$/.test(value)) {
      return fallback;
    }

    const parsed = Number(value);

    return Number.isSafeInteger(parsed)
        ? parsed
        : fallback;
  };

  const page = parsePositiveInteger(pageValue, 1);

  const requestedLimit = parsePositiveInteger(
      limitValue,
      DEFAULT_PAGE_SIZE
  );

  const limit = Math.min(
      requestedLimit,
      MAX_PAGE_SIZE
  );

  // Prevent offsets that exceed JavaScript's safe integer range.
  const offset = (page - 1) * limit;

  return {
    page: Number.isSafeInteger(offset) ? page : 1,
    limit,
    offset: Number.isSafeInteger(offset) ? offset : 0,
  };
}
