export async function GET() {
  return new Response(
    JSON.stringify({
      env: {
        REDIRECT_URI: process.env.REDIRECT_URI,
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
