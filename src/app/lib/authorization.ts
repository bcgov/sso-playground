interface openIdConfig {
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
}

export default class AuthService {
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

  constructor(config: openIdConfig) {
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

  getRandomString = () => {
    const randomItems = new Uint32Array(28);
    crypto.getRandomValues(randomItems);
    const binaryStringItems: string[] = [];
    randomItems.forEach((dec) =>
      binaryStringItems.push(`0${dec.toString(16).slice(-2)}`)
    );
    return binaryStringItems.reduce(
      (acc: string, item: string) => `${acc}${item}`,
      ""
    );
  };

  // Encrypt a String with SHA256
  encryptStringWithSHA256 = async (str: string) => {
    const PROTOCOL = "SHA-256";
    const textEncoder = new TextEncoder();
    const encodedData = textEncoder.encode(str);
    return crypto.subtle.digest(PROTOCOL, encodedData);
  };

  decodePayload = (payload: string) => {
    if (!payload) return null;

    const cleanedPayload = payload.replaceAll("-", "+").replaceAll("_", "/");
    const decodedPayload = atob(cleanedPayload);
    const uriEncodedPayload = Array.from(decodedPayload).reduce((acc, char) => {
      const uriEncodedChar = ("00" + char.charCodeAt(0).toString(16)).slice(-2);
      return `${acc}%${uriEncodedChar}`;
    }, "");
    const jsonPayload = decodeURIComponent(uriEncodedPayload);

    return JSON.parse(jsonPayload);
  };

  // Parse JWT Payload
  parseJWTPayload = (token: string) => {
    if (!token) return null;
    const [, payload] = token.split(".");
    return this.decodePayload(payload);
  };

  // Convert Hash to Base64-URL
  hashToBase64url = (arrayBuffer: Iterable<number>) => {
    const items = new Uint8Array(arrayBuffer);
    const stringifiedArrayHash = items.reduce(
      (acc, i) => `${acc}${String.fromCharCode(i)}`,
      ""
    );
    const decodedHash = btoa(stringifiedArrayHash);

    return decodedHash
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/, "");
  };
  async login(flowType: string) {
    if (["service-account", "password"].includes(flowType)) {
      const tokenRequestBody: any = {
        tokenUrl: this.tokenEndpoint,
        clientId: this.clientId || "",
        scopes: this.scopes,
      };
      if (flowType === "service-account") {
        tokenRequestBody["grantType"] = "client_credentials";
        tokenRequestBody["clientSecret"] = this.clientSecret || "";
      } else {
        tokenRequestBody["grantType"] = "password";
        tokenRequestBody["username"] = this.username;
        tokenRequestBody["password"] = this.password;
        if (this.clientSecret) {
          tokenRequestBody.clientSecret = this.clientSecret || "";
        }
      }

      const response = await fetch("/api/token", {
        method: "POST",
        body: JSON.stringify(tokenRequestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status !== 200) {
        const error = await response.json();
        throw new Error(error?.error);
      }
      const tokens = await response.json();
      sessionStorage.setItem("tokens", JSON.stringify(tokens || {}));
      return;
    }
    const state = this.getRandomString();
    const nonce = this.getRandomString();
    sessionStorage.setItem("oauth_state", state);
    sessionStorage.setItem("oidc_nonce", nonce);

    let authorizationUrl = `${
      this.authorizationEndpoint
    }?response_type=code&client_id=${this.clientId}&redirect_uri=${
      this.redirectUri
    }&scope=${this.scopes.join(
      " "
    )}&state=${this.getRandomString()}&nonce=${nonce}`;

    if (this.clientSecret) {
      sessionStorage.setItem("client_secret", this.clientSecret);
      authorizationUrl = `${authorizationUrl}&client_secret=${this.clientSecret}`;
    } else {
      // Create PKCE code verifier
      const code_verifier = this.getRandomString();
      sessionStorage.setItem("code_verifier", code_verifier);

      // Create code challenge
      const arrayHash: any = await this.encryptStringWithSHA256(code_verifier);
      const code_challenge = this.hashToBase64url(arrayHash);
      sessionStorage.setItem("code_challenge", code_challenge);
      authorizationUrl = `${authorizationUrl}&code_challenge_method=S256&code_challenge=${code_challenge}`;
    }

    if (this.forwardQueryParams) {
      authorizationUrl = `${authorizationUrl}&${this.forwardQueryParams}`;
    }

    globalThis.location.href = authorizationUrl;
  }

  async logout(id_token?: string) {
    sessionStorage.removeItem("oidc_nonce");
    sessionStorage.removeItem("oauth_state");
    sessionStorage.removeItem("code_verifier");
    sessionStorage.removeItem("code_challenge");
    let logoutUrlWithIdToken = `${this.logoutEndpoint}?post_logout_redirect_uri=${this.redirectUri}`;

    if (id_token) {
      logoutUrlWithIdToken =
        logoutUrlWithIdToken + `&id_token_hint=${encodeURIComponent(id_token)}`;
    }

    globalThis.location.href = logoutUrlWithIdToken;
  }

  async handleCallback(
    {
      tokenUrl,
      clientId,
      clientSecret,
      redirectUri,
      userinfoUrl,
    }: {
      tokenUrl: string;
      clientId: string;
      clientSecret?: string;
      redirectUri: string;
      userinfoUrl?: string;
    },
    authorizationCode?: string
  ) {
    let tokens = null;
    if (authorizationCode) {
      tokens = await this.requestTokens(
        { tokenUrl, clientId, clientSecret, redirectUri, userinfoUrl },
        authorizationCode
      );
    }
    return tokens;
  }

  private async requestTokens(
    {
      tokenUrl,
      clientId,
      clientSecret,
      redirectUri,
      userinfoUrl,
    }: {
      tokenUrl: string;
      clientId: string;
      clientSecret?: string;
      redirectUri: string;
      userinfoUrl?: string;
    },
    authorizationCode: string
  ) {
    let tokens = null;
    try {
      const tokenRequestBody = new URLSearchParams({
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri: redirectUri,
        client_id: clientId,
      });

      if (clientSecret) {
        tokenRequestBody.append("client_secret", clientSecret);
      } else {
        tokenRequestBody.append(
          "code_verifier",
          sessionStorage.getItem("code_verifier") || ""
        );
      }

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: tokenRequestBody.toString(),
      });

      if (
        response.ok &&
        response.headers.get("Content-Type")?.includes("application/json")
      ) {
        tokens = await response.json();

        if (userinfoUrl && tokens?.access_token) {
          const userinfoResponse = await fetch(userinfoUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${tokens?.access_token}`,
            },
          });
          const userinfo = await userinfoResponse.json();
          tokens["userinfo_token"] = userinfo;
        }
      }
      return tokens;
    } catch (err) {
      console.error("Error requesting tokens:", err);
      throw err;
    }
  }

  isAuthenticated() {
    let authenticated = false;
    const tokens = sessionStorage.getItem("tokens");
    if (tokens) {
      const tokenPayload = this.parseJWTPayload(
        JSON.parse(tokens).access_token
      );
      if (tokenPayload) {
        authenticated = true;
      }
    }
    return authenticated;
  }
}
