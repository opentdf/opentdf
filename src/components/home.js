function Home() {
  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
   
      <h2>OpenTDF - Protect The Data, Build The Future</h2>
<p style={headerDetailStyle} >The OpenTDF (Trusted Data Format) is a foundational platform that allows you to build and integrate “forever control” of your or your users’ respective data into new and existing applications. Yes, OpenTDF includes encryption, but it is much more than that.</p>

<p style={headerDetailStyle} >The OpenTDF includes additional cryptographically secured metadata that can ensure policy control throughout the lifecycle of data. Imagine being able to grant or revoke, “turn off”, access to your data at any time, even if it is not contained within your own network or application anymore.</p>
<h2>Zero Trust and OpenTDF</h2>
<p style={headerDetailStyle} >The concept of forever control stems from an increasingly common concept known as <em>zero trust</em>. Zero trust removes the implicit trust that many of us have granted to our data throughout its historical lifecycle. Zero trust says don’t release the data unless there is a way to maintain control over it.</p>

<p style={headerDetailStyle} >While the idea of zero trust sounds great, making it happen is a bit more difficult. That’s where the OpenTDF comes in. By implementing or integrating the OpenTDF into applications and projects, the appropriate owner of a respective piece of data can maintain control over that data forever, or at least as long as the data has not yet completed its intended lifecycle.</p>
<h2>Project Overview and Current State</h2>
<p style={headerDetailStyle} >The OpenTDF project was released with a view towards a community being able to build hosted and scalable projects. It therefore involves a Kubernetes cluster and several other services to facilitate full functionality and scalability. Don’t let that deter you, though. In the Getting started section you’ll find guides to get you started on a local node quickly and easily.</p>
<p style={headerDetailStyle} >There are many example projects included in the OpenTDF GitHub repos. These should help you familiarize yourself with how and what you can do with the OpenTDF project. Bear in mind, the OpenTDF project is open source. You’re not only welcomed, but you are encouraged to contribute to both its code base as well as its guided future.</p>

<p style={headerDetailStyle} >The company behind the initial launch of the OpenTDF project, Virtru, is actively soliciting feedback and suggestions for where Virtru can most help with the future of this community endeavor. For example, one such idea that is currently being explored is a scaled-back version of an OpenTDF quick start for smaller, more point-solution projects, as opposed to platform-based, scalable solutions.</p>
<h2>Getting Started</h2>
<p style={headerDetailStyle} >The open source code and project for OpenTDF are hosted at <a href="https://github.com/opentdf">GitHub here</a>. If you want to jump directly into building out an OpenTDF environment, the best place to start is the <a style={linkStyle} href="https://github.com/opentdf/opentdf/tree/main/quickstart">Quickstart Guide here</a>. To get a better idea of what you can do with OpenTDF, and some example code of how to do it, refer to the Example Projects.</p>
<h2>Example Projects</h2>
<p style={headerDetailStyle} >Current example projects for the OpenTDF <a style={linkStyle} href="https://github.com/opentdf/opentdf/tree/main/examples">can be found here</a>. All of the example projects are built on top of the Quickstart project reference in the guide in Getting Started. For now, many of the guides for the code exist inline with the projects and examples on GitHub. As the OpenTDF project grows, the intention is to migrate explanations, example overviews, guides, and interactions that aren’t directly related to source code to this core site, opentdf.io.</p>
<p style={headerDetailStyle} >Two example projects of note are a <a href="https://github.com/opentdf/opentdf/tree/main/examples/secure-remote-storage">secure remote storage</a> application, as well as a simple <a style={linkStyle} href="https://github.com/opentdf/opentdf/tree/main/examples/webcam-app">webcam app</a>. They demonstrate some of the capabilities of using the OpenTDF in a real world scenario. All of the example projects being with the same prerequisites, outlined in the readme.md at the bottom of the page.</p>
<h2>Supporting Projects</h2>
<h3>Keycloak</h3>
<p style={headerDetailStyle} ><a style={linkStyle} href="https://www.keycloak.org/">Keycloak</a> is an identity and access management solution that provides the basis for Attribute Based Access Control (ABAC) for the OpenTDF. You’re free to use any identity and access solution you like in your OpenTDF-based projects, but the repo has a <a href="https://github.com/opentdf/backend/pkgs/container/keycloak">custom build of Keycloak </a>ready to use for reduced time to solution for a proof of concept or minimum viable product (MVP) solution.</p>
<h2>More to Come</h2>
<p style={headerDetailStyle} >The OpenTDF project was only recently announced in June of 2022. There is still a lot of work to be done, but also a lot of opportunity and possibility, as well. We’re excited you’re here. If you don’t find what you’re looking for today, please stop back by regularly. The Virtru team behind OpenTDF and the community as a whole will be continuing our joint efforts to make OpenTDF an easy to understand, easy to implement way for everyone to start owning and controlling their own data as they see fit.</p>
<h2><br/>If there’s something specific you’d love to see, please get involved. Join the <a style={linkStyle} href="https://twitter.com/openTDF">conversation on Twitter</a> or in the <a href="https://opentdf.slack.com/">OpenTDF Slack community</a>!</h2> 

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

const linkStyle = {
  color:"white",
  textDecoration:"underline"
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
  height: "auto",
};

const headerStyle = {
  textAlign: "left",
  width: "55vw",
  color: "white",
};

const headerDetailStyle = {
  fontSize: "large",
  marginBottom: "15px"
};

export default Home;
