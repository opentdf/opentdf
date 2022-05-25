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
          <p>
            Just getting started? Check out our Quickstart Guide:
          </p>
          <Button
            className="light-blue-theme"
            appearance="primary"
            href="https://github.com/opentdf/documentation/tree/main/quickstart"
          >
            Quickstart
          </Button>
          <p>
            Ready to Integrate? Download packages here:
          </p>
          <Button
            className="light-blue-theme"
            appearance="primary"
            href="https://github.com/orgs/opentdf/packages"
          >
            Download Packages
          </Button>
          <p>
            Want to learn more? Access examples, documentation, and more on Github:
          </p>
          <Button
            className="light-blue-theme"
            appearance="primary"
            href="https://github.com/orgs/opentdf/"
          >
            OpenTDF
          </Button>
        </div>
        {/* <img src={Banner} className="OpenTDF-Banner" alt="OpenTDF" /> */}
        {/* <h1>Protect Your Data. Control Your Keys. Build Your Future.</h1> */}
      </div>
    </div>
  );
}

export default Home;
