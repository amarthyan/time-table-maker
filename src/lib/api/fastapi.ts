/**
 * FastAPI Scheduling Microservice Client
 * Integrates with Python + OR-Tools CP-SAT scheduler
 * Follows the Backend API & Database Contract
 */

export interface FastApiHealthResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface GenerateTimetableRequest {
  academic_year_id: string;
  semester_type: 'ODD' | 'EVEN';
}

export interface GenerateTimetableResponse {
  status: 'success';
  timetable_id: string;
  message: string;
}

export interface FastApiErrorResponse {
  detail: string;
}

const FASTAPI_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';

/**
 * Resolves the active Admin Clerk JWT token from Clerk session, localStorage, or dev fallback
 */
export async function resolveAuthToken(explicitToken?: string): Promise<string> {
  if (explicitToken) return explicitToken;

  if (typeof window !== 'undefined') {
    // 1. Check if Clerk is mounted in window
    const clerk = (window as any).Clerk;
    if (clerk?.session) {
      try {
        const token = await clerk.session.getToken();
        if (token) return token;
      } catch (err) {
        console.warn('Could not extract Clerk session token:', err);
      }
    }

    // 2. Check localStorage for manual test token or cached JWT
    const storedToken =
      localStorage.getItem('clerk_jwt_token') ||
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('clerk_jwt_token');
    if (storedToken) return storedToken;
  }

  // 3. Fallback dev admin token for local development
  return 'dev-admin-token';
}

/**
 * Health check endpoint: GET /health
 */
export async function checkFastApiHealth(): Promise<FastApiHealthResponse> {
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { status: 'error', message: `HTTP ${res.status}: ${res.statusText}` };
    }

    return await res.json();
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || 'FastAPI service unavailable on ' + FASTAPI_BASE_URL,
    };
  }
}

/**
 * Generate Timetable endpoint: POST /api/timetables/generate
 * Headers:
 * - Authorization: Bearer <clerk_jwt_token>
 * Request Body:
 * { "academic_year_id": "...", "semester_type": "ODD" | "EVEN" }
 */
export async function generateTimetableViaFastApi(
  payload: GenerateTimetableRequest,
  token?: string
): Promise<GenerateTimetableResponse> {
  const authToken = await resolveAuthToken(token);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  const res = await fetch(`${FASTAPI_BASE_URL}/api/timetables/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = `Failed to generate timetable (HTTP ${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Fallback
    }

    if (res.status === 400) {
      throw new Error(`Solver could not find a feasible timetable under current constraints.`);
    } else if (res.status === 401) {
      throw new Error(`Unauthorized (Admin Clerk JWT required): ${errorDetail}`);
    } else if (res.status === 422) {
      throw new Error(`Unprocessable Entity: ${errorDetail}`);
    } else {
      throw new Error(errorDetail);
    }
  }

  return await res.json();
}
