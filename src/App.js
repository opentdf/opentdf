import Home from "./components/home"
import Info from './components/info'
import "rsuite/dist/rsuite.min.css";


function App() {
  return (
    <div>
      <div className="lightblue-bg">
        <Home />
        <br></br>
      </div>
      <div>
        <Info className="info-section" />
      </div>
    </div>
  );
}

export default App;
