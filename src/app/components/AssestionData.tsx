import {
  Grid,
  Box,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Paper,
} from "@mui/material";
import { useState } from "react";
import XMLViewer from "react-xml-viewer";

interface AssertionDataProps {
  user: any;
  samlResponse: string;
}

export const AssertionData = (props: AssertionDataProps) => {
  const { user, samlResponse } = props;
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Paper elevation={3} sx={{ padding: 1, margin: 1 }}>
      <Box sx={{ padding: 1 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
        >
          <Tab label="Decoded" />
          <Tab label="Raw" />
        </Tabs>
        {tabIndex === 0 ? (
          <Table size="small" sx={{ wordBreak: "break-all" }}>
            <TableHead>
              <TableRow>
                <TableCell>Claim</TableCell>
                <TableCell>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(user || {}).map(([key, val]: any) => (
                <TableRow key={key}>
                  <TableCell>{key}</TableCell>
                  <TableCell>
                    {["exp", "iat", "auth_time"].includes(key) ? (
                      <Tooltip title={String(new Date(val * 1000))}>
                        {val}
                      </Tooltip>
                    ) : (
                      String(val)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <XMLViewer
            xml={samlResponse}
            collapsible={true}
            showLineNumbers={true}
          />
        )}
      </Box>
    </Paper>
  );
};
