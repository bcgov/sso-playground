"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import theme from "@/theme";
import { useMediaQuery } from "@mui/material";
import { useState } from "react";

const menuItems = [
  { label: "OpenID-Connect", path: "/" },
  { label: "SAML", path: "/saml" },
];

function ResponsiveAppBar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const pathname = usePathname();
  const router = useRouter();

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    handleCloseMenu();
  };

  return (
    <>
      <AppBar
        position="static"
        sx={{ backgroundColor: "#003366", borderBottom: "2px solid #fcba19" }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Image
              src="/bc_logo_header.svg"
              alt="Logo"
              width={160}
              height={60}
              style={{ marginRight: "10px" }}
            />
            <Typography
              variant="h5"
              noWrap
              component="a"
              href="/"
              sx={{
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "#fff",
                textDecoration: "none",
                paddingLeft: "20px",
                flexGrow: 1,
              }}
            >
              SSO Playground
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>
      <Box
        sx={{
          flexGrow: 0,
          backgroundColor: "#38598a",
          height: "50px",
          alignItems: "center",
          paddingLeft: 2,
        }}
      >
        <Toolbar variant="dense">
          {isMobile ? (
            <>
              <IconButton
                size="large"
                aria-label="menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "center",
                  horizontal: "center",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
              >
                {menuItems.map((item) => (
                  <MenuItem
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    selected={pathname === item.path}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <>
              {menuItems.map((item) => {
                const isActive = pathname === item.path;

                return (
                  <Button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      color: "white",
                      borderBottom: isActive ? "2px solid #fcba19" : "none",
                      borderRadius: 0,
                      textTransform: "none",
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </>
          )}
        </Toolbar>
      </Box>
    </>
  );
}
export default ResponsiveAppBar;
