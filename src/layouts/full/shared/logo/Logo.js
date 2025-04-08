import { Link } from "react-router-dom";
import { Typography } from "@mui/material";
import { styled } from "@mui/material";

const LinkStyled = styled(Link)(() => ({
  height: "70px",
  width: "180px",
  overflow: "hidden",
  display: "block",
}));

const Logo = () => {
  return (
    <LinkStyled
      to="/"
      height={70}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
        RMK
      </Typography>
    </LinkStyled>
  );
};

export default Logo;
