import { NextResponse } from "next/server";

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

interface ApiErrorResponse {
  success: false;
  data: null;
  error: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a standardized success response
 */
export function apiSuccess<T>(
  data: T,
  status = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      error: null,
    },
    { status },
  );
}

/**
 * Create a standardized error response
 */
export function apiError(
  error: string,
  status = 400,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      data: null,
      error,
    },
    { status },
  );
}

export type { ApiResponse, ApiSuccessResponse, ApiErrorResponse };
