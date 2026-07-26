/** Shim for next/server — Web-standard Request/Response. */

export class NextRequest extends Request {
  nextUrl: URL;
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
    this.nextUrl = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  }
}

type JsonInit = ResponseInit & { status?: number };

export class NextResponse extends Response {
  static json(data: unknown, init?: JsonInit) {
    return Response.json(data, init);
  }

  static redirect(url: string | URL, status = 307) {
    return Response.redirect(url, status);
  }

  static next() {
    return new Response(null, { status: 200 });
  }

  static rewrite(_url: string | URL) {
    return new Response(null, { status: 200 });
  }
}

export type { NextRequest as NextRequestType };
