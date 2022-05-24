import { Navbar, Nav } from "rsuite";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons'
import logo from '../opentdf-logo.png';

const githubIcon = <FontAwesomeIcon icon={faGithub} />
const twitterIcon = <FontAwesomeIcon icon={faTwitter} />

const NavigationBar = () => {
  return (
    <Navbar style={{ background: "#68ABE5", paddingRight: "2vh"}}>
      <Nav>
        <Nav.Item>
        <img src={logo} className="opentdf-logo" alt="logo" />
        </Nav.Item>
      </Nav>
      <Nav pullRight>
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
};

export default NavigationBar;