import { SamlConfig } from "@node-saml/node-saml/lib/types";
import { SAML } from "@node-saml/node-saml/lib/saml";

export async function POST(req: Request) {
  const { idpSsoUrl, idpCert, spEntityId, spAcsUrl, logoutUrl } =
    await req.json();

  if (!idpSsoUrl || !spEntityId || !idpCert || !spAcsUrl || !logoutUrl) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const samlConfig: SamlConfig = {
      entryPoint: idpSsoUrl,
      idpCert: idpCert,
      issuer: spEntityId,
      callbackUrl: spAcsUrl,
      logoutUrl: logoutUrl,
    };

    const saml = new SAML(samlConfig);

    const relayState = Buffer.from(JSON.stringify(samlConfig)).toString(
      "base64"
    );

    const authUrl = await saml.getAuthorizeUrlAsync(relayState, "", {});

    return Response.json({ redirectUrl: authUrl });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
