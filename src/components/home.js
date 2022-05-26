import { Affix, Button, FlexboxGrid } from "rsuite";
import NavigationBar from "./nav-bar";
import Banner from "../opentdf-banner.jpeg";

import "../App.css";

function Home() {
  return (
    <div>
      <NavigationBar />
      <div className="header-section">
        <h1>Protect Your Data. Build Your Future.</h1>
        <p>The OpenTDF project is an open set of tools and services that allows you to protect your data everywhere it goes.</p>
        <div className="header-detail">
          <Button
            appearance="primary"
            href="https://github.com/opentdf/documentation/tree/main/quickstart"
          >
            Get Started
          </Button>
          <Button
            appearance="primary"
            href="https://github.com/orgs/opentdf/"
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
