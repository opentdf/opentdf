import { Affix } from "rsuite";
import NavigationBar from "./nav-bar";
import banner from '../opentdf_banner.jpeg';
import "../App.css";

function Home() {
  return (
    <div>
    <Affix>
    <NavigationBar />
    </Affix>
      <header className="App-header">
        <img src={banner} alt="logo" />
        <h1>
          Coming Soon
        </h1>
        <p>Our website is under construction. Stay tuned!</p>
      </header>
    </div>
  );
}

export default Home;