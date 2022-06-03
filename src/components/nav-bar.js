import { Navbar, Nav } from "rsuite";
import logo from "../opentdf-name-logo.png";
import githubIcon from "../github-logo.png";
import twitterIcon from "../twitter-logo.png";
import { headerFooterStyle as navbarStyle } from "../styles";

function NavigationBar() {
  return (
    <Navbar style={navbarStyle}>
      <Nav style={navPadding}>
        <Nav.Item>
          <img src={logo} className="opentdf-logo" alt="logo" />
        </Nav.Item>
      </Nav>
      <Nav pullRight style={rightNavStyle}>
        <Nav.Item href="https://opentdf.stoplight.io/docs/opentdf-full-api-documentation/branches/main/pqb9cavidvql2-open-tdf">
          API
        </Nav.Item>
        <Nav.Item href="https://github.com/opentdf">
          <img src={githubIcon} className="opentdf-logo" alt="github" />
        </Nav.Item>
        <Nav.Item href="https://twitter.com/openTDF">
          <img src={twitterIcon} className="opentdf-logo" alt="twitter" />
        </Nav.Item>
      </Nav>
    </Navbar>
  );
}

const navPadding = { padding: "1vh" };

const rightNavStyle = {
  ...navPadding,
  paddingRight: "2vh",
  align: "center",
  color: "white",
  fontWeight: "bold",
  fontSize: "2vh",
};

export default NavigationBar;
