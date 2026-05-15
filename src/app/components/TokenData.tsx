"use client";

import {
  Paper,
  Box,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Autocomplete,
  Tooltip,
  Button,
  Icon,
  IconButton,
} from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { TextField } from "./TextField";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface TableDataProps {
  token: string;
}

const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text);
};

const CopyToClipboardButton = ({ text }: { text: string }) => {
  return (
    <Tooltip title="Copy to clipboard">
      <Button
        onClick={() => handleCopy(text)}
        style={{ margin: "10px 0px" }}
        variant="outlined"
        size="small"
      >
        Copy
      </Button>
    </Tooltip>
  );
};

const CopytoClipboardIcon = ({ text }: { text: string }) => {
  return (
    <Tooltip title="Copy to clipboard">
      <IconButton onClick={() => handleCopy(text)} size="small">
        <ContentCopyIcon sx={{ fontSize: "16px" }} />
      </IconButton>
    </Tooltip>
  );
};

const TableData = (props: TableDataProps) => {
  const { token } = props;
  const decodedToken = (token: string) => {
    if (!token) return;
    try {
      if (token.trim().startsWith("{")) {
        return JSON.parse(token);
      }
      return jwtDecode(token);
    } catch (err) {
      console.error("Failed to decode token:", err);
      return JSON.parse(token);
    }
  };

  const unixTimestampToDate = (timestamp: number) => {
    return new Date(timestamp * 1000);
  };

  function renderCellValue(key: any, val: any): import("react").ReactNode {
    if (typeof val === "object" && val !== null) {
      return JSON.stringify(val);
    }
    if (key === "exp" || key === "iat" || key === "nbf") {
      return (
        <Tooltip title={unixTimestampToDate(val).toLocaleString()}>
          <span>{val}</span>
        </Tooltip>
      );
    }
    return String(val);
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Claim</TableCell>
          <TableCell>Value</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(decodedToken(JSON.stringify(token)) || {}).map(
          ([key, val]: any) => (
            <TableRow key={key}>
              <TableCell>{key}</TableCell>
              <TableCell sx={{ wordBreak: "break-all" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {renderCellValue(key, val)}
                  <CopytoClipboardIcon text={JSON.stringify(val)} />
                </div>
              </TableCell>
            </TableRow>
          )
        )}
      </TableBody>
    </Table>
  );
};

interface TokenDataProps {
  tokens: any;
}

export default function TokenData(props: Readonly<TokenDataProps>) {
  const { tokens } = props;
  const [tabIndex, setTabIndex] = useState(0);
  const [token, setToken] = useState<string>("");

  return (
    <Paper elevation={3} sx={{ padding: 1, margin: 1 }}>
      <Box sx={{ padding: 1 }}>
        <Autocomplete
          disablePortal
          options={Object.keys(tokens).filter((key) => key.endsWith("token"))}
          renderInput={(params) => (
            <TextField {...params} label="Select Token..." />
          )}
          onChange={(e, newValue) => setToken(newValue as string)}
        />
        {token && (
          <>
            <Tabs
              value={tabIndex}
              onChange={(e, newValue) => setTabIndex(newValue)}
            >
              <Tab label="Decoded" />
              <Tab label="Raw" />
            </Tabs>
            {tabIndex === 0 ? (
              <TableData token={tokens[token]} />
            ) : (
              <>
                <CopyToClipboardButton
                  text={
                    typeof tokens[token] === "object"
                      ? JSON.stringify(tokens[token])
                      : tokens[token]
                  }
                />
                <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
                  {typeof tokens[token] === "object"
                    ? JSON.stringify(tokens[token], null, 2)
                    : tokens[token]}
                </Typography>
              </>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}
