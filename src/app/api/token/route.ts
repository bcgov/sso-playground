export async function POST(request: Request) {
  const {
    clientId,
    clientSecret,
    username,
    password,
    tokenUrl,
    grantType,
    scopes,
  } = await request.json();

  let payload = new URLSearchParams({
    grant_type: grantType,
    client_id: clientId,
    scope: scopes.join(" "),
  });

  if (grantType === "client_credentials") {
    payload.append("client_secret", clientSecret);
  } else if (grantType === "password") {
    payload.append("username", username);
    payload.append("password", password);
  } else {
    return new Response(JSON.stringify({ error: "Invalid grant type" }), {
      status: 401,
    });
  }

  const tokenResult = await fetch(tokenUrl, {
    method: "POST",
    body: payload.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!tokenResult.ok) {
    const err = await tokenResult.json();
    return new Response(
      JSON.stringify({
        error: err?.error_description || err?.error || err,
      }),
      { status: tokenResult.status }
    );
  }

  const data = (await tokenResult.json()) as any;

  return new Response(JSON.stringify(data), { status: tokenResult.status });
}
