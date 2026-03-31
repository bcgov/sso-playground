"use client";

import { Box, Button, Grid, Paper } from "@mui/material";
import { TextField } from "../components/TextField";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertContext } from "../components/AlertProvider";
import { env } from "next-runtime-env";
import { AssertionData } from "../components/AssestionData";

interface SAMLFormValues {
  serviceUrl: {
    value: string;
    error: boolean;
    errorMessage: string;
  };
  logoutUrl: {
    value: string;
    error: boolean;
    errorMessage: string;
  };
  entityId: {
    value: string;
    error: boolean;
    errorMessage: string;
  };
  x509Certificate: {
    value: string;
    error: boolean;
    errorMessage: string;
  };
}

const initialFormValues: SAMLFormValues = {
  serviceUrl: {
    value: "",
    error: false,
    errorMessage: "Service URL is required",
  },
  logoutUrl: {
    value: "",
    error: false,
    errorMessage: "Logout URL is required",
  },
  entityId: {
    value: "",
    error: false,
    errorMessage: "Entity ID is required",
  },
  x509Certificate: {
    value: "",
    error: false,
    errorMessage: "X.509 Certificate is required",
  },
};

export default function SamlPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [samlFormValues, setSamlFormValues] =
    useState<SAMLFormValues>(initialFormValues);
  const { error, setError } = useContext<AlertContext>(AlertContext);
  const [samlResponse, setSamlResponse] = useState<string>("");

  useEffect(() => {
    const profile = searchParams.get("profile");
    const samlResponse = searchParams.get("SAMLResponse");
    const errParam = searchParams.get("error");
    if (typeof window !== "undefined" && profile && samlResponse) {
      const raw = samlResponse ?? "";
      const base64 = raw
        .replace(/ /g, "+")
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const padded = base64 + "==".slice(0, (4 - (base64.length % 4)) % 4);
      const decoded = atob(padded);
      setSamlResponse(decoded);

      try {
        setUser(
          JSON.parse(Buffer.from(profile as string, "base64").toString())
        );
      } catch {
        setError("Failed to parse profile");
      }
    }

    if (errParam) {
      try {
        const { message } = JSON.parse(
          Buffer.from(errParam as string, "base64").toString()
        );
        setError(message);
      } catch {
        setError("Unknown SAML error");
      }
    }
  }, [searchParams]);

  const validatedFormFields = [
    "serviceUrl",
    "logoutUrl",
    "entityId",
    "x509Certificate",
  ];

  useEffect(() => {
    if (localStorage.getItem("samlFormValues")) {
      setSamlFormValues(
        JSON.parse(localStorage.getItem("samlFormValues") || "")
      );
    }
  }, []);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();

    let formErrors = false;
    const formFields = Object.keys(samlFormValues);
    let newFormValues = { ...samlFormValues };

    for (let index = 0; index < formFields.length; index++) {
      const currentField = formFields[index];
      const currentValue =
        samlFormValues[currentField as keyof SAMLFormValues].value;

      if (currentValue === "") {
        newFormValues = {
          ...newFormValues,
          [currentField]: {
            ...samlFormValues[currentField as keyof SAMLFormValues],
            error: true,
          },
        };
        if (validatedFormFields.includes(currentField)) formErrors = true;
      }
    }

    setSamlFormValues(newFormValues);
    localStorage.setItem("samlFormValues", JSON.stringify(newFormValues));

    if (!formErrors) {
      try {
        const data = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idpSsoUrl: samlFormValues.serviceUrl.value,
            spEntityId: samlFormValues.entityId.value,
            idpCert: samlFormValues.x509Certificate.value,
            logoutUrl: samlFormValues.logoutUrl.value,
            spAcsUrl: window.location.origin + "/api/auth/callback",
          }),
        }).then((res) => res.json());

        if (data?.redirectUrl) {
          location.href = data.redirectUrl;
        }
      } catch (err) {
        console.error("Login error:", err);
      }
    }
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setSamlFormValues({
      ...samlFormValues,
      [name]: {
        ...samlFormValues[name as keyof SAMLFormValues],
        value,
        error: value.trim() === "" ? true : false,
      },
    });
  };

  const handleLogout = async () => {
    const data = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idpSsoUrl: samlFormValues.serviceUrl.value,
        spEntityId: samlFormValues.entityId.value,
        idpCert: samlFormValues.x509Certificate.value,
        logoutUrl: samlFormValues.logoutUrl.value,
        spAcsUrl: `${
          env("NEXT_PUBLIC_REDIRECT_URI") || "http://localhost:3000"
        }/api/auth/callback`,
        userProfile: user,
      }),
    })
      .then((res) => res.json())
      .catch((err) => {
        console.error("Logout error:", err);
      });

    setUser(null);

    if (data?.redirectUrl) {
      location.href = data.redirectUrl;
    }
  };

  return (
    <>
      <Grid container sx={{ padding: 1 }} spacing={1}>
        <Grid size={user ? 6 : 12}>
          <Paper elevation={3} sx={{ padding: 1, margin: 1 }}>
            <Box sx={{ padding: 1, height: "100%" }}>
              <form
                noValidate
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
                onSubmit={handleSubmit}
              >
                <Box
                  sx={{
                    textAlign: "center",
                    height: "100vh",
                  }}
                >
                  <TextField
                    name="serviceUrl"
                    label="Service URL"
                    onChange={(e) => handleChange(e)}
                    value={samlFormValues.serviceUrl.value}
                    error={samlFormValues.serviceUrl.error}
                    helperText={
                      samlFormValues.serviceUrl.error &&
                      samlFormValues.serviceUrl.errorMessage
                    }
                  />
                  <TextField
                    name="logoutUrl"
                    label="Logout URL"
                    onChange={(e) => handleChange(e)}
                    value={samlFormValues.logoutUrl.value}
                    error={samlFormValues.logoutUrl.error}
                    helperText={
                      samlFormValues.logoutUrl.error &&
                      samlFormValues.logoutUrl.errorMessage
                    }
                  />
                  <TextField
                    name="entityId"
                    label="Entity ID"
                    onChange={(e) => handleChange(e)}
                    value={samlFormValues.entityId.value}
                    error={samlFormValues.entityId.error}
                    helperText={
                      samlFormValues.entityId.error &&
                      samlFormValues.entityId.errorMessage
                    }
                  />
                  <TextField
                    name="x509Certificate"
                    label="X.509 Certificate"
                    multiline
                    minRows={6}
                    onChange={(e) => handleChange(e)}
                    value={samlFormValues.x509Certificate.value}
                    error={samlFormValues.x509Certificate.error}
                    helperText={
                      samlFormValues.x509Certificate.error &&
                      samlFormValues.x509Certificate.errorMessage
                    }
                  />
                  {user ? (
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
                      localStorage.removeItem("samlFormValues");
                      location.reload();
                    }}
                    color="error"
                    sx={{ marginLeft: 2 }}
                  >
                    Reset
                  </Button>
                </Box>
              </form>
            </Box>
          </Paper>
        </Grid>
        {user && (
          <Grid size={6}>
            <AssertionData user={user} samlResponse={samlResponse} />
          </Grid>
        )}
      </Grid>
    </>
  );
}
