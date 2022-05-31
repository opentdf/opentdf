function Home() {
  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
        <h2>Protect Your Data. Build Your Future.</h2>
        <p style={headerDetailStyle}>
          The OpenTDF project is an open set of tools and services that allows
          you to protect your data everywhere it goes.
        </p>
        <a
          style={getStartedButtonStyle}
          href="https://github.com/opentdf/documentation/tree/main/quickstart#opentdf-quickstart"
        >
          Get Started
        </a>
        <a style={learnMoreButtonStyle} href="https://github.com/orgs/opentdf/">
          Learn More
        </a>
      </div>
    </div>
  );
}

const buttonStyle = {
  appearance: "button",
  WebkitAppearance: "button",
  MozAppearance: "button",
  textDecoration: "none",
  padding: "6px 18px",
  fontWeight: "bold",
  border: "white",
  borderStyle: "solid",
  borderWidth: "thin",
  marginTop: "10px",
};

const getStartedButtonStyle = {
  marginRight: "1vw",
  backgroundColor: "white",
  color: "#04A777",
  ...buttonStyle,
};

const learnMoreButtonStyle = {
  color: "white",
  backgroundColor: "transparent",
  ...buttonStyle,
};

const wrapperStyle = {
  backgroundImage: "linear-gradient(to right, #5EB29E, #1C4880)",
  padding: "26vh 20vw",
  height: "82vh",
};

const headerStyle = {
  textAlign: "left",
  width: "55vw",
  color: "white",
};

const headerDetailStyle = {
  fontSize: "large",
};

export default Home;
