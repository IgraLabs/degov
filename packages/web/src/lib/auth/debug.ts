"use client";

class AuthDebug {
  private sessionId = Math.random().toString(36).slice(2, 8);

  log(msg: string): void {
    console.log(`[auth:${this.sessionId}] ${msg}`);
  }
}

export const authDebug = new AuthDebug();
