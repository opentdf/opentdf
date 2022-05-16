import { Navbar, Nav } from "rsuite";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import logo from '../opentdf-logo.png';

const githubIcon = <FontAwesomeIcon icon={faGithub} />
const NavigationBar = () => {
  return (
    <Navbar style={{ background: "black", opacity: ".4"}}>
    {/* <Navbar.Brand href="#">
    <img src={logo} className="opentdf-logo" alt="logo" />
    </Navbar.Brand> */}
      <Nav>
        <Nav.Item>
        <img src={logo} className="opentdf-logo" alt="logo" />
        </Nav.Item>
      </Nav>
      <Nav pullRight>
        <Nav.Item onSelect={() => console.log("GOTO API")}>API</Nav.Item>
        <Nav.Item 
            icon={githubIcon}
            href="https://github.com/opentdf">
        </Nav.Item>
      </Nav>
    </Navbar>
  );
};

export default NavigationBar;