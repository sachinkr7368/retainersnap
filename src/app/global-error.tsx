"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#f4f0e6", color: "#1c1915", fontFamily: "sans-serif", margin: 0, padding: "3rem" }}>
        <h1 style={{ fontSize: "2rem" }}>Something went wrong</h1>
        <p>The page could not be rendered. Try again.</p>
        <button type="button" onClick={() => reset()} style={{ marginTop: "1.5rem", height: "2.75rem", borderRadius: "999px", padding: "0 1rem" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
