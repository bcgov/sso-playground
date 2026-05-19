import { OidcClient, OidcMetadata } from "oidc-client-ts";

type OpenIdConfig = {
  discoveryUrl: string;
  authorizationEndpoint?: string;
  tokenEndpoint: string;
  logoutEndpoint: string;
  clientId: string;
  redirectUri?: string;
  scopes: string[];
  clientSecret?: string;
  username?: string;
  password?: string;
  forwardQueryParams: string;
  userinfoEndpoint?: string;
};

export class OidcAuthService {
  discoveryUrl: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  logoutEndpoint: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  clientSecret: string | undefined;
  username: string;
  password: string;
  forwardQueryParams: string;
  userinfoEndpoint?: string;
  oidcClient?: OidcClient;

  constructor(config: OpenIdConfig) {
    this.discoveryUrl = config.discoveryUrl;
    this.authorizationEndpoint = config.authorizationEndpoint || "";
    this.tokenEndpoint = config.tokenEndpoint;
    this.logoutEndpoint = config.logoutEndpoint;
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri || "";
    this.scopes = config.scopes;
    this.clientSecret = config?.clientSecret;
    this.username = config?.username || "";
    this.password = config?.password || "";
    this.forwardQueryParams = config?.forwardQueryParams || "";
    this.userinfoEndpoint = config?.userinfoEndpoint || "";
  }

  async getAuthrity(discoveryUrl: string): Promise<string> {
    const response = await fetch(discoveryUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch OpenID configuration: ${response.statusText}`
      );
    }
    const metadata: OidcMetadata = await response.json();
    return metadata.issuer;
  }

  async init(): Promise<OidcClient> {
    if (this.oidcClient) {
      return this.oidcClient;
    }
    this.oidcClient = new OidcClient({
      metadataUrl: this.discoveryUrl,
      authority: await this.getAuthrity(this.discoveryUrl),
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: this.scopes.join(" "),
      post_logout_redirect_uri: this.redirectUri,
    });
    return this.oidcClient;
  }

  async login() {
    try {
      const client = await this.init();
      const authUri = await client.createSigninRequest({});
      globalThis.location.href = authUri.url;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async processLoginCallback() {
    try {
      if (sessionStorage.getItem("tokens")) {
        return JSON.parse(sessionStorage.getItem("tokens") || "");
      }

      const url = new URL(globalThis.location.href);
      if (
        url.searchParams.get("code") === null ||
        url.searchParams.get("state") === null
      ) {
        return;
      }
      const client = await this.init();
      const response = await client.processSigninResponse(
        globalThis.location.href
      );
      globalThis.history.replaceState({}, document.title, "/");
      sessionStorage.setItem("tokens", JSON.stringify(response));
      return response;
    } catch (error) {
      console.error("Login callback processing failed:", error);
      throw error;
    }
  }

  async logout(idToken: string) {
    try {
      const client = await this.init();
      const logoutUri = await client.createSignoutRequest({
        id_token_hint: idToken,
      });
      sessionStorage.removeItem("tokens");
      globalThis.location.href = logoutUri.url;
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }

  async processClientCredentialsGrant() {
    try {
      const tokenRequestBody = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret || "",
        scope: this.scopes.join(" "),
      });
      const response = await fetch(this.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenRequestBody.toString(),
      });
      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`);
      }
      const tokenResponse = await response.json();
      return tokenResponse;
    } catch (error) {
      console.error("Client credentials grant failed:", error);
      throw error;
    }
  }

  async processPasswordGrant() {
    try {
      const response =
        await this.oidcClient?.processResourceOwnerPasswordCredentials({
          username: this.username,
          password: this.password,
        });
      return response;
    } catch (error) {
      console.error("Password grant failed:", error);
      throw error;
    }
  }
}
