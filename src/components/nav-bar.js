import { Navbar, Nav } from "rsuite";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import logo from '../opentdf-name-logo.png';
import githubIcon from '../github-logo.png';
import twitterIcon from "../twitter-logo.png";
import "../App.css";


function NavigationBar() {
  return (
    <Navbar style={{ background: "#061e49", height: "9vh" }}>
      <Nav style={{ paddingTop: "1vh" }}>
        <Nav.Item>
          <img src={logo} className="opentdf-logo" alt="logo" />
        </Nav.Item>
      </Nav>
      <Nav
        pullRight
        style={{
          padding: "1vh",
          color: "white",
          fontWeight: "bold",
          fontSize: "2vh",
        }}
      >
        <Nav.Item href="https://opentdf.stoplight.io/docs/opentdf-full-api-documentation/branches/main/pqb9cavidvql2-open-tdf">
          API
        </Nav.Item>
        <Nav.Item>
          <img
            src={githubIcon}
            className="opentdf-logo"
            alt="github"
            href="https://github.com/opentdf"
          />
        </Nav.Item>
        <Nav.Item>
          <img
            src={twitterIcon}
            className="opentdf-logo"
            alt="twitter"
            href="https://twitter.com/openTDF"
          />
        </Nav.Item>
      </Nav>
    </Navbar>
  );
}

export default NavigationBar;