import { Navbar, Nav } from "rsuite";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons'
import logo from '../opentdf-nav-logo-transparent.png';
import "../App.css";

const githubIcon = <FontAwesomeIcon icon={faGithub} size="xl" color="#004B87"/>
const twitterIcon = <FontAwesomeIcon icon={faTwitter} size="xl" color="#004B87"/>

function NavigationBar() {
  return (
    <Navbar style={{ background: "#061e49", height: "10vh"}}>
      <Nav style={{paddingTop: "2vh"}}>
        <Nav.Item>
        <img src={logo} className="opentdf-logo" alt="logo" />
        </Nav.Item>
      </Nav>
      <Nav pullRight style={{padding: "2vh", color: "#004B87", fontWeight: "bold", fontSize:"2vh"}}>
        <Nav.Item href="https://opentdf.stoplight.io/docs/opentdf-full-api-documentation/branches/main/pqb9cavidvql2-open-tdf">
            API
        </Nav.Item>
        <Nav.Item 
            icon={githubIcon}
            href="https://github.com/opentdf">
        </Nav.Item>
        <Nav.Item 
            icon={twitterIcon}
            href="https://twitter.com/openTDF">
        </Nav.Item>
      </Nav>
    </Navbar>
  );
}

export default NavigationBar;