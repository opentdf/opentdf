import { Affix, Button, FlexboxGrid } from "rsuite";
import NavigationBar from "./nav-bar";
import Banner from "../opentdf-banner.jpeg";

import "../App.css";

function Home() {
  return (
    <div>
      <NavigationBar />
      <div className="header-section">
        <h1>Protect Your Data. Control Your Keys. Build Your Future.</h1>
        <div className="header-detail">
          <p>
            Just getting started? See our Quickstart Guide to run a simple local
            cluster of OpenTDF services
          </p>
          <Button
            className="light-blue-theme"
            appearance="primary"
            href="https://github.com/opentdf/documentation/tree/main/quickstart"
          >
            Quickstart
          </Button>
          <p>
            Ready to Integrate? Download packages directly from the Github
            Container Registry!
          </p>
          <Button
            className="light-blue-theme"
            appearance="primary"
            href="https://github.com/orgs/opentdf/packages"
          >
            Download Packages
          </Button>
        </div>
        {/* <img src={Banner} className="OpenTDF-Banner" alt="OpenTDF" /> */}
        {/* <h1>Protect Your Data. Control Your Keys. Build Your Future.</h1> */}
      </div>
    </div>
  );
}

export default Home;
