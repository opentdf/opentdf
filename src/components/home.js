import NavigationBar from "./nav-bar";
import Banner from "../opentdf-banner.jpeg";

import "../App.css";

function Home() {
  return (
    <div>
      <NavigationBar />
      <div className="header-wrapper">
        <div className="header-section white-font">
          <h2>Protect Your Data. Build Your Future.</h2>
          <p className="subheader">
            The OpenTDF project is an open set of tools and services that allows
            you to protect your data everywhere it goes.
          </p>
          <div className="header-detail">
            <button 
              style={{marginRight: "1vw", backgroundColor:"white",color:"#04A777", padding: "6px 18px", fontWeight: "bold", border: "white", borderStyle:"solid" }}
              href="https://github.com/opentdf/documentation/tree/main/quickstart"
            >
              Get Started
            </button>
            <button
              style={{color:"white", backgroundColor: "transparent", padding: "6px 18px", border: "white", borderStyle:"solid"}}
              href="https://github.com/orgs/opentdf/"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
