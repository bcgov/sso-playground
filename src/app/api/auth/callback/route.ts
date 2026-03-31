import { SamlConfig } from "@node-saml/node-saml/lib/types";
import { SAML } from "@node-saml/node-saml/lib/saml";
import { env } from "next-runtime-env";
import { createSamlUserSessionCookie } from "@/app/lib/saml";
import { flatten } from "flat";

export async function POST(req: Request) {
  const formData = await req.formData();
  const SAMLResponse = formData.get("SAMLResponse") as string | null;
  const RelayState = formData.get("RelayState") as string | null;

  if (!SAMLResponse) {
    return Response.json(
      { error: "Missing SAMLResponse in POST body" },
      { status: 400 }
    );
  }

  if (!RelayState) {
    return Response.json(
      { error: "Missing RelayState in POST body" },
      { status: 400 }
    );
  }

  try {
    const relayData = RelayState
      ? JSON.parse(Buffer.from(RelayState, "base64").toString())
      : null;

    if (
      !relayData?.idpCert ||
      !relayData?.issuer ||
      !relayData?.callbackUrl ||
      !relayData?.entryPoint ||
      !relayData?.logoutUrl
    ) {
      return Response.json({
        error:
          "RelayState is missing in SAML config. Ensure the initiate endpoint encodes config into RelayState.",
        status: 400,
      });
    }

    const samlConfig: SamlConfig = {
      entryPoint: relayData.entryPoint,
      idpCert: relayData.idpCert,
      issuer: relayData.issuer,
      callbackUrl: relayData.callbackUrl,
      logoutUrl: relayData.logoutUrl,
      wantAssertionsSigned: false,
    };

    const saml = new SAML(samlConfig);

    const { profile, loggedOut } = await saml.validatePostResponseAsync({
      SAMLResponse,
    });

    if (loggedOut || !profile) {
      return Response.json({ error: "SAML logged out" }, { status: 400 });
    }

    await createSamlUserSessionCookie(profile);

    return Response.redirect(
      new URL(
        `${
          env("NEXT_PUBLIC_REDIRECT_URI") || "http://localhost:3000"
        }/saml?profile=` +
          Buffer.from(JSON.stringify(flatten(profile))).toString("base64") +
          `&SAMLResponse=` +
          SAMLResponse
      )
    );
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
