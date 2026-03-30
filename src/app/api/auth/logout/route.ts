import {
  clearSamlUserSessionCookie,
  getSamlUserSessionFromCookie,
} from "@/app/lib/saml";
import { SamlConfig, SAML } from "@node-saml/node-saml";
import { env } from "next-runtime-env";

export async function POST(req: Request) {
  const existingUserSessionProfile = await getSamlUserSessionFromCookie();

  if (!existingUserSessionProfile) {
    return Response.json(
      { error: "No active SAML session found" },
      { status: 400 }
    );
  } else await clearSamlUserSessionCookie();

  const { idpSsoUrl, idpCert, spEntityId, spAcsUrl, logoutUrl, userProfile } =
    await req.json();

  if (!idpSsoUrl || !spEntityId || !idpCert || !spAcsUrl || !logoutUrl) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!userProfile) {
    return Response.json(
      { error: "Missing user userProfile" },
      { status: 400 }
    );
  }

  try {
    const samlConfig: SamlConfig = {
      entryPoint: idpSsoUrl,
      idpCert: idpCert,
      issuer: spEntityId,
      callbackUrl: spAcsUrl,
      logoutUrl: logoutUrl,
      logoutCallbackUrl: `${
        env("REDIRECT_URI") || "http://localhost:3000"
      }/saml`,
    };

    const saml = new SAML(samlConfig);

    const relayState = Buffer.from(JSON.stringify(samlConfig)).toString(
      "base64"
    );

    const authUrl = await saml.getLogoutUrlAsync(userProfile, relayState, {});

    return Response.json({ redirectUrl: authUrl });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
