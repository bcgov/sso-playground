"use client";
import {
  Box,
  Grid,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
} from "@mui/material";
import { MultiSelect } from "./components/MultiSelect";
import { TextField } from "./components/TextField";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import AuthService from "./lib/authorization";
import TokenData from "./components/TokenData";
import { AlertContext } from "./components/AlertProvider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { env } from "next-runtime-env";
import Loader from "./components/Loader";

interface Tokens {
  access_token: string;
  id_token: string;
  refresh_token: string;
}

interface FormValues {
  clientId: { value: string; error: boolean; errorMessage: string };
  clientSecret: { value: string; error: boolean; errorMessage: string };
  discoveryUrl: {
    value: string;
    error: boolean;
    errorMessage: string;
  };
  authorizationUrl: {
    value: string;
    error: boolean;
    errorMessage: string;
  };
  forwardQueryParams: { value: string; error: boolean; errorMessage: string };
  tokenUrl: { value: string; error: boolean; errorMessage: string };
  logoutUrl: { value: string; error: boolean; errorMessage: string };
  redirectUri: { value: string; error: boolean; errorMessage: string };
  scopes: { value: string[]; error: boolean; errorMessage: string };
  username: { value: string; error: boolean; errorMessage: string };
  password: { value: string; error: boolean; errorMessage: string };
  userinfoUrl: { value: string; error: boolean; errorMessage: string };
}

const initialFormValues: FormValues = {
  clientId: {
    value: "",
    error: false,
    errorMessage: "Client ID is required",
  },
  clientSecret: {
    value: "",
    error: false,
    errorMessage: "",
  },
  discoveryUrl: {
    value: "",
    error: false,
    errorMessage: "",
  },
  authorizationUrl: {
    value: "",
    error: false,
    errorMessage: "Please enter a valid authorization URL",
  },
  forwardQueryParams: {
    value: "",
    error: false,
    errorMessage: "",
  },
  tokenUrl: {
    value: "",
    error: false,
    errorMessage: "Please enter a valid token URL",
  },
  logoutUrl: {
    value: "",
    error: false,
    errorMessage: "",
  },
  userinfoUrl: {
    value: "",
    error: false,
    errorMessage: "",
  },
  redirectUri: {
    value: env("NEXT_PUBLIC_REDIRECT_URI") || "http://localhost:3000",
    error: false,
    errorMessage: "",
  },
  scopes: {
    value: ["openid"],
    error: false,
    errorMessage: "Please pass atleast one scope",
  },
  username: {
    value: "",
    error: false,
    errorMessage: "Username is required",
  },
  password: {
    value: "",
    error: false,
    errorMessage: "Password is required",
  },
};

export default function Form() {
  const [flowType, setFlowType] = useState<string>("");
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [tokensLoading, setTokensLoading] = useState(false);

  const [authenticated, setAuthenticated] = useState(false);
  const [tokens, setTokens] = useState<Tokens>({
    access_token: "",
    id_token: "",
    refresh_token: "",
  });
  const [validDiscoveryUrl, setValidDiscoveryUrl] = useState(false);
  let validatedFormFields = ["clientId"];

  if (flowType === "password") {
    validatedFormFields = ["clientId", "tokenUrl", "username", "password"];
  } else validatedFormFields = ["authorizationUrl", "clientId", "tokenUrl"];

  const { error, setError } = useContext<AlertContext>(AlertContext);
  const authService = useMemo(
    () =>
      new AuthService({
        authorizationEndpoint: formValues.authorizationUrl.value,
        tokenEndpoint: formValues.tokenUrl.value,
        logoutEndpoint: formValues.logoutUrl.value,
        clientId: formValues.clientId.value,
        clientSecret: formValues.clientSecret.value,
        redirectUri: formValues.redirectUri.value,
        scopes: formValues.scopes.value,
        username: formValues.username.value,
        password: formValues.password.value,
        forwardQueryParams: formValues.forwardQueryParams.value,
        userinfoEndpoint: formValues.userinfoUrl.value,
      }),
    [
      formValues.authorizationUrl.value,
      formValues.tokenUrl.value,
      formValues.logoutUrl.value,
      formValues.clientId.value,
      formValues.clientSecret.value,
      formValues.redirectUri.value,
      formValues.scopes.value,
      formValues.username.value,
      formValues.password.value,
      formValues.forwardQueryParams.value,
      formValues.userinfoUrl.value,
    ]
  );

  const handleFlowTypeChange = (e: any) => {
    setFlowType(e.target.value);
    globalThis.localStorage.setItem("flowType", e.target.value);
  };

  const handleAuthCallback = useCallback(async () => {
    const formValues = JSON.parse(
      globalThis.localStorage.getItem("formValues") || "{}"
    );
    if (!formValues?.tokenUrl?.value) return;
    setTokensLoading(true);
    try {
      const urlSearchParams = new URLSearchParams(globalThis.location.search);
      const code = urlSearchParams.get("code");
      const state = urlSearchParams.get("state");
      if (!!code && !!state && !authenticated) {
        const tokens = await authService.handleCallback(
          {
            tokenUrl: formValues.tokenUrl.value,
            clientId: formValues.clientId.value,
            clientSecret: formValues.clientSecret.value,
            redirectUri: formValues.redirectUri.value,
            userinfoUrl: formValues.userinfoUrl.value,
          },
          code
        );
        if (tokens) {
          setAuthenticated(true);
          setTokens(tokens);
        }
      }
      globalThis.history.replaceState(
        {},
        document.title,
        globalThis.location.pathname
      );
    } catch (err: any) {
      setTokensLoading(false);
      setError(err?.message || "Failed to handle authentication callback");
      console.error(err);
    } finally {
      setTokensLoading(false);
    }
  }, []);

  useEffect(() => {
    if (globalThis.window !== undefined) {
      if (globalThis.localStorage.getItem("formValues")) {
        setFormValues(
          JSON.parse(globalThis.localStorage.getItem("formValues") || "")
        );
      }
      if (globalThis.localStorage.getItem("flowType"))
        setFlowType(globalThis.localStorage.getItem("flowType") || "");
    }
  }, []);

  useEffect(() => {
    handleAuthCallback();
  }, [handleAuthCallback]);

  useEffect(() => {
    populateUrls(formValues.discoveryUrl.value);
  }, [formValues.discoveryUrl.value]);

  const handleLogin = async () => {
    try {
      await authService.login(flowType);
      if (["service-account", "password"].includes(flowType)) {
        globalThis.location.reload();
      }
    } catch (err: any) {
      setError(err?.message || err);
      console.error(error);
    }
  };

  const handleLogout = () => {
    if (flowType === "authorization-code") {
      authService.logout(tokens.id_token);
    } else {
      setTokens({} as Tokens);
      setAuthenticated(false);
      globalThis.location.reload();
    }
  };

  const setScopes = (scopes: string[]) => {
    setFormValues({
      ...formValues,
      scopes: {
        value: scopes,
        error: false,
        errorMessage: "",
      },
    });
  };

  const populateUrls = async (discoveryUrl: string) => {
    if (discoveryUrl) {
      try {
        setFormValues({
          ...formValues,
          discoveryUrl: {
            value: discoveryUrl,
            error: false,
            errorMessage: "",
          },
        });
        const res = await fetch(discoveryUrl);
        if (res.status === 200) {
          setValidDiscoveryUrl(true);
          const data = await res.json();
          if (data.authorization_endpoint)
            setFormValues({
              ...formValues,
              authorizationUrl: {
                ...formValues["authorizationUrl"],
                value: data.authorization_endpoint || "",
                error: false,
              },
              tokenUrl: {
                ...formValues["tokenUrl"],
                value: data.token_endpoint || "",
                error: false,
              },
              logoutUrl: {
                ...formValues["logoutUrl"],
                value: data.end_session_endpoint || "",
                error: false,
              },
              userinfoUrl: {
                ...formValues["userinfoUrl"],
                value: data.userinfo_endpoint || "",
                error: false,
              },
            });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: {
        ...formValues[name as keyof FormValues],
        value,
        error: value.trim() === "",
      },
    });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    let formErrors = false;
    const formFields = Object.keys(formValues);
    let newFormValues = { ...formValues };

    for (const element of formFields) {
      const currentField = element;
      const currentValue = formValues[currentField as keyof FormValues].value;

      if (currentValue === "") {
        newFormValues = {
          ...newFormValues,
          [currentField]: {
            ...formValues[currentField as keyof FormValues],
            error: true,
          },
        };
        if (validatedFormFields.includes(currentField)) formErrors = true;
      }
    }

    setFormValues(newFormValues);
    localStorage.setItem("formValues", JSON.stringify(newFormValues));

    if (!formErrors) {
      handleLogin();
    }
  };

  return (
    <Grid container sx={{ padding: 1 }} spacing={1}>
      <Grid size={tokensLoading || authenticated ? 6 : 12}>
        <Paper elevation={3} sx={{ padding: 1, margin: 1 }}>
          <Box sx={{ padding: 1, height: "100%" }}>
            <form
              noValidate
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <FormControl sx={{ width: "100%", padding: 1 }}>
                <FormLabel>Flow</FormLabel>
                <RadioGroup
                  value={flowType}
                  onChange={(e) => handleFlowTypeChange(e)}
                  sx={{ color: "black" }}
                  row
                >
                  <FormControlLabel
                    value="authorization-code"
                    control={<Radio />}
                    label="Authorization Code"
                  />
                  <FormControlLabel
                    value="service-account"
                    control={<Radio />}
                    label="Service Account"
                  />
                  <FormControlLabel
                    value="password"
                    control={<Radio />}
                    label="Password"
                  />
                </RadioGroup>
              </FormControl>
              {flowType && (
                <Box
                  sx={{
                    textAlign: "center",
                    height: "100vh",
                  }}
                >
                  <TextField
                    name="discoveryUrl"
                    label="Discovery URL"
                    onChange={(e) => handleChange(e)}
                    value={formValues.discoveryUrl.value}
                    slotProps={{
                      input: {
                        endAdornment: validDiscoveryUrl && (
                          <CheckCircleIcon color="success" />
                        ),
                      },
                    }}
                  />

                  {!["service-account", "password"].includes(flowType) && (
                    <>
                      <TextField
                        name="authorizationUrl"
                        label="Authorization URL"
                        onChange={(e) => handleChange(e)}
                        value={formValues.authorizationUrl.value}
                        required
                        error={formValues.authorizationUrl.error}
                        helperText={
                          formValues.authorizationUrl.error &&
                          formValues.authorizationUrl.errorMessage
                        }
                      />
                      <TextField
                        name="forwardQueryParams"
                        label="Forward Query Params"
                        onChange={(e) => handleChange(e)}
                        value={formValues.forwardQueryParams.value}
                        helperText="param1=value1&param2=value2"
                      />

                      <TextField
                        name="userinfoUrl"
                        label="Userinfo URL"
                        onChange={(e) => handleChange(e)}
                        value={formValues.userinfoUrl.value}
                      />
                    </>
                  )}

                  <TextField
                    name="tokenUrl"
                    label="Token URL"
                    onChange={(e) => handleChange(e)}
                    value={formValues.tokenUrl.value}
                    error={formValues.tokenUrl.error}
                    helperText={
                      formValues.tokenUrl.error &&
                      formValues.tokenUrl.errorMessage
                    }
                    required
                  />

                  {!["service-account", "password"].includes(flowType) && (
                    <TextField
                      name="logoutUrl"
                      label="Logout URL"
                      onChange={(e) => handleChange(e)}
                      value={formValues.logoutUrl.value}
                    />
                  )}
                  <TextField
                    name="clientId"
                    label="Client ID"
                    onChange={(e) => handleChange(e)}
                    value={formValues.clientId.value}
                    required
                    error={formValues.clientId.error}
                    helperText={
                      formValues.clientId.error &&
                      formValues.clientId.errorMessage
                    }
                  />
                  <TextField
                    name="clientSecret"
                    label="Client Secret"
                    onChange={(e) => handleChange(e)}
                    value={formValues.clientSecret.value}
                  />
                  {flowType === "password" && (
                    <>
                      <TextField
                        name="username"
                        label="Username"
                        onChange={(e) => handleChange(e)}
                        value={formValues.username.value}
                        error={formValues.username.error}
                        helperText={
                          formValues.username.error &&
                          formValues.username.errorMessage
                        }
                      />

                      <TextField
                        name="password"
                        label="Password"
                        onChange={(e) => handleChange(e)}
                        value={formValues.password.value}
                        error={formValues.password.error}
                        helperText={
                          formValues.password.error &&
                          formValues.password.errorMessage
                        }
                      />
                    </>
                  )}

                  <MultiSelect
                    onChange={setScopes}
                    label="Scopes"
                    value={formValues.scopes.value || ["openid"]}
                    fixedOptions={["openid"]}
                  />
                  {!["service-account", "password"].includes(flowType) && (
                    <TextField
                      name="redirectUri"
                      label="Redirect URI"
                      onChange={(e) => handleChange(e)}
                      value={formValues.redirectUri.value}
                    />
                  )}
                  {authenticated ? (
                    <Button variant="contained" onClick={handleLogout}>
                      Logout
                    </Button>
                  ) : (
                    <Button variant="contained" type="submit">
                      Login
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={() => {
                      localStorage.removeItem("formValues");
                      globalThis.location.reload();
                    }}
                    color="error"
                    sx={{ marginLeft: 2 }}
                  >
                    Reset
                  </Button>
                </Box>
              )}
            </form>
          </Box>
        </Paper>
      </Grid>
      {(tokensLoading || authenticated) && (
        <Grid size={6}>
          {tokensLoading ? (
            <>
              <h1>Loading</h1>
              <Loader count={10} />
            </>
          ) : (
            <TokenData tokens={tokens} />
          )}
        </Grid>
      )}
    </Grid>
  );
}
