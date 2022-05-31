import Home from "./components/home"
import Info from './components/info'
import { Footer } from "rsuite";
import "rsuite/dist/rsuite.min.css";


function App() {
  return (
    <div>
      <div className="lightblue-bg">
        <Home />
      </div>
      <div>
        <Info className="info-section" />
      </div>
      <div>
        <Footer style={{ background: "#061e49", height: "9vh" }} />
      </div>
    </div>
  );
}

export default App;
